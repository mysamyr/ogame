import { z } from 'zod';

import {
  FieldKind,
  IDENTIFIER_MESSAGE,
  IDENTIFIER_NAME_MESSAGE,
  IDENTIFIER_NAME_REGEX,
  NOTE_IDENTIFIER_REGEX,
  SCHEMA_IDENTIFIER_REGEX,
} from '../constants/index.js';

const identifier = z
  .string()
  .trim()
  .min(1, 'Id is required')
  .regex(SCHEMA_IDENTIFIER_REGEX, IDENTIFIER_MESSAGE);

const identifierName = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .regex(IDENTIFIER_NAME_REGEX, IDENTIFIER_NAME_MESSAGE);

const schemaFieldPayload = z.object({
  name: identifierName,
  type: z.enum(FieldKind),
  required: z.boolean(),
});

const schemaFieldsPayload = z
  .array(schemaFieldPayload)
  .min(1, 'At least one field is required')
  .superRefine((fields, ctx) => {
    const names = new Set();
    for (const field of fields) {
      const key = `${field.name}-${field.type}`;
      if (names.has(key)) {
        ctx.addIssue({
          code: 'custom',
          message: `Field with name "${field.name}" and type "${field.type}" must be unique`,
        });
      } else {
        names.add(key);
      }
    }
  });

export const schemaImportPayload = z
  .object({
    id: identifier,
    name: identifierName,
    fields: schemaFieldsPayload,
    notes: z.array(
      z.looseObject({
        id: z
          .string()
          .trim()
          .min(1, 'Id is required')
          .regex(NOTE_IDENTIFIER_REGEX, IDENTIFIER_MESSAGE),
        schema: identifier,
      })
    ),
  })
  .strict()
  .superRefine((payload, ctx) => {
    for (const [index, note] of payload.notes.entries()) {
      if (note.schema !== payload.id) {
        ctx.addIssue({
          code: 'custom',
          message: `Note schema must match imported schema id "${payload.id}"`,
          path: ['notes', index, 'schema'],
        });
      }
    }
  });
