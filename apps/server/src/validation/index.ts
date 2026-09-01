import { z } from 'zod';

import {
  FieldKind,
  identifierMessage,
  identifierNameMessage,
  identifierNameRegex,
  identifierRegex,
  planetMessage,
  planetRegex,
} from '../constants/index.js';

const identifier = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .regex(identifierRegex, identifierMessage);

const identifierName = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .regex(identifierNameRegex, identifierNameMessage);

export const paramsPayload = z.object({
  id: identifier,
});

const schemaFieldPayload = z.object({
  name: identifierName,
  type: z.nativeEnum(FieldKind),
  required: z.boolean(),
});

export const schemaPayload = z.object({
  name: identifierName,
  // TODO: grant uniqueness fields (name + type)
  fields: z.array(schemaFieldPayload).min(1, 'At least one field is required'),
});

export const notePayload = z.object({
  planet: z.string().min(5).regex(planetRegex, planetMessage),
  date: z.string().date(),
  schema: z.string().describe('Schema id'),
  // other fields from selected schema
});
