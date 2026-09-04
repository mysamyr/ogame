import { z } from 'zod';

import {
  FieldKind,
  NAME_REGEX,
  SCHEMA_IDENTIFIER_REGEX,
  SortDirection,
} from '../constants/index.js';
import type { Schema, SchemaField } from '../types/schema.js';

import { noteId } from './note.validation.js';

export const schemaId = z
  .string()
  .trim()
  .min(1, 'Id is required')
  .regex(SCHEMA_IDENTIFIER_REGEX, 'Invalid identifier format');

const name = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .regex(NAME_REGEX, 'Invalid name format');

const schemaFieldPayload = z.object({
  name,
  type: z.enum(FieldKind),
  required: z.boolean(),
});

const schemaImportFieldPayload = schemaFieldPayload.extend({
  id: schemaId,
});

const validateSort = (
  payload: Pick<Schema, 'sort' | 'direction'>,
  ctx: z.RefinementCtx
) => {
  if (payload.sort !== null && payload.direction === null) {
    ctx.addIssue({
      code: 'custom',
      message: 'Direction is required when sort is provided',
      path: ['direction'],
    });
  }

  if (payload.sort === null && payload.direction !== null) {
    ctx.addIssue({
      code: 'custom',
      message: 'Sort is required when direction is provided',
      path: ['sort'],
    });
  }
};

const validateUniqueFields = (
  fields: Pick<SchemaField, 'name' | 'type'>[],
  ctx: z.RefinementCtx
) => {
  const seenFields = new Set<string>();
  for (const field of fields) {
    const key = `${field.name}-${field.type}`;
    if (seenFields.has(key)) {
      ctx.addIssue({
        code: 'custom',
        message: `Field with name "${field.name}" and type "${field.type}" must be unique`,
      });
    } else {
      seenFields.add(key);
    }
  }
};

export const schemaParamsPayload = z.object({
  id: schemaId,
});

const schemaSortShape = {
  sort: schemaId.nullable(),
  direction: z.enum(SortDirection).nullable(),
};

const createUpdateSchemaPayload = z
  .object({
    name,
    ...schemaSortShape,
    fields: z
      .array(schemaFieldPayload)
      .min(1, 'At least one field is required'),
  })
  .superRefine((payload, ctx) => {
    validateUniqueFields(payload.fields, ctx);
    validateSort(payload, ctx);
  });

export const schemaPayload = createUpdateSchemaPayload;

export const schemaImportPayload = z
  .object({
    id: schemaId,
    name,
    ...schemaSortShape,
    fields: z
      .array(schemaImportFieldPayload)
      .min(1, 'At least one field is required'),
    notes: z.array(
      z.looseObject({
        id: noteId,
        schema: schemaId,
      })
    ),
  })
  .strict()
  .superRefine((payload, ctx) => {
    validateUniqueFields(payload.fields, ctx);
    validateSort(payload, ctx);

    if (
      payload.sort !== null &&
      !payload.fields.some(field => field.id === payload.sort)
    ) {
      ctx.addIssue({
        code: 'custom',
        message: `Sort field "${payload.sort}" must exist in schema fields`,
        path: ['sort'],
      });
    }

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
