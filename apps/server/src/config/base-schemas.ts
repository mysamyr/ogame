import { z } from 'zod';

import { planetRegex } from '../constants.js';

export const stringSchema = z.string();
export const numberSchema = z.number().int();
export const booleanSchema = z.boolean();
export const dateSchema = z.string().date();
export const timeSchema = z.string().time();

export const planetSchema = z
  .string()
  .regex(planetRegex, 'Invalid planet format (should be like 1:123:12)');
