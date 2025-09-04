import WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { wsLogger } from '../utils/logger';
import { ProgressUpdate, ClientConnection } from '../types';
import { database } from '../models/database';

export interface WebSocketClient {
  id: string;
  ws: WebSocket;
  clientId?: string;
  clientName?: string;
  clientVersion?: string;
  platform?: string;
  lastSeen: Date;
  subscriptions: Set<string>; // Task IDs or topics
}

export class WebSocketManager {
  private wss: WebSocket.Server | null = null;
  private clients = new Map<string, WebSocketClient>();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  
  initialize(port: number): void {
    this.wss = new WebSocket.Server({ port });
    
    this.wss.on('connection', (ws: WebSocket, req) => {
      this.handleConnection(ws, req);
    });
    
    this.wss.on('error', (error) => {
      wsLogger.error('WebSocket server error', { error: error.message });
    });
    
    // Start heartbeat to check client connections
    this.startHeartbeat();
    
    wsLogger.info('WebSocket server initialized', { port });
  }
  
  private handleConnection(ws: WebSocket, req: any): void {
    const clientId = uuidv4();
    const client: WebSocketClient = {
      id: clientId,
      ws,
      lastSeen: new Date(),
      subscriptions: new Set()
    };
    
    this.clients.set(clientId, client);
    
    wsLogger.info('Client connected', {
      clientId,
      ip: req.socket.remoteAddress,
      userAgent: req.headers['user-agent']
    });
    
    // Send welcome message
    this.sendToClient(clientId, {
      type: 'welcome',
      clientId,
      timestamp: new Date().toISOString()
    });
    
    // Handle messages
    ws.on('message', (data: WebSocket.Data) => {
      this.handleMessage(clientId, data);
    });
    
    // Handle disconnection
    ws.on('close', (code, reason) => {
      this.handleDisconnection(clientId, code, reason);
    });
    
    // Handle errors
    ws.on('error', (error) => {
      wsLogger.error('WebSocket client error', {
        clientId,
        error: error.message
      });
    });
    
    // Handle pong responses
    ws.on('pong', () => {
      const client = this.clients.get(clientId);
      if (client) {
        client.lastSeen = new Date();
      }
    });
  }
  
  private async handleMessage(clientId: string, data: WebSocket.Data): Promise<void> {
    try {
      const client = this.clients.get(clientId);
      if (!client) return;
      
      client.lastSeen = new Date();
      
      const message = JSON.parse(data.toString());
      wsLogger.debug('Received message', { clientId, type: message.type });
      
      switch (message.type) {
        case 'register':
          await this.handleClientRegistration(clientId, message.data);
          break;
          
        case 'subscribe':
          this.handleSubscription(clientId, message.data);
          break;
          
        case 'unsubscribe':
          this.handleUnsubscription(clientId, message.data);
          break;
          
        case 'ping':
          this.sendToClient(clientId, { type: 'pong', timestamp: new Date().toISOString() });
          break;
          
        default:
          wsLogger.warn('Unknown message type', { clientId, type: message.type });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      wsLogger.error('Error handling message', {
        clientId,
        error: errorMessage
      });
    }
  }
  
  private async handleClientRegistration(clientId: string, data: any): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    // Update client information
    client.clientId = data.clientId || clientId;
    client.clientName = data.clientName;
    client.clientVersion = data.clientVersion;
    client.platform = data.platform;
    
    // Save to database
    const connection: ClientConnection = {
      id: clientId,
      clientId: client.clientId || clientId,
      clientName: client.clientName,
      clientVersion: client.clientVersion,
      platform: client.platform,
      lastSeen: client.lastSeen,
      status: 'connected',
      createdAt: new Date()
    };
    
    await database.updateClientConnection(connection);
    
    wsLogger.info('Client registered', {
      clientId,
      clientName: client.clientName,
      clientVersion: client.clientVersion,
      platform: client.platform
    });
    
    // Send registration confirmation
    this.sendToClient(clientId, {
      type: 'registered',
      data: {
        clientId: client.clientId,
        serverTime: new Date().toISOString()
      }
    });
  }
  
  private handleSubscription(clientId: string, data: any): void {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    const { topic } = data;
    if (topic) {
      client.subscriptions.add(topic);
      wsLogger.debug('Client subscribed', { clientId, topic });
      
      this.sendToClient(clientId, {
        type: 'subscribed',
        data: { topic }
      });
    }
  }
  
  private handleUnsubscription(clientId: string, data: any): void {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    const { topic } = data;
    if (topic) {
      client.subscriptions.delete(topic);
      wsLogger.debug('Client unsubscribed', { clientId, topic });
      
      this.sendToClient(clientId, {
        type: 'unsubscribed',
        data: { topic }
      });
    }
  }
  
  private async handleDisconnection(clientId: string, code: number, reason: Buffer): Promise<void> {
    const client = this.clients.get(clientId);
    if (client) {
      // Update database
      if (client.clientId) {
        const connection: ClientConnection = {
          id: clientId,
          clientId: client.clientId,
          clientName: client.clientName,
          clientVersion: client.clientVersion,
          platform: client.platform,
          lastSeen: new Date(),
          status: 'disconnected',
          createdAt: new Date()
        };
        
        await database.updateClientConnection(connection);
      }
      
      this.clients.delete(clientId);
    }
    
    wsLogger.info('Client disconnected', {
      clientId,
      code,
      reason: reason.toString()
    });
  }
  
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach((client, clientId) => {
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.ping();
        } else {
          this.clients.delete(clientId);
        }
      });
    }, 30000); // 30 seconds
  }
  
  // Public methods for sending messages
  sendToClient(clientId: string, message: any): boolean {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) {
      return false;
    }
    
    try {
      client.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      wsLogger.error('Error sending message to client', {
        clientId,
        error: errorMessage
      });
      return false;
    }
  }
  
  broadcastToSubscribers(topic: string, message: any): number {
    let sentCount = 0;
    
    this.clients.forEach((client, clientId) => {
      if (client.subscriptions.has(topic)) {
        if (this.sendToClient(clientId, {
          type: 'broadcast',
          topic,
          data: message
        })) {
          sentCount++;
        }
      }
    });
    
    return sentCount;
  }
  
  sendTaskProgress(taskId: string, progress: ProgressUpdate): void {
    const message = {
      type: 'task_progress',
      data: progress
    };
    
    // Send to clients subscribed to this task
    this.broadcastToSubscribers(`task:${taskId}`, message);
    
    // Also send to clients subscribed to all tasks
    this.broadcastToSubscribers('tasks:all', message);
  }
  
  sendTaskCompleted(taskId: string, result: any): void {
    const message = {
      type: 'task_completed',
      data: {
        taskId,
        result,
        timestamp: new Date().toISOString()
      }
    };
    
    this.broadcastToSubscribers(`task:${taskId}`, message);
    this.broadcastToSubscribers('tasks:all', message);
  }
  
  sendServiceStatusUpdate(serviceId: string, status: string): void {
    const message = {
      type: 'service_status',
      data: {
        serviceId,
        status,
        timestamp: new Date().toISOString()
      }
    };
    
    this.broadcastToSubscribers(`service:${serviceId}`, message);
    this.broadcastToSubscribers('services:all', message);
  }
  
  getConnectedClients(): WebSocketClient[] {
    return Array.from(this.clients.values());
  }
  
  getClientCount(): number {
    return this.clients.size;
  }
  
  close(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
    
    this.clients.clear();
    wsLogger.info('WebSocket server closed');
  }
}

// Singleton instance
export const websocketManager = new WebSocketManager();