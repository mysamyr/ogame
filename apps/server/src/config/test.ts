import { z } from 'zod';

import {
  booleanSchema,
  dateSchema,
  numberSchema,
  stringSchema,
  timeSchema,
} from './base-schemas.js';

export const schema = z.object({
  StringRequired: stringSchema,
  StringOptional: stringSchema.optional(),
  NumberRequired: numberSchema,
  NumberOptional: numberSchema.optional(),
  Boolean: booleanSchema,
  // BooleanOptional: booleanSchema.optional(), // Useless because of ui implementation
  DateRequired: dateSchema,
  DateOptional: dateSchema.optional(),
  TimeRequired: timeSchema,
  TimeOptional: timeSchema.optional(),
});

export type Test = z.infer<typeof schema>;
