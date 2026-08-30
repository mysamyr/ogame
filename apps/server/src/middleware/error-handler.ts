import type { NextFunction, Request, Response } from 'express';

import { ValidationError } from '../utils/errors.js';

export function notFoundMiddleware(
  req: Request,
  res: Response,
  _next: NextFunction
) {
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
}

export function errorHandlerMiddleware(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ValidationError) {
    console.error(
      `[VALIDATION ERROR] ${req.method} ${req.originalUrl}: ${JSON.stringify(err.errors)}`,
      err.message
    );
    const response = {
      message: err.message,
      fieldErrors: err.errors as Record<string, string[]>,
    };
    res.status(err.statusCode).json(response);
    return;
  }
  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err.message);

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}
