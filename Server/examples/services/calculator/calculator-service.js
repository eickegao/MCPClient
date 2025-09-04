#!/usr/bin/env node

/**
 * Sample Calculator MCP Service
 * This is a simple demonstration of an MCP service that provides basic calculator functions
 */

const readline = require('readline');

class CalculatorService {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    this.setupMessageHandling();
    this.sendInitialization();
  }
  
  setupMessageHandling() {
    this.rl.on('line', (line) => {
      try {
        const message = JSON.parse(line.trim());
        this.handleMessage(message);
      } catch (error) {
        this.sendError('Invalid JSON message', error.message);
      }
    });
    
    process.on('SIGINT', () => {
      this.cleanup();
    });
    
    process.on('SIGTERM', () => {
      this.cleanup();
    });
  }
  
  sendMessage(message) {
    console.log(JSON.stringify(message));
  }
  
  sendInitialization() {
    this.sendMessage({
      jsonrpc: '2.0',
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {
            listChanged: false
          }
        },
        serverInfo: {
          name: 'Calculator Service',
          version: '1.0.0'
        }
      }
    });
  }
  
  handleMessage(message) {
    const { method, params, id } = message;
    
    switch (method) {
      case 'tools/list':
        this.handleToolsList(id);
        break;
        
      case 'tools/call':
        this.handleToolCall(params, id);
        break;
        
      case 'ping':
        this.handlePing(id);
        break;
        
      case 'initialize':
        this.handleInitialize(id);
        break;
        
      default:
        this.sendError('Unknown method', `Method ${method} not supported`, id);
    }
  }
  
  handleToolsList(id) {
    this.sendMessage({
      jsonrpc: '2.0',
      id,
      result: {
        tools: [
          {
            name: 'add',
            description: 'Add two numbers',
            inputSchema: {
              type: 'object',
              properties: {
                a: { type: 'number', description: 'First number' },
                b: { type: 'number', description: 'Second number' }
              },
              required: ['a', 'b']
            }
          },
          {
            name: 'multiply',
            description: 'Multiply two numbers',
            inputSchema: {
              type: 'object',
              properties: {
                a: { type: 'number', description: 'First number' },
                b: { type: 'number', description: 'Second number' }
              },
              required: ['a', 'b']
            }
          },
          {
            name: 'divide',
            description: 'Divide two numbers',
            inputSchema: {
              type: 'object',
              properties: {
                a: { type: 'number', description: 'Dividend' },
                b: { type: 'number', description: 'Divisor' }
              },
              required: ['a', 'b']
            }
          }
        ]
      }
    });
  }
  
  handleToolCall(params, id) {
    const { name, arguments: args } = params;
    
    try {
      let result;
      
      switch (name) {
        case 'add':
          result = this.add(args.a, args.b);
          break;
          
        case 'multiply':
          result = this.multiply(args.a, args.b);
          break;
          
        case 'divide':
          result = this.divide(args.a, args.b);
          break;
          
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
      
      this.sendMessage({
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: `Result: ${result}`
            }
          ]
        }
      });
      
    } catch (error) {
      this.sendError('Tool execution failed', error.message, id);
    }
  }
  
  handlePing(id) {
    this.sendMessage({
      jsonrpc: '2.0',
      id,
      result: {
        status: 'ok',
        timestamp: new Date().toISOString()
      }
    });
  }
  
  handleInitialize(id) {
    this.sendMessage({
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {
            listChanged: false
          }
        },
        serverInfo: {
          name: 'Calculator Service',
          version: '1.0.0'
        }
      }
    });
  }
  
  add(a, b) {
    if (typeof a !== 'number' || typeof b !== 'number') {
      throw new Error('Both arguments must be numbers');
    }
    return a + b;
  }
  
  multiply(a, b) {
    if (typeof a !== 'number' || typeof b !== 'number') {
      throw new Error('Both arguments must be numbers');
    }
    return a * b;
  }
  
  divide(a, b) {
    if (typeof a !== 'number' || typeof b !== 'number') {
      throw new Error('Both arguments must be numbers');
    }
    if (b === 0) {
      throw new Error('Division by zero is not allowed');
    }
    return a / b;
  }
  
  sendError(error, details, id = null) {
    this.sendMessage({
      jsonrpc: '2.0',
      id,
      error: {
        code: -32000,
        message: error,
        data: details
      }
    });
  }
  
  cleanup() {
    this.rl.close();
    process.exit(0);
  }
}

// Start the service
if (require.main === module) {
  new CalculatorService();
}

module.exports = CalculatorService;