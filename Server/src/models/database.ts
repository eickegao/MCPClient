import sqlite3 from 'sqlite3';
import { Database, open } from 'sqlite';
import path from 'path';
import fs from 'fs';
import { config } from '../utils/config';
import { dbLogger } from '../utils/logger';
import { MCPService, Task, TaskLog, ClientConnection } from '../types';

export class DatabaseManager {
  private db: Database | null = null;
  
  async initialize(): Promise<void> {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(config.dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      // Open database connection
      this.db = await open({
        filename: config.dbPath,
        driver: sqlite3.Database
      });
      
      // Enable foreign keys
      await this.db.exec('PRAGMA foreign_keys = ON');
      
      // Create tables
      await this.createTables();
      
      dbLogger.info('Database initialized successfully', { dbPath: config.dbPath });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      dbLogger.error('Failed to initialize database', { error: errorMessage });
      throw error;
    }
  }
  
  private async createTables(): Promise<void> {
    const tables = [
      // Client connections table
      `CREATE TABLE IF NOT EXISTS client_connections (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        client_name TEXT,
        client_version TEXT,
        platform TEXT,
        last_seen DATETIME NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('connected', 'disconnected')),
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // MCP service registry table
      `CREATE TABLE IF NOT EXISTS mcp_service_registry (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        version TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'error')),
        capabilities TEXT NOT NULL, -- JSON string
        config TEXT, -- JSON string
        health_check_url TEXT,
        last_health_check DATETIME,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Task history table
      `CREATE TABLE IF NOT EXISTS task_history (
        id TEXT PRIMARY KEY,
        service_id TEXT NOT NULL,
        instruction TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
        context TEXT, -- JSON string
        result TEXT, -- JSON string
        progress INTEGER NOT NULL DEFAULT 0,
        error_message TEXT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        FOREIGN KEY (service_id) REFERENCES mcp_service_registry(id)
      )`,
      
      // Task logs table
      `CREATE TABLE IF NOT EXISTS task_logs (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        level TEXT NOT NULL CHECK (level IN ('info', 'warn', 'error', 'debug')),
        message TEXT NOT NULL,
        timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES task_history(id)
      )`
    ];
    
    for (const table of tables) {
      await this.db!.exec(table);
    }
    
    // Create indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_client_connections_client_id ON client_connections(client_id)',
      'CREATE INDEX IF NOT EXISTS idx_client_connections_status ON client_connections(status)',
      'CREATE INDEX IF NOT EXISTS idx_mcp_service_registry_status ON mcp_service_registry(status)',
      'CREATE INDEX IF NOT EXISTS idx_task_history_service_id ON task_history(service_id)',
      'CREATE INDEX IF NOT EXISTS idx_task_history_status ON task_history(status)',
      'CREATE INDEX IF NOT EXISTS idx_task_history_created_at ON task_history(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_task_logs_task_id ON task_logs(task_id)',
      'CREATE INDEX IF NOT EXISTS idx_task_logs_level ON task_logs(level)'
    ];
    
    for (const index of indexes) {
      await this.db!.exec(index);
    }
  }
  
  // Service management methods
  async createService(service: Omit<MCPService, 'createdAt' | 'updatedAt'>): Promise<void> {
    const sql = `
      INSERT INTO mcp_service_registry 
      (id, name, description, version, status, capabilities, config, health_check_url, last_health_check)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await this.db!.run(sql, [
      service.id,
      service.name,
      service.description,
      service.version,
      service.status,
      JSON.stringify(service.capabilities),
      service.config ? JSON.stringify(service.config) : null,
      service.healthCheckUrl,
      service.lastHealthCheck?.toISOString()
    ]);
  }
  
  async getServices(): Promise<MCPService[]> {
    const sql = 'SELECT * FROM mcp_service_registry ORDER BY created_at DESC';
    const rows = await this.db!.all(sql);
    
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      version: row.version,
      status: row.status,
      capabilities: JSON.parse(row.capabilities),
      config: row.config ? JSON.parse(row.config) : {},
      healthCheckUrl: row.health_check_url,
      lastHealthCheck: row.last_health_check ? new Date(row.last_health_check) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }));
  }
  
  async getServiceById(id: string): Promise<MCPService | null> {
    const sql = 'SELECT * FROM mcp_service_registry WHERE id = ?';
    const row = await this.db!.get(sql, [id]);
    
    if (!row) return null;
    
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      version: row.version,
      status: row.status,
      capabilities: JSON.parse(row.capabilities),
      config: row.config ? JSON.parse(row.config) : {},
      healthCheckUrl: row.health_check_url,
      lastHealthCheck: row.last_health_check ? new Date(row.last_health_check) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
  
  async updateServiceStatus(id: string, status: MCPService['status'], lastHealthCheck?: Date): Promise<void> {
    const sql = `
      UPDATE mcp_service_registry 
      SET status = ?, last_health_check = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    
    await this.db!.run(sql, [
      status,
      lastHealthCheck?.toISOString(),
      id
    ]);
  }
  
  async deleteService(id: string): Promise<void> {
    await this.db!.run('DELETE FROM mcp_service_registry WHERE id = ?', [id]);
  }
  
  // Task management methods
  async createTask(task: Omit<Task, 'createdAt' | 'completedAt'>): Promise<void> {
    const sql = `
      INSERT INTO task_history 
      (id, service_id, instruction, status, context, result, progress, error_message)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await this.db!.run(sql, [
      task.id,
      task.serviceId,
      task.instruction,
      task.status,
      task.context ? JSON.stringify(task.context) : null,
      task.result ? JSON.stringify(task.result) : null,
      task.progress,
      task.errorMessage
    ]);
  }
  
  async updateTask(id: string, updates: Partial<Task>): Promise<void> {
    const fields = [];
    const values = [];
    
    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    
    if (updates.progress !== undefined) {
      fields.push('progress = ?');
      values.push(updates.progress);
    }
    
    if (updates.result !== undefined) {
      fields.push('result = ?');
      values.push(JSON.stringify(updates.result));
    }
    
    if (updates.errorMessage !== undefined) {
      fields.push('error_message = ?');
      values.push(updates.errorMessage);
    }
    
    if (updates.completedAt !== undefined) {
      fields.push('completed_at = ?');
      values.push(updates.completedAt.toISOString());
    }
    
    if (fields.length === 0) return;
    
    values.push(id);
    const sql = `UPDATE task_history SET ${fields.join(', ')} WHERE id = ?`;
    
    await this.db!.run(sql, values);
  }
  
  async getTaskById(id: string): Promise<Task | null> {
    const sql = 'SELECT * FROM task_history WHERE id = ?';
    const row = await this.db!.get(sql, [id]);
    
    if (!row) return null;
    
    return {
      id: row.id,
      serviceId: row.service_id,
      instruction: row.instruction,
      status: row.status,
      context: row.context ? JSON.parse(row.context) : undefined,
      result: row.result ? JSON.parse(row.result) : undefined,
      progress: row.progress,
      errorMessage: row.error_message,
      createdAt: new Date(row.created_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined
    };
  }
  
  async getTasks(limit = 50, offset = 0): Promise<Task[]> {
    const sql = 'SELECT * FROM task_history ORDER BY created_at DESC LIMIT ? OFFSET ?';
    const rows = await this.db!.all(sql, [limit, offset]);
    
    return rows.map(row => ({
      id: row.id,
      serviceId: row.service_id,
      instruction: row.instruction,
      status: row.status,
      context: row.context ? JSON.parse(row.context) : undefined,
      result: row.result ? JSON.parse(row.result) : undefined,
      progress: row.progress,
      errorMessage: row.error_message,
      createdAt: new Date(row.created_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined
    }));
  }
  
  // Task log methods
  async addTaskLog(log: Omit<TaskLog, 'timestamp'>): Promise<void> {
    const sql = `
      INSERT INTO task_logs (id, task_id, level, message)
      VALUES (?, ?, ?, ?)
    `;
    
    await this.db!.run(sql, [log.id, log.taskId, log.level, log.message]);
  }
  
  async getTaskLogs(taskId: string): Promise<TaskLog[]> {
    const sql = 'SELECT * FROM task_logs WHERE task_id = ? ORDER BY timestamp ASC';
    const rows = await this.db!.all(sql, [taskId]);
    
    return rows.map(row => ({
      id: row.id,
      taskId: row.task_id,
      level: row.level,
      message: row.message,
      timestamp: new Date(row.timestamp)
    }));
  }
  
  // Client connection methods
  async updateClientConnection(connection: ClientConnection): Promise<void> {
    const sql = `
      INSERT OR REPLACE INTO client_connections 
      (id, client_id, client_name, client_version, platform, last_seen, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    await this.db!.run(sql, [
      connection.id,
      connection.clientId,
      connection.clientName,
      connection.clientVersion,
      connection.platform,
      connection.lastSeen.toISOString(),
      connection.status
    ]);
  }
  
  async getActiveConnections(): Promise<ClientConnection[]> {
    const sql = "SELECT * FROM client_connections WHERE status = 'connected' ORDER BY last_seen DESC";
    const rows = await this.db!.all(sql);
    
    return rows.map(row => ({
      id: row.id,
      clientId: row.client_id,
      clientName: row.client_name,
      clientVersion: row.client_version,
      platform: row.platform,
      lastSeen: new Date(row.last_seen),
      status: row.status,
      createdAt: new Date(row.created_at)
    }));
  }
  
  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      dbLogger.info('Database connection closed');
    }
  }
}

// Singleton instance
export const database = new DatabaseManager();