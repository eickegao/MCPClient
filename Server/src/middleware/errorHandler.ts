import { Request, Response, NextFunction } from 'express';
import { APIResponse } from '../types';
import { logger, logError } from '../utils/logger';
import { isDevelopment } from '../utils/config';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  
  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Global error handler middleware
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  let error = { ...err } as AppError;
  error.message = err.message;
  
  // Log error
  logError(err, {
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new AppError(message, 404);
  }
  
  // Mongoose duplicate key
  if (err.name === 'MongoError' && (err as any).code === 11000) {
    const message = 'Duplicate field value entered';
    error = new AppError(message, 400);
  }
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values((err as any).errors).map((val: any) => val.message).join(', ');
    error = new AppError(message, 400);
  }
  
  // SQLite constraint error
  if (err.message.includes('SQLITE_CONSTRAINT')) {
    const message = 'Database constraint violation';
    error = new AppError(message, 400);
  }
  
  // JSON parsing error
  if (err instanceof SyntaxError && 'body' in err) {
    const message = 'Invalid JSON format';
    error = new AppError(message, 400);
  }
  
  // Default to 500 server error
  const statusCode = error.statusCode || 500;
  const message = error.isOperational ? error.message : 'Internal server error';
  
  const response: APIResponse = {
    success: false,
    error: message
  };
  
  // Include stack trace in development
  if (isDevelopment && error.stack) {
    (response as any).stack = error.stack;
  }
  
  res.status(statusCode).json(response);
}

// Async error wrapper
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// 404 handler
export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
}

// Validation error helper
export function validationError(message: string): AppError {
  return new AppError(message, 400);
}

// Unauthorized error helper
export function unauthorizedError(message: string = 'Unauthorized'): AppError {
  return new AppError(message, 401);
}

// Forbidden error helper
export function forbiddenError(message: string = 'Forbidden'): AppError {
  return new AppError(message, 403);
}

// Not found error helper
export function notFoundError(message: string = 'Resource not found'): AppError {
  return new AppError(message, 404);
}

// Conflict error helper
export function conflictError(message: string): AppError {
  return new AppError(message, 409);
}

// Internal server error helper
export function internalServerError(message: string = 'Internal server error'): AppError {
  return new AppError(message, 500);
}