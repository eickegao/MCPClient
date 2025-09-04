import { Request, Response, NextFunction } from 'express';
import { config } from '../utils/config';
import { APIResponse } from '../types';
import { apiLogger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  clientId?: string;
}

// API Key authentication middleware
export function authenticateApiKey(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Skip authentication if not required
  if (!config.apiKeyRequired) {
    return next();
  }
  
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    apiLogger.warn('Missing API key', { ip: req.ip, url: req.url });
    return res.status(401).json({
      success: false,
      error: 'API key required'
    } as APIResponse);
  }
  
  if (apiKey !== config.apiKey) {
    apiLogger.warn('Invalid API key', { ip: req.ip, url: req.url });
    return res.status(401).json({
      success: false,
      error: 'Invalid API key'
    } as APIResponse);
  }
  
  // Extract client ID from headers if provided
  req.clientId = req.headers['x-client-id'] as string;
  
  next();
}

// Rate limiting middleware (simple implementation)
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per minute

export function rateLimit(req: Request, res: Response, next: NextFunction): void {
  const clientIp = req.ip || 'unknown';
  const now = Date.now();
  
  // Clean up old entries
  for (const [ip, data] of requestCounts.entries()) {
    if (now > data.resetTime) {
      requestCounts.delete(ip);
    }
  }
  
  // Get or create request count for this IP
  let requestData = requestCounts.get(clientIp);
  if (!requestData || now > requestData.resetTime) {
    requestData = {
      count: 0,
      resetTime: now + RATE_LIMIT_WINDOW
    };
    requestCounts.set(clientIp, requestData);
  }
  
  // Check rate limit
  if (requestData.count >= RATE_LIMIT_MAX_REQUESTS) {
    apiLogger.warn('Rate limit exceeded', { ip: clientIp, url: req.url });
    res.status(429).json({
      success: false,
      error: 'Rate limit exceeded. Please try again later.'
    } as APIResponse);
    return;
  }
  
  // Increment request count
  requestData.count++;
  
  // Add rate limit headers
  res.setHeader('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, RATE_LIMIT_MAX_REQUESTS - requestData.count));
  res.setHeader('X-RateLimit-Reset', Math.ceil(requestData.resetTime / 1000));
  
  next();
}

// CORS configuration
export function configureCors() {
  const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (mobile apps, etc.)
      if (!origin) return callback(null, true);
      
      // Check if origin matches the configured pattern
      const allowedOrigin = config.corsOrigin;
      if (allowedOrigin === '*') {
        return callback(null, true);
      }
      
      // Support wildcard patterns like http://localhost:*
      if (allowedOrigin.includes('*')) {
        const pattern = allowedOrigin.replace(/\*/g, '.*');
        const regex = new RegExp(`^${pattern}$`);
        if (regex.test(origin)) {
          return callback(null, true);
        }
      } else if (origin === allowedOrigin) {
        return callback(null, true);
      }
      
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Client-ID']
  };
  
  return corsOptions;
}