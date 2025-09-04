// MCP Server Type Definitions

export interface MCPService {
  id: string;
  name: string;
  description: string;
  version: string;
  status: 'active' | 'inactive' | 'error';
  capabilities: {
    tools: string[];
    resources: string[];
  };
  config: Record<string, any>;
  healthCheckUrl?: string;
  lastHealthCheck?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  serviceId: string;
  instruction: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  context?: Record<string, any>;
  result?: Record<string, any>;
  progress: number;
  errorMessage?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface TaskLog {
  id: string;
  taskId: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: Date;
}

export interface ProgressUpdate {
  taskId: string;
  progress: number;
  currentStep: string;
  totalSteps: number;
  completedSteps: number;
  logs: string[];
}

export interface ClientConnection {
  id: string;
  clientId: string;
  clientName?: string;
  clientVersion?: string;
  platform?: string;
  lastSeen: Date;
  status: 'connected' | 'disconnected';
  createdAt: Date;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ExecuteTaskRequest {
  instruction: string;
  serviceId: string;
  context?: Record<string, any>;
}

export interface ExecuteTaskResponse {
  taskId: string;
  status: string;
  estimatedTime?: number;
}

export interface ServiceRegistrationRequest {
  name: string;
  description: string;
  version: string;
  capabilities: {
    tools: string[];
    resources: string[];
  };
  config?: Record<string, any>;
  healthCheckUrl?: string;
}

export interface HealthCheckResult {
  serviceId: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  responseTime?: number;
  error?: string;
  timestamp: Date;
}

export interface ServerConfig {
  port: number;
  nodeEnv: string;
  dbType: string;
  dbPath: string;
  logLevel: string;
  logFile: string;
  corsOrigin: string;
  wsPort: number;
  mcpServicesDir: string;
  mcpRegistryRefreshInterval: number;
  healthCheckInterval: number;
  healthCheckTimeout: number;
  apiKeyRequired: boolean;
  apiKey?: string;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MCPMessage {
  jsonrpc: '2.0';
  id?: string | number;
  method?: string;
  params?: Record<string, any>;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}