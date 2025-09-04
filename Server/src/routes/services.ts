import { Router, Request, Response } from 'express';
import { mcpServiceManager } from '../services/mcpManager';
import { asyncHandler, validationError, notFoundError } from '../middleware/errorHandler';
import { APIResponse, ServiceRegistrationRequest } from '../types';
import { apiLogger } from '../utils/logger';

const router = Router();

// Get all services
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const services = await mcpServiceManager.listServices();
  
  res.json({
    success: true,
    data: services
  } as APIResponse);
}));

// Get service by ID
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!id) {
    throw validationError('Service ID is required');
  }
  
  const status = await mcpServiceManager.getServiceStatus(id);
  
  res.json({
    success: true,
    data: status
  } as APIResponse);
}));

// Install/Register a new service
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const serviceConfig: ServiceRegistrationRequest & {
    command: string;
    args?: string[];
    workingDirectory?: string;
    environment?: Record<string, string>;
  } = req.body;
  
  // Validate required fields
  if (!serviceConfig.name || !serviceConfig.description || !serviceConfig.version) {
    throw validationError('Name, description, and version are required');
  }
  
  if (!serviceConfig.command) {
    throw validationError('Command is required to start the service');
  }
  
  apiLogger.info('Installing MCP service', {
    name: serviceConfig.name,
    version: serviceConfig.version,
    command: serviceConfig.command
  });
  
  const serviceId = await mcpServiceManager.installService({
    name: serviceConfig.name,
    description: serviceConfig.description,
    version: serviceConfig.version,
    command: serviceConfig.command,
    args: serviceConfig.args,
    workingDirectory: serviceConfig.workingDirectory,
    environment: serviceConfig.environment,
    capabilities: serviceConfig.capabilities
  });
  
  res.status(201).json({
    success: true,
    data: {
      serviceId,
      message: 'Service installed successfully'
    }
  } as APIResponse);
}));

// Start a service
router.post('/:id/start', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!id) {
    throw validationError('Service ID is required');
  }
  
  apiLogger.info('Starting MCP service', { serviceId: id });
  
  await mcpServiceManager.startService(id);
  
  res.json({
    success: true,
    message: 'Service start initiated'
  } as APIResponse);
}));

// Stop a service
router.post('/:id/stop', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!id) {
    throw validationError('Service ID is required');
  }
  
  apiLogger.info('Stopping MCP service', { serviceId: id });
  
  await mcpServiceManager.stopService(id);
  
  res.json({
    success: true,
    message: 'Service stop initiated'
  } as APIResponse);
}));

// Restart a service
router.post('/:id/restart', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!id) {
    throw validationError('Service ID is required');
  }
  
  apiLogger.info('Restarting MCP service', { serviceId: id });
  
  try {
    await mcpServiceManager.stopService(id);
  } catch (error) {
    // Service might not be running, continue with start
    apiLogger.warn('Service was not running during restart', { serviceId: id });
  }
  
  // Wait a moment before starting
  setTimeout(async () => {
    try {
      await mcpServiceManager.startService(id);
    } catch (error) {
      apiLogger.error('Failed to start service during restart', { serviceId: id, error });
    }
  }, 1000);
  
  res.json({
    success: true,
    message: 'Service restart initiated'
  } as APIResponse);
}));

// Update service configuration
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  
  if (!id) {
    throw validationError('Service ID is required');
  }
  
  // For now, we'll return a placeholder response
  // In a full implementation, you'd update the service configuration
  apiLogger.info('Service update requested', { serviceId: id, updates });
  
  res.json({
    success: true,
    message: 'Service configuration update - feature coming soon'
  } as APIResponse);
}));

// Remove/Uninstall a service
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!id) {
    throw validationError('Service ID is required');
  }
  
  apiLogger.info('Removing MCP service', { serviceId: id });
  
  await mcpServiceManager.removeService(id);
  
  res.json({
    success: true,
    message: 'Service removed successfully'
  } as APIResponse);
}));

// Get service logs (placeholder)
router.get('/:id/logs', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { limit = 100, offset = 0 } = req.query;
  
  if (!id) {
    throw validationError('Service ID is required');
  }
  
  // Placeholder for service logs
  res.json({
    success: true,
    data: {
      logs: [],
      total: 0,
      limit: Number(limit),
      offset: Number(offset)
    },
    message: 'Service logs feature coming soon'
  } as APIResponse);
}));

// Get service capabilities
router.get('/:id/capabilities', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!id) {
    throw validationError('Service ID is required');
  }
  
  const status = await mcpServiceManager.getServiceStatus(id);
  
  res.json({
    success: true,
    data: {
      capabilities: status.capabilities || { tools: [], resources: [] },
      isRunning: status.isRunning
    }
  } as APIResponse);
}));

export default router;