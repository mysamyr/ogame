import type { Request, Response, NextFunction } from 'express';
import { z, type ZodType } from 'zod';

import { isKnownType } from '../config/schemas.js';
import { ValidationError } from '../utils/errors.js';

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

export const noteTypeBodySchema = z.object({
  type: z.string().refine(isKnownType, 'unknown type'),
});
