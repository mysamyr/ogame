import { z } from 'zod';

import {
  NOTE_IDENTIFIER_REGEX,
  SCHEMA_IDENTIFIER_REGEX,
  NAME_REGEX,
  FieldKind,
} from '../constants/index.js';

const identifier = z
  .string()
  .trim()
  .min(1, 'Id is required')
  .regex(SCHEMA_IDENTIFIER_REGEX, 'Invalid identifier format');

const name = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .regex(NAME_REGEX, 'Invalid name format');

export const schemaParamsPayload = z.object({
  id: identifier,
});

const schemaFieldPayload = z.object({
  name,
  type: z.enum(FieldKind),
  required: z.boolean(),
});

export const schemaPayload = z.object({
  name,
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
    name,
    fields: z
      .array(
        z.object({
          id: identifier,

          name,
          type: z.enum(FieldKind),
          required: z.boolean(),
        })
      )
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
    notes: z.array(
      z.looseObject({
        id: z
          .string()
          .trim()
          .min(1, 'Id is required')
          .regex(NOTE_IDENTIFIER_REGEX, 'Invalid note identifier format'),
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

export type SchemaParams = z.infer<typeof schemaParamsPayload>;
export type SchemaPayload = z.infer<typeof schemaPayload>;
export type SchemaImportPayload = z.infer<typeof schemaImportPayload>;
