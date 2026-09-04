import { ValidationError } from '@ogame/shared/errors';
import type { Request, Response, NextFunction } from 'express';
import { type ZodType, treeifyError } from 'zod';

export function validateQuery(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success && parsed.error) {
      next(new ValidationError(treeifyError(parsed.error)));
      return;
    }

    next();
  };
}

export function validateParams(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.params);
    if (!parsed.success && parsed.error) {
      next(new ValidationError(treeifyError(parsed.error)));
      return;
    }

    next();
  };
}

export function validateBody(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success && parsed.error) {
      next(new ValidationError(treeifyError(parsed.error)));
      return;
    }

    next();
  };
}
