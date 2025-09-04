import dotenv from 'dotenv';
import { ServerConfig } from '../types';

// Load environment variables
dotenv.config();

export const config: ServerConfig = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  dbType: process.env.DB_TYPE || 'sqlite',
  dbPath: process.env.DB_PATH || './data/mcp_server.db',
  logLevel: process.env.LOG_LEVEL || 'info',
  logFile: process.env.LOG_FILE || './logs/mcp_server.log',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:*',
  wsPort: parseInt(process.env.WS_PORT || '3002', 10),
  mcpServicesDir: process.env.MCP_SERVICES_DIR || './mcp_services',
  mcpRegistryRefreshInterval: parseInt(process.env.MCP_REGISTRY_REFRESH_INTERVAL || '30000', 10),
  healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '60000', 10),
  healthCheckTimeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT || '5000', 10),
  apiKeyRequired: process.env.API_KEY_REQUIRED === 'true',
  apiKey: process.env.API_KEY,
};

export const isDevelopment = config.nodeEnv === 'development';
export const isProduction = config.nodeEnv === 'production';

// Validate required configuration
export function validateConfig(): void {
  const requiredFields: (keyof ServerConfig)[] = ['port', 'dbPath'];
  
  for (const field of requiredFields) {
    if (!config[field]) {
      throw new Error(`Missing required configuration: ${field}`);
    }
  }
  
  if (config.apiKeyRequired && !config.apiKey) {
    throw new Error('API_KEY is required when API_KEY_REQUIRED is true');
  }
  
  if (config.port < 1 || config.port > 65535) {
    throw new Error('PORT must be between 1 and 65535');
  }
  
  if (config.wsPort < 1 || config.wsPort > 65535) {
    throw new Error('WS_PORT must be between 1 and 65535');
  }
}