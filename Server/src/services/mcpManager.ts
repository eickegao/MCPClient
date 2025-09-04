import { spawn, ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { mcpLogger } from '../utils/logger';
import { config } from '../utils/config';
import { database } from '../models/database';
import { websocketManager } from './websocket';
import { MCPService, Task, ProgressUpdate, MCPMessage, MCPTool, MCPResource } from '../types';

export interface MCPServiceProcess {
  id: string;
  process: ChildProcess;
  status: 'starting' | 'running' | 'stopping' | 'stopped' | 'error';
  lastHeartbeat: Date;
  capabilities?: {
    tools: MCPTool[];
    resources: MCPResource[];
  };
}

export class MCPServiceManager {
  private services = new Map<string, MCPServiceProcess>();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    this.startHealthCheck();
  }
  
  async installService(serviceConfig: {
    name: string;
    description: string;
    version: string;
    command: string;
    args?: string[];
    workingDirectory?: string;
    environment?: Record<string, string>;
    capabilities?: {
      tools: string[];
      resources: string[];
    };
  }): Promise<string> {
    const serviceId = uuidv4();
    
    try {
      // Create service record in database
      const service: Omit<MCPService, 'createdAt' | 'updatedAt'> = {
        id: serviceId,
        name: serviceConfig.name,
        description: serviceConfig.description,
        version: serviceConfig.version,
        status: 'inactive',
        capabilities: serviceConfig.capabilities || { tools: [], resources: [] },
        config: {
          command: serviceConfig.command,
          args: serviceConfig.args || [],
          workingDirectory: serviceConfig.workingDirectory,
          environment: serviceConfig.environment || {}
        }
      };
      
      await database.createService(service);
      
      mcpLogger.info('MCP service installed', {
        serviceId,
        name: serviceConfig.name,
        version: serviceConfig.version
      });
      
      // Notify clients
      websocketManager.sendServiceStatusUpdate(serviceId, 'installed');
      
      return serviceId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      mcpLogger.error('Failed to install MCP service', {
        name: serviceConfig.name,
        error: errorMessage
      });
      throw error;
    }
  }
  
  async startService(serviceId: string): Promise<void> {
    try {
      const serviceRecord = await database.getServiceById(serviceId);
      if (!serviceRecord) {
        throw new Error(`Service ${serviceId} not found`);
      }
      
      if (this.services.has(serviceId)) {
        throw new Error(`Service ${serviceId} is already running`);
      }
      
      const { command, args = [], workingDirectory, environment = {} } = serviceRecord.config;
      
      mcpLogger.info('Starting MCP service', {
        serviceId,
        name: serviceRecord.name,
        command,
        args
      });
      
      // Spawn the MCP service process
      const childProcess = spawn(command, args, {
        cwd: workingDirectory || config.mcpServicesDir,
        env: { ...process.env, ...environment },
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      const serviceProcess: MCPServiceProcess = {
        id: serviceId,
        process: childProcess,
        status: 'starting',
        lastHeartbeat: new Date()
      };
      
      this.services.set(serviceId, serviceProcess);
      
      // Handle process events
      childProcess.on('spawn', () => {
        serviceProcess.status = 'running';
        database.updateServiceStatus(serviceId, 'active');
        websocketManager.sendServiceStatusUpdate(serviceId, 'running');
        mcpLogger.info('MCP service started successfully', { serviceId, name: serviceRecord.name });
      });
      
      childProcess.on('error', (error) => {
        serviceProcess.status = 'error';
        database.updateServiceStatus(serviceId, 'error');
        websocketManager.sendServiceStatusUpdate(serviceId, 'error');
        mcpLogger.error('MCP service error', {
          serviceId,
          name: serviceRecord.name,
          error: error.message
        });
      });
      
      childProcess.on('exit', (code, signal) => {
        serviceProcess.status = 'stopped';
        this.services.delete(serviceId);
        database.updateServiceStatus(serviceId, 'inactive');
        websocketManager.sendServiceStatusUpdate(serviceId, 'stopped');
        mcpLogger.info('MCP service exited', {
          serviceId,
          name: serviceRecord.name,
          code,
          signal
        });
      });
      
      // Handle stdout for MCP protocol communication
      childProcess.stdout?.on('data', (data) => {
        this.handleMCPMessage(serviceId, data.toString());
      });
      
      // Handle stderr for logging
      childProcess.stderr?.on('data', (data) => {
        mcpLogger.warn('MCP service stderr', {
          serviceId,
          name: serviceRecord.name,
          message: data.toString().trim()
        });
      });
      
      // Initialize MCP protocol
      await this.initializeMCPProtocol(serviceId);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      mcpLogger.error('Failed to start MCP service', { serviceId, error: errorMessage });
      await database.updateServiceStatus(serviceId, 'error');
      throw error;
    }
  }
  
  async stopService(serviceId: string): Promise<void> {
    const serviceProcess = this.services.get(serviceId);
    if (!serviceProcess) {
      throw new Error(`Service ${serviceId} is not running`);
    }
    
    try {
      serviceProcess.status = 'stopping';
      
      // Send graceful shutdown signal
      serviceProcess.process.kill('SIGTERM');
      
      // Wait for graceful shutdown, then force kill if necessary
      setTimeout(() => {
        if (this.services.has(serviceId)) {
          serviceProcess.process.kill('SIGKILL');
        }
      }, 5000);
      
      mcpLogger.info('MCP service stop requested', { serviceId });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      mcpLogger.error('Failed to stop MCP service', { serviceId, error: errorMessage });
      throw error;
    }
  }
  
  async executeTask(serviceId: string, instruction: string, context?: Record<string, any>): Promise<string> {
    const serviceProcess = this.services.get(serviceId);
    if (!serviceProcess || serviceProcess.status !== 'running') {
      throw new Error(`Service ${serviceId} is not running`);
    }
    
    const taskId = uuidv4();
    
    try {
      // Create task record
      const task: Omit<Task, 'createdAt' | 'completedAt'> = {
        id: taskId,
        serviceId,
        instruction,
        status: 'pending',
        context,
        progress: 0
      };
      
      await database.createTask(task);
      
      mcpLogger.info('Task created', { taskId, serviceId, instruction });
      
      // For this demo, we'll parse simple math instructions
      // In a real implementation, you'd use an LLM to parse the instruction
      const toolCall = this.parseInstruction(instruction);
      
      // Send task to MCP service
      const mcpMessage: MCPMessage = {
        jsonrpc: '2.0',
        id: taskId,
        method: 'tools/call',
        params: {
          name: toolCall.tool,
          arguments: toolCall.arguments
        }
      };
      
      await this.sendMCPMessage(serviceId, mcpMessage);
      
      // Update task status
      await database.updateTask(taskId, { status: 'running' });
      
      // Send progress update
      const progressUpdate: ProgressUpdate = {
        taskId,
        progress: 10,
        currentStep: 'Task sent to MCP service',
        totalSteps: 100,
        completedSteps: 10,
        logs: ['Task created and sent to MCP service']
      };
      
      websocketManager.sendTaskProgress(taskId, progressUpdate);
      
      return taskId;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      mcpLogger.error('Failed to execute task', { taskId, serviceId, error: errorMessage });
      
      await database.updateTask(taskId, {
        status: 'failed',
        errorMessage,
        completedAt: new Date()
      });
      
      throw error;
    }
  }
  
  private async initializeMCPProtocol(serviceId: string): Promise<void> {
    const initMessage: MCPMessage = {
      jsonrpc: '2.0',
      id: 'init',
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
          resources: {}
        },
        clientInfo: {
          name: 'MCP Server',
          version: '1.0.0'
        }
      }
    };
    
    await this.sendMCPMessage(serviceId, initMessage);
  }
  
  private async sendMCPMessage(serviceId: string, message: MCPMessage): Promise<void> {
    const serviceProcess = this.services.get(serviceId);
    if (!serviceProcess || !serviceProcess.process.stdin) {
      throw new Error(`Cannot send message to service ${serviceId}`);
    }
    
    const messageStr = JSON.stringify(message) + '\n';
    serviceProcess.process.stdin.write(messageStr);
    
    mcpLogger.debug('Sent MCP message', { serviceId, method: message.method, id: message.id });
  }
  
  private handleMCPMessage(serviceId: string, data: string): void {
    try {
      const lines = data.trim().split('\n');
      
      for (const line of lines) {
        if (!line.trim()) continue;
        
        const message: MCPMessage = JSON.parse(line);
        
        mcpLogger.debug('Received MCP message', {
          serviceId,
          method: message.method,
          id: message.id
        });
        
        this.processMCPMessage(serviceId, message);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      mcpLogger.error('Failed to parse MCP message', { serviceId, error: errorMessage, data });
    }
  }
  
  private async processMCPMessage(serviceId: string, message: MCPMessage): Promise<void> {
    try {
      if (message.method === 'initialize') {
        // Handle initialization response
        const serviceProcess = this.services.get(serviceId);
        if (serviceProcess && message.result) {
          serviceProcess.capabilities = message.result.capabilities;
          mcpLogger.info('MCP service initialized', {
            serviceId,
            capabilities: message.result.capabilities
          });
        }
      } else if (message.id && typeof message.id === 'string') {
        // Handle task response
        const taskId = message.id;
        
        if (message.result) {
          // Task completed successfully
          await database.updateTask(taskId, {
            status: 'completed',
            result: message.result,
            progress: 100,
            completedAt: new Date()
          });
          
          websocketManager.sendTaskCompleted(taskId, message.result);
          
          mcpLogger.info('Task completed', { taskId, serviceId });
        } else if (message.error) {
          // Task failed
          await database.updateTask(taskId, {
            status: 'failed',
            errorMessage: message.error.message,
            completedAt: new Date()
          });
          
          mcpLogger.error('Task failed', {
            taskId,
            serviceId,
            error: message.error.message
          });
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      mcpLogger.error('Failed to process MCP message', { serviceId, error: errorMessage });
    }
  }
  
  private parseInstruction(instruction: string): { tool: string; arguments: Record<string, any> } {
    // Simple instruction parser for demo purposes
    // In production, you'd use a more sophisticated NLP approach or LLM
    
    const lowerInstruction = instruction.toLowerCase();
    
    // Extract numbers from the instruction
    const numbers = instruction.match(/\d+(?:\.\d+)?/g)?.map(Number) || [];
    
    if (lowerInstruction.includes('add') && numbers.length >= 2) {
      return {
        tool: 'add',
        arguments: { a: numbers[0], b: numbers[1] }
      };
    }
    
    if (lowerInstruction.includes('multiply') && numbers.length >= 2) {
      return {
        tool: 'multiply',
        arguments: { a: numbers[0], b: numbers[1] }
      };
    }
    
    if (lowerInstruction.includes('divide') && numbers.length >= 2) {
      return {
        tool: 'divide',
        arguments: { a: numbers[0], b: numbers[1] }
      };
    }
    
    // Default fallback
    throw new Error(`Could not parse instruction: ${instruction}. Please use format like 'add 5 and 3' or 'multiply 4 and 6'`);
  }
  
  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(async () => {
      for (const [serviceId, serviceProcess] of this.services.entries()) {
        try {
          // Check if process is still alive
          if (serviceProcess.process.killed || serviceProcess.process.exitCode !== null) {
            serviceProcess.status = 'stopped';
            this.services.delete(serviceId);
            await database.updateServiceStatus(serviceId, 'inactive');
            continue;
          }
          
          // Send ping message
          const pingMessage: MCPMessage = {
            jsonrpc: '2.0',
            id: 'ping',
            method: 'ping'
          };
          
          await this.sendMCPMessage(serviceId, pingMessage);
          serviceProcess.lastHeartbeat = new Date();
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          mcpLogger.warn('Health check failed for service', { serviceId, error: errorMessage });
        }
      }
    }, config.healthCheckInterval);
  }
  
  async getServiceStatus(serviceId: string): Promise<{
    id: string;
    status: string;
    isRunning: boolean;
    lastHeartbeat?: Date;
    capabilities?: any;
  }> {
    const serviceRecord = await database.getServiceById(serviceId);
    if (!serviceRecord) {
      throw new Error(`Service ${serviceId} not found`);
    }
    
    const serviceProcess = this.services.get(serviceId);
    
    return {
      id: serviceId,
      status: serviceRecord.status,
      isRunning: serviceProcess?.status === 'running' || false,
      lastHeartbeat: serviceProcess?.lastHeartbeat,
      capabilities: serviceProcess?.capabilities
    };
  }
  
  async listServices(): Promise<MCPService[]> {
    return await database.getServices();
  }
  
  async removeService(serviceId: string): Promise<void> {
    // Stop service if running
    if (this.services.has(serviceId)) {
      await this.stopService(serviceId);
    }
    
    // Remove from database
    await database.deleteService(serviceId);
    
    mcpLogger.info('MCP service removed', { serviceId });
    websocketManager.sendServiceStatusUpdate(serviceId, 'removed');
  }
  
  shutdown(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    // Stop all running services
    for (const [serviceId] of this.services.entries()) {
      this.stopService(serviceId).catch(error => {
        mcpLogger.error('Error stopping service during shutdown', { serviceId, error });
      });
    }
    
    mcpLogger.info('MCP Service Manager shutdown complete');
  }
}

// Singleton instance
export const mcpServiceManager = new MCPServiceManager();