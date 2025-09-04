import { MCPServer } from './app';
import { logger } from './utils/logger';

// Create and start the MCP Server
async function main() {
  try {
    const server = new MCPServer();
    await server.start();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Failed to start MCP Server', { error: errorMessage });
    process.exit(1);
  }
}

// Start the server
main();