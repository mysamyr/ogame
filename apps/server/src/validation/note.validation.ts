import { z } from 'zod';

import { identifierMessage, noteIdentifierRegex } from '../constants/index.js';

const identifier = z
  .string()
  .trim()
  .min(1, 'Id is required')
  .regex(noteIdentifierRegex, identifierMessage);

const paginationQueryParam = z.number().int().gt(0);

export const getNotesQueryPayload = z.object({
  limit: paginationQueryParam.optional(),
  offset: paginationQueryParam.optional(),
});

export const noteParamsPayload = z.object({
  id: identifier,
});

export const notePayload = z.object({
  schema: z.string().describe('Schema id'),
  // other fields from selected schema
});
