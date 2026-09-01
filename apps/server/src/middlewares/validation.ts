import type { Request, Response, NextFunction } from 'express';
import { type ZodType } from 'zod';

import { ValidationError } from '../utils/errors.js';

export function validateParams(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.params);
    if (!parsed.success && parsed.error) {
      next(new ValidationError(parsed.error.flatten()));
      return;
    }

    next();
  };
}

export function validateBody(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success && parsed.error) {
      next(new ValidationError(parsed.error.flatten()));
      return;
    }

    next();
  };
}
