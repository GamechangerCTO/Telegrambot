/**
 * 🔧 API Utilities
 * Standardized API error handling and response utilities
 * Consolidates error handling patterns across 17+ API routes
 * Based on COMPLETE-REBUILD-PROMPT.md error resilience requirements
 */

import { NextResponse } from 'next/server';

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp?: string;
  processing_time_ms?: number;
}

export interface APIError {
  code: string;
  message: string;
  details?: any;
  statusCode: number;
}

/**
 * Standard API response wrapper
 * Replaces duplicate response patterns across API routes
 */
export const apiResponse = {
  success: <T>(data: T, processingTime?: number): NextResponse<APIResponse<T>> => {
    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
      ...(processingTime && { processing_time_ms: processingTime })
    });
  },

  error: (message: string, statusCode: number = 500, code?: string): NextResponse<APIResponse> => {
    console.error(`❌ API Error [${statusCode}]: ${message}`);
    return NextResponse.json({
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
      ...(code && { code })
    }, { status: statusCode });
  },

  badRequest: (message: string = 'Bad Request'): NextResponse<APIResponse> => {
    return apiResponse.error(message, 400, 'BAD_REQUEST');
  },

  unauthorized: (message: string = 'Unauthorized'): NextResponse<APIResponse> => {
    return apiResponse.error(message, 401, 'UNAUTHORIZED');
  },

  forbidden: (message: string = 'Forbidden'): NextResponse<APIResponse> => {
    return apiResponse.error(message, 403, 'FORBIDDEN');
  },

  notFound: (message: string = 'Not Found'): NextResponse<APIResponse> => {
    return apiResponse.error(message, 404, 'NOT_FOUND');
  },

  conflict: (message: string = 'Conflict'): NextResponse<APIResponse> => {
    return apiResponse.error(message, 409, 'CONFLICT');
  },

  tooManyRequests: (message: string = 'Too Many Requests'): NextResponse<APIResponse> => {
    return apiResponse.error(message, 429, 'RATE_LIMITED');
  },

  internalError: (message: string = 'Internal Server Error'): NextResponse<APIResponse> => {
    return apiResponse.error(message, 500, 'INTERNAL_ERROR');
  }
};

/**
 * Standard error handler wrapper for API routes
 * Implements error resilience patterns from COMPLETE-REBUILD-PROMPT.md
 */
export function withErrorHandler<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    const startTime = Date.now();
    
    try {
      const result = await handler(...args);
      const processingTime = Date.now() - startTime;
      
      // Add processing time to successful responses if not already present
      if (result.status === 200) {
        const body = await result.json();
        if (body.success && !body.processing_time_ms) {
          return NextResponse.json({
            ...body,
            processing_time_ms: processingTime
          });
        }
      }
      
      return result;
    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      console.error('❌ API Handler Error:', {
        error: error.message,
        stack: error.stack,
        processing_time_ms: processingTime
      });

      // Handle specific error types
      if (error.name === 'ValidationError') {
        return apiResponse.badRequest(error.message);
      }
      
      if (error.name === 'AuthenticationError') {
        return apiResponse.unauthorized(error.message);
      }
      
      if (error.name === 'AuthorizationError') {
        return apiResponse.forbidden(error.message);
      }
      
      if (error.name === 'NotFoundError') {
        return apiResponse.notFound(error.message);
      }
      
      if (error.name === 'RateLimitError') {
        return apiResponse.tooManyRequests(error.message);
      }

      // Default to internal server error
      return apiResponse.internalError('An unexpected error occurred');
    }
  };
}

/**
 * Validate required fields in request body
 * Standardizes validation across API routes
 */
export function validateRequiredFields<T extends Record<string, any>>(
  data: T,
  requiredFields: (keyof T)[]
): string | null {
  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
      return `${String(field)} is required`;
    }
  }
  return null;
}

/**
 * Parse and validate JSON request body
 */
export async function parseRequestBody<T = any>(request: Request): Promise<T> {
  try {
    const body = await request.json();
    return body as T;
  } catch (error) {
    throw new Error('Invalid JSON in request body');
  }
}

/**
 * Log API request for monitoring
 * Supports monitoring requirements from COMPLETE-REBUILD-PROMPT.md
 */
export function logAPIRequest(
  method: string,
  path: string,
  params?: any,
  userId?: string
) {
  console.log(`📡 API ${method} ${path}`, {
    timestamp: new Date().toISOString(),
    method,
    path,
    params: params ? JSON.stringify(params).substring(0, 200) : undefined,
    userId
  });
}

/**
 * Create standard API route handler with validation and error handling
 */
export function createAPIHandler<T extends Record<string, any>>(config: {
  requiredFields?: (keyof T)[];
  handler: (data: T, request: Request) => Promise<NextResponse>;
}) {
  return withErrorHandler(async (request: Request) => {
    // Log the request
    const url = new URL(request.url);
    logAPIRequest(request.method, url.pathname);

    // Parse and validate request body
    const data = await parseRequestBody<T>(request);
    
    // Validate required fields
    if (config.requiredFields) {
      const validationError = validateRequiredFields(data, config.requiredFields);
      if (validationError) {
        return apiResponse.badRequest(validationError);
      }
    }

    // Call the handler
    return await config.handler(data, request);
  });
}

/**
 * Rate limiting helper
 * Simple in-memory rate limiting for API protection
 */
class SimpleRateLimiter {
  private requests = new Map<string, number[]>();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  checkLimit(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Get existing requests for this identifier
    const requests = this.requests.get(identifier) || [];
    
    // Filter out old requests
    const recentRequests = requests.filter(time => time > windowStart);
    
    // Check if under limit
    if (recentRequests.length >= this.maxRequests) {
      return false;
    }
    
    // Add current request
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);
    
    return true;
  }

  reset(identifier: string): void {
    this.requests.delete(identifier);
  }
}

export const rateLimiter = new SimpleRateLimiter();

/**
 * Rate limiting middleware
 */
export function withRateLimit(identifier: (request: Request) => string) {
  return function <T extends any[]>(
    handler: (...args: T) => Promise<NextResponse>
  ) {
    return async (...args: T): Promise<NextResponse> => {
      const request = args[0] as Request;
      const id = identifier(request);
      
      if (!rateLimiter.checkLimit(id)) {
        return apiResponse.tooManyRequests('Rate limit exceeded');
      }
      
      return handler(...args);
    };
  };
}

/**
 * Performance monitoring decorator
 * Implements monitoring requirements from COMPLETE-REBUILD-PROMPT.md
 */
export function withPerformanceMonitoring<T extends any[]>(
  name: string,
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    const startTime = Date.now();
    const result = await handler(...args);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Log performance metrics
    console.log(`⏱️  ${name} completed in ${duration}ms`);
    
    // Alert if taking too long (based on 30-second requirement)
    if (duration > 30000) {
      console.warn(`🚨 ${name} exceeded 30-second limit: ${duration}ms`);
    }
    
    return result;
  };
}