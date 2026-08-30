import { z } from 'zod';

import { ValidationError } from './errors.js';

export function validateSchema<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): z.infer<T> {
  const parsed = schema.safeParse(data);
  if (!parsed.success && parsed.error) {
    throw new ValidationError(parsed.error.flatten());
  }

  return parsed.data as z.infer<T>;
}
