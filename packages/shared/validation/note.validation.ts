import { z } from 'zod';

import { NOTE_IDENTIFIER_REGEX } from '../constants/index.js';

export const noteId = z
  .string()
  .trim()
  .min(1, 'Id is required')
  .regex(NOTE_IDENTIFIER_REGEX, 'Invalid identifier format');

// TODO: string with number
const paginationQueryParam = z.number().int().gt(0);

export const getNotesQueryPayload = z.object({
  limit: paginationQueryParam.optional(),
  offset: paginationQueryParam.optional(),
});

export const noteParamsPayload = z.object({
  id: noteId,
});

export const notePayload = z.object({
  schema: z.string().describe('Schema id'),
  // other fields from selected schema
});

export type GetNotesQuery = z.infer<typeof getNotesQueryPayload>;
export type NoteParams = z.infer<typeof noteParamsPayload>;
export type NotePayload = z.infer<typeof notePayload>;
