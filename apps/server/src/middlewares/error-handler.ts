import {
  AppError,
  InternalServerError,
  NotFoundError,
} from '@ogame/shared/errors';
import type { NextFunction, Request, Response } from 'express';

export function notFoundMiddleware(
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const error = new NotFoundError(`Cannot ${req.method} ${req.originalUrl}`, {
    path: req.originalUrl,
  });
  res.status(error.statusCode).json(error.toPayload());
}

export function errorHandlerMiddleware(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    console.error(
      `[${err.code}] ${req.method} ${req.originalUrl}:`,
      err.message,
      err.details ?? ''
    );
    res.status(err.statusCode).json({
      ...err.toPayload(),
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });
    return;
  }

  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err.message);

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  const internalError = new InternalServerError(
    err.message || 'Internal Server Error'
  );

  res.status(statusCode).json({
    ...internalError.toPayload(),
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}
