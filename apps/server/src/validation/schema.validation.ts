import { z } from 'zod';

import {
  FieldKind,
  identifierMessage,
  identifierNameMessage,
  identifierNameRegex,
  noteIdentifierRegex,
  schemaIdentifierRegex,
} from '../constants/index.js';

const identifier = z
  .string()
  .trim()
  .min(1, 'Id is required')
  .regex(schemaIdentifierRegex, identifierMessage);

const identifierName = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .regex(identifierNameRegex, identifierNameMessage);

export const schemaParamsPayload = z.object({
  id: identifier,
});

const schemaFieldPayload = z.object({
  name: identifierName,
  type: z.enum(FieldKind),
  required: z.boolean(),
});

export const schemaPayload = z.object({
  name: identifierName,
  fields: z
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
    }),
});

export const schemaImportPayload = z
  .object({
    id: identifier,
    name: identifierName,
    fields: schemaPayload.shape.fields,
    notes: z.array(
      z.looseObject({
        id: z
          .string()
          .trim()
          .min(1, 'Id is required')
          .regex(noteIdentifierRegex, identifierMessage),
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
