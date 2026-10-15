import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env.js';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // If response has already started streaming, delegate to default express handler
  if (res.headersSent) {
    return next(err);
  }

  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'The request contains invalid fields.',
        details: err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
    });
    return;
  }

  // Handle Multer upload errors
  if (err.name === 'MulterError') {
    let statusCode = 400;
    let message = err.message;
    if (err.code === 'LIMIT_FILE_SIZE') {
      statusCode = 413;
      message = `File exceeds the maximum allowed size of ${env.MAX_FILE_SIZE_MB}MB.`;
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      message = `Too many files. Maximum allowed per upload is ${env.MAX_FILES_PER_UPLOAD}.`;
    }
    res.status(statusCode).json({
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message,
        details: [{ code: err.code, field: err.field }],
      },
    });
    return;
  }

  // Custom application errors with status code
  const status = typeof err.status === 'number' ? err.status : 500;
  const code = err.code || (status === 500 ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_ERROR');
  const message =
    status === 500 && env.NODE_ENV === 'production'
      ? 'An unexpected error occurred while processing your request.'
      : err.message || 'Internal server error';

  if (status >= 500) {
    console.error(`💥 [${new Date().toISOString()}] Server Error (${code}):`, err);
  }

  res.status(status).json({
    success: false,
    error: {
      code,
      message,
      ...(env.NODE_ENV !== 'production' && err.stack ? { stack: err.stack } : {}),
    },
  });
}
