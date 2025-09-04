import { Router, Request, Response } from 'express';
import { mcpServiceManager } from '../services/mcpManager';
import { database } from '../models/database';
import { asyncHandler, validationError, notFoundError } from '../middleware/errorHandler';
import { APIResponse, ExecuteTaskRequest, ExecuteTaskResponse } from '../types';
import { apiLogger } from '../utils/logger';

const router = Router();

// Get all tasks
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { limit = 50, offset = 0, status, serviceId } = req.query;
  
  // For now, get all tasks (in a full implementation, you'd add filtering)
  const tasks = await database.getTasks(Number(limit), Number(offset));
  
  // Filter by status if provided
  let filteredTasks = tasks;
  if (status) {
    filteredTasks = tasks.filter(task => task.status === status);
  }
  
  // Filter by serviceId if provided
  if (serviceId) {
    filteredTasks = filteredTasks.filter(task => task.serviceId === serviceId);
  }
  
  res.json({
    success: true,
    data: {
      tasks: filteredTasks,
      total: filteredTasks.length,
      limit: Number(limit),
      offset: Number(offset)
    }
  } as APIResponse);
}));

// Get task by ID
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!id) {
    throw validationError('Task ID is required');
  }
  
  const task = await database.getTaskById(id);
  if (!task) {
    throw notFoundError('Task not found');
  }
  
  res.json({
    success: true,
    data: task
  } as APIResponse);
}));

// Execute a new task
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const taskRequest: ExecuteTaskRequest = req.body;
  
  // Validate required fields
  if (!taskRequest.instruction || !taskRequest.serviceId) {
    throw validationError('Instruction and serviceId are required');
  }
  
  apiLogger.info('Executing new task', {
    serviceId: taskRequest.serviceId,
    instruction: taskRequest.instruction.substring(0, 100) + '...'
  });
  
  const taskId = await mcpServiceManager.executeTask(
    taskRequest.serviceId,
    taskRequest.instruction,
    taskRequest.context
  );
  
  const response: ExecuteTaskResponse = {
    taskId,
    status: 'running',
    estimatedTime: 30000 // 30 seconds estimate
  };
  
  res.status(201).json({
    success: true,
    data: response
  } as APIResponse);
}));

// Get task logs
router.get('/:id/logs', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!id) {
    throw validationError('Task ID is required');
  }
  
  const task = await database.getTaskById(id);
  if (!task) {
    throw notFoundError('Task not found');
  }
  
  const logs = await database.getTaskLogs(id);
  
  res.json({
    success: true,
    data: {
      taskId: id,
      logs
    }
  } as APIResponse);
}));

// Cancel a task
router.post('/:id/cancel', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!id) {
    throw validationError('Task ID is required');
  }
  
  const task = await database.getTaskById(id);
  if (!task) {
    throw notFoundError('Task not found');
  }
  
  if (task.status === 'completed' || task.status === 'failed') {
    throw validationError('Cannot cancel a completed or failed task');
  }
  
  apiLogger.info('Cancelling task', { taskId: id });
  
  // Update task status to failed with cancellation message
  await database.updateTask(id, {
    status: 'failed',
    errorMessage: 'Task cancelled by user',
    completedAt: new Date()
  });
  
  res.json({
    success: true,
    message: 'Task cancelled successfully'
  } as APIResponse);
}));

// Retry a failed task
router.post('/:id/retry', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!id) {
    throw validationError('Task ID is required');
  }
  
  const task = await database.getTaskById(id);
  if (!task) {
    throw notFoundError('Task not found');
  }
  
  if (task.status !== 'failed') {
    throw validationError('Can only retry failed tasks');
  }
  
  apiLogger.info('Retrying task', { taskId: id, originalInstruction: task.instruction });
  
  // Create a new task with the same parameters
  const newTaskId = await mcpServiceManager.executeTask(
    task.serviceId,
    task.instruction,
    task.context
  );
  
  res.json({
    success: true,
    data: {
      originalTaskId: id,
      newTaskId,
      message: 'Task retry initiated'
    }
  } as APIResponse);
}));

// Get task statistics
router.get('/stats/summary', asyncHandler(async (req: Request, res: Response) => {
  // This is a simplified implementation
  // In a full implementation, you'd have optimized database queries for statistics
  const allTasks = await database.getTasks(1000, 0); // Get recent tasks
  
  const stats = {
    total: allTasks.length,
    pending: allTasks.filter(t => t.status === 'pending').length,
    running: allTasks.filter(t => t.status === 'running').length,
    completed: allTasks.filter(t => t.status === 'completed').length,
    failed: allTasks.filter(t => t.status === 'failed').length,
    averageCompletionTime: 0,
    successRate: 0
  };
  
  // Calculate average completion time for completed tasks
  const completedTasks = allTasks.filter(t => t.status === 'completed' && t.completedAt);
  if (completedTasks.length > 0) {
    const totalTime = completedTasks.reduce((sum, task) => {
      const duration = task.completedAt!.getTime() - task.createdAt.getTime();
      return sum + duration;
    }, 0);
    stats.averageCompletionTime = Math.round(totalTime / completedTasks.length);
  }
  
  // Calculate success rate
  const finishedTasks = stats.completed + stats.failed;
  if (finishedTasks > 0) {
    stats.successRate = Math.round((stats.completed / finishedTasks) * 100);
  }
  
  res.json({
    success: true,
    data: stats
  } as APIResponse);
}));

// Get tasks by service
router.get('/by-service/:serviceId', asyncHandler(async (req: Request, res: Response) => {
  const { serviceId } = req.params;
  const { limit = 50, offset = 0 } = req.query;
  
  if (!serviceId) {
    throw validationError('Service ID is required');
  }
  
  const allTasks = await database.getTasks(Number(limit) * 2, Number(offset)); // Get more to filter
  const serviceTasks = allTasks.filter(task => task.serviceId === serviceId);
  
  res.json({
    success: true,
    data: {
      serviceId,
      tasks: serviceTasks.slice(0, Number(limit)),
      total: serviceTasks.length,
      limit: Number(limit),
      offset: Number(offset)
    }
  } as APIResponse);
}));

export default router;