import { z } from 'zod';

import { booleanSchema, numberSchema, timeSchema } from './base-schemas.js';

export const schema = z.object({
  time: timeSchema.optional(),
  attacked: booleanSchema,
  totalRes: numberSchema.optional(),
});

export type IPlanetsGang = z.infer<typeof schema>;
