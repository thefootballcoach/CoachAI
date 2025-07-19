import { Request } from "express";
import { storage } from "./storage";
import { InsertErrorLog } from "@shared/schema";

export interface ErrorContext {
  userId?: number;
  errorType: 'upload_error' | 'auth_error' | 'api_error' | 'system_error' | 'database_error' | 'validation_error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  error?: Error;
  req?: Request;
  additionalData?: Record<string, any>;
}

class ErrorLogger {
  /**
   * Log an error to the database for super user review
   */
  async logError(context: ErrorContext): Promise<void> {
    try {
      const errorData: InsertErrorLog = {
        userId: context.userId || null,
        errorType: context.errorType,
        severity: context.severity,
        message: context.message,
        stackTrace: context.error?.stack || null,
        requestPath: context.req?.path || null,
        requestMethod: context.req?.method || null,
        userAgent: context.req?.get('User-Agent') || null,
        ipAddress: this.getClientIP(context.req) || null,
        sessionId: context.req?.sessionID || null,
        additionalData: context.additionalData ? JSON.stringify(context.additionalData) : null,
        resolved: false,
        resolvedBy: null,
        resolvedAt: null,
        resolutionNotes: null,
      };

      await storage.createErrorLog(errorData);
      
      // Log to console for immediate visibility
      console.error(`[ERROR_LOG] ${context.severity.toUpperCase()}: ${context.message}`, {
        type: context.errorType,
        userId: context.userId,
        path: context.req?.path,
        stack: context.error?.stack?.split('\n')[0],
      });
    } catch (logError) {
      // Fallback to console if database logging fails
      console.error('[ERROR_LOGGER_FAILURE] Failed to log error to database:', logError);
      console.error('[ORIGINAL_ERROR]', context);
    }
  }

  /**
   * Log upload-specific errors
   */
  async logUploadError(req: Request, error: Error, additionalData?: Record<string, any>): Promise<void> {
    await this.logError({
      userId: (req as any).user?.id,
      errorType: 'upload_error',
      severity: 'high',
      message: `Upload failed: ${error.message}`,
      error,
      req,
      additionalData: {
        fileSize: req.headers['content-length'],
        contentType: req.headers['content-type'],
        ...additionalData,
      },
    });
  }

  /**
   * Log authentication failures
   */
  async logAuthError(req: Request, message: string, additionalData?: Record<string, any>): Promise<void> {
    await this.logError({
      userId: (req as any).user?.id,
      errorType: 'auth_error',
      severity: 'medium',
      message: `Authentication failed: ${message}`,
      req,
      additionalData: {
        sessionExists: !!req.session,
        sessionID: req.sessionID,
        ...additionalData,
      },
    });
  }

  /**
   * Log API errors
   */
  async logApiError(req: Request, error: Error, additionalData?: Record<string, any>): Promise<void> {
    await this.logError({
      userId: (req as any).user?.id,
      errorType: 'api_error',
      severity: 'medium',
      message: `API error: ${error.message}`,
      error,
      req,
      additionalData,
    });
  }

  /**
   * Log system errors
   */
  async logSystemError(error: Error, context?: string, additionalData?: Record<string, any>): Promise<void> {
    await this.logError({
      errorType: 'system_error',
      severity: 'critical',
      message: `System error${context ? ` in ${context}` : ''}: ${error.message}`,
      error,
      additionalData,
    });
  }

  /**
   * Log database errors
   */
  async logDatabaseError(error: Error, query?: string, additionalData?: Record<string, any>): Promise<void> {
    await this.logError({
      errorType: 'database_error',
      severity: 'high',
      message: `Database error: ${error.message}`,
      error,
      additionalData: {
        query,
        ...additionalData,
      },
    });
  }

  /**
   * Get client IP address from request
   */
  private getClientIP(req?: Request): string | null {
    if (!req) return null;
    
    return (
      req.ip ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      null
    );
  }
}

export const errorLogger = new ErrorLogger();