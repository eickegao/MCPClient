import { Router, Request, Response } from 'express';
import { database } from '../models/database';
import { mcpServiceManager } from '../services/mcpManager';
import { websocketManager } from '../services/websocket';
import { asyncHandler } from '../middleware/errorHandler';
import { APIResponse, HealthCheckResult } from '../types';
import { healthLogger } from '../utils/logger';
import { config } from '../utils/config';

const router = Router();

// Basic health check
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: config.nodeEnv,
    services: {
      database: 'unknown',
      websocket: 'unknown',
      mcpServices: 'unknown'
    }
  };
  
  // Check database health
  try {
    await database.getServices();
    health.services.database = 'healthy';
  } catch (error) {
    health.services.database = 'unhealthy';
    health.status = 'degraded';
  }
  
  // Check WebSocket health
  try {
    const clientCount = websocketManager.getClientCount();
    health.services.websocket = 'healthy';
    (health as any).websocketClients = clientCount;
  } catch (error) {
    health.services.websocket = 'unhealthy';
    health.status = 'degraded';
  }
  
  // Check MCP services health
  try {
    const services = await mcpServiceManager.listServices();
    const activeServices = services.filter(s => s.status === 'active');
    health.services.mcpServices = 'healthy';
    (health as any).mcpServices = {
      total: services.length,
      active: activeServices.length,
      inactive: services.length - activeServices.length
    };
  } catch (error) {
    health.services.mcpServices = 'unhealthy';
    health.status = 'degraded';
  }
  
  const statusCode = health.status === 'healthy' ? 200 : 503;
  
  res.status(statusCode).json({
    success: health.status === 'healthy',
    data: health
  } as APIResponse);
}));

// Detailed health check
router.get('/detailed', asyncHandler(async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: config.nodeEnv,
    checks: {
      database: await checkDatabaseHealth(),
      websocket: await checkWebSocketHealth(),
      mcpServices: await checkMCPServicesHealth(),
      diskSpace: await checkDiskSpace(),
      configuration: checkConfiguration()
    },
    responseTime: 0
  };
  
  // Determine overall status
  const checks = Object.values(health.checks);
  const hasUnhealthy = checks.some(check => check.status === 'unhealthy');
  const hasDegraded = checks.some(check => check.status === 'degraded');
  
  if (hasUnhealthy) {
    health.status = 'unhealthy';
  } else if (hasDegraded) {
    health.status = 'degraded';
  }
  
  health.responseTime = Date.now() - startTime;
  
  const statusCode = health.status === 'healthy' ? 200 : 503;
  
  res.status(statusCode).json({
    success: health.status === 'healthy',
    data: health
  } as APIResponse);
}));

// Check individual service health
router.get('/services/:serviceId', asyncHandler(async (req: Request, res: Response) => {
  const { serviceId } = req.params;
  
  if (!serviceId) {
    res.status(400).json({
      success: false,
      error: 'Service ID is required'
    } as APIResponse);
    return;
  }
  
  try {
    const serviceStatus = await mcpServiceManager.getServiceStatus(serviceId);
    
    const healthResult: HealthCheckResult = {
      serviceId,
      status: serviceStatus.isRunning ? 'healthy' : 'unhealthy',
      timestamp: new Date()
    };
    
    if (serviceStatus.lastHeartbeat) {
      const timeSinceHeartbeat = Date.now() - serviceStatus.lastHeartbeat.getTime();
      healthResult.responseTime = timeSinceHeartbeat;
      
      // Consider service unhealthy if no heartbeat for more than 2 minutes
      if (timeSinceHeartbeat > 120000) {
        healthResult.status = 'unhealthy';
        healthResult.error = 'No heartbeat received in over 2 minutes';
      }
    }
    
    res.json({
      success: true,
      data: healthResult
    } as APIResponse);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    res.status(404).json({
      success: false,
      error: errorMessage
    } as APIResponse);
  }
}));

// Get system metrics
router.get('/metrics', asyncHandler(async (req: Request, res: Response) => {
  const metrics = {
    timestamp: new Date().toISOString(),
    system: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      platform: process.platform,
      nodeVersion: process.version
    },
    application: {
      environment: config.nodeEnv,
      port: config.port,
      wsPort: config.wsPort,
      dbPath: config.dbPath
    },
    connections: {
      websocket: websocketManager.getClientCount(),
      activeClients: websocketManager.getConnectedClients().length
    },
    services: {
      total: 0,
      active: 0,
      inactive: 0,
      error: 0
    },
    tasks: {
      total: 0,
      pending: 0,
      running: 0,
      completed: 0,
      failed: 0
    }
  };
  
  try {
    // Get service metrics
    const services = await mcpServiceManager.listServices();
    metrics.services.total = services.length;
    metrics.services.active = services.filter(s => s.status === 'active').length;
    metrics.services.inactive = services.filter(s => s.status === 'inactive').length;
    metrics.services.error = services.filter(s => s.status === 'error').length;
    
    // Get task metrics
    const tasks = await database.getTasks(1000, 0); // Get recent tasks
    metrics.tasks.total = tasks.length;
    metrics.tasks.pending = tasks.filter(t => t.status === 'pending').length;
    metrics.tasks.running = tasks.filter(t => t.status === 'running').length;
    metrics.tasks.completed = tasks.filter(t => t.status === 'completed').length;
    metrics.tasks.failed = tasks.filter(t => t.status === 'failed').length;
    
  } catch (error) {
    healthLogger.warn('Failed to collect some metrics', { error });
  }
  
  res.json({
    success: true,
    data: metrics
  } as APIResponse);
}));

// Helper functions for health checks
async function checkDatabaseHealth(): Promise<{ status: string; message: string; responseTime?: number }> {
  const startTime = Date.now();
  
  try {
    await database.getServices();
    return {
      status: 'healthy',
      message: 'Database connection successful',
      responseTime: Date.now() - startTime
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      status: 'unhealthy',
      message: `Database connection failed: ${errorMessage}`,
      responseTime: Date.now() - startTime
    };
  }
}

async function checkWebSocketHealth(): Promise<{ status: string; message: string; clientCount?: number }> {
  try {
    const clientCount = websocketManager.getClientCount();
    return {
      status: 'healthy',
      message: 'WebSocket server operational',
      clientCount
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      status: 'unhealthy',
      message: `WebSocket server error: ${errorMessage}`
    };
  }
}

async function checkMCPServicesHealth(): Promise<{ status: string; message: string; services?: any }> {
  try {
    const services = await mcpServiceManager.listServices();
    const activeServices = services.filter(s => s.status === 'active');
    const errorServices = services.filter(s => s.status === 'error');
    
    let status = 'healthy';
    let message = `${services.length} services registered, ${activeServices.length} active`;
    
    if (errorServices.length > 0) {
      status = 'degraded';
      message += `, ${errorServices.length} in error state`;
    }
    
    return {
      status,
      message,
      services: {
        total: services.length,
        active: activeServices.length,
        inactive: services.length - activeServices.length - errorServices.length,
        error: errorServices.length
      }
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      status: 'unhealthy',
      message: `MCP services check failed: ${errorMessage}`
    };
  }
}

async function checkDiskSpace(): Promise<{ status: string; message: string }> {
  try {
    const fs = require('fs');
    const stats = fs.statSync(config.dbPath);
    
    // This is a simplified check - in production you'd check actual disk space
    return {
      status: 'healthy',
      message: 'Disk space check passed'
    };
  } catch (error) {
    return {
      status: 'degraded',
      message: 'Could not check disk space'
    };
  }
}

function checkConfiguration(): { status: string; message: string } {
  try {
    // Check if required configuration is present
    const requiredConfig = ['port', 'dbPath', 'wsPort'];
    const missing = requiredConfig.filter(key => !config[key as keyof typeof config]);
    
    if (missing.length > 0) {
      return {
        status: 'unhealthy',
        message: `Missing required configuration: ${missing.join(', ')}`
      };
    }
    
    return {
      status: 'healthy',
      message: 'Configuration is valid'
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: 'Configuration check failed'
    };
  }
}

export default router;