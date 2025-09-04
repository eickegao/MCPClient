import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config, validateConfig } from './utils/config';
import { logger, logRequest } from './utils/logger';
import { database } from './models/database';
import { websocketManager } from './services/websocket';
import { authenticateApiKey, rateLimit, configureCors } from './middleware/auth';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { APIResponse } from './types';
import healthRouter from './routes/health';
import servicesRouter from './routes/services';
import tasksRouter from './routes/tasks';

export class MCPServer {
  private app: express.Application;
  private server: any;
  
  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }
  
  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      crossOriginEmbedderPolicy: false
    }));
    
    // CORS middleware
    this.app.use(cors(configureCors()));
    
    // Request parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Logging middleware
    if (config.nodeEnv === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined'));
    }
    this.app.use(logRequest);
    
    // Rate limiting
    this.app.use(rateLimit);
    
    // Authentication middleware (applied to API routes)
    this.app.use('/api', authenticateApiKey);
  }
  
  private setupRoutes(): void {
    // Health check endpoint (no auth required)
    this.app.use('/health', healthRouter);
    
    // API info endpoint
    this.app.get('/api', (req, res) => {
      res.json({
        success: true,
        data: {
          name: 'MCP Server API',
          version: '1.0.0',
          description: 'Model Context Protocol Server - HTTP API for managing and executing MCP services',
          endpoints: {
            health: '/health',
            services: '/api/services',
            tasks: '/api/tasks',
            websocket: `ws://localhost:${config.wsPort}`
          },
          documentation: 'https://github.com/your-org/mcp-server'
        }
      } as APIResponse);
    });
    
    // API routes
    this.app.use('/api/services', servicesRouter);
    this.app.use('/api/tasks', tasksRouter);
    
    // WebSocket info endpoint
    this.app.get('/api/websocket/info', (req, res) => {
      const clients = websocketManager.getConnectedClients();
      res.json({
        success: true,
        data: {
          port: config.wsPort,
          connectedClients: clients.length,
          clients: clients.map(client => ({
            id: client.id,
            clientId: client.clientId,
            clientName: client.clientName,
            platform: client.platform,
            lastSeen: client.lastSeen,
            subscriptions: Array.from(client.subscriptions)
          }))
        }
      } as APIResponse);
    });
  }
  
  private setupErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);
    
    // Global error handler
    this.app.use(errorHandler);
  }
  
  async start(): Promise<void> {
    try {
      // Validate configuration
      validateConfig();
      
      // Initialize database
      await database.initialize();
      
      // Initialize WebSocket server
      websocketManager.initialize(config.wsPort);
      
      // Start HTTP server
      this.server = this.app.listen(config.port, () => {
        logger.info('MCP Server started successfully', {
          port: config.port,
          wsPort: config.wsPort,
          nodeEnv: config.nodeEnv,
          dbPath: config.dbPath
        });
      });
      
      // Handle graceful shutdown
      this.setupGracefulShutdown();
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to start MCP Server', { error: errorMessage });
      throw error;
    }
  }
  
  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully`);
      
      // Close HTTP server
      if (this.server) {
        this.server.close(() => {
          logger.info('HTTP server closed');
        });
      }
      
      // Close WebSocket server
      websocketManager.close();
      
      // Close database connection
      await database.close();
      
      logger.info('MCP Server shutdown complete');
      process.exit(0);
    };
    
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
      process.exit(1);
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', { reason, promise });
      process.exit(1);
    });
  }
  
  getApp(): express.Application {
    return this.app;
  }
  
  async stop(): Promise<void> {
    if (this.server) {
      this.server.close();
    }
    
    websocketManager.close();
    await database.close();
    
    logger.info('MCP Server stopped');
  }
}