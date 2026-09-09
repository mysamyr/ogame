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
  min: z.number().nullable(),
  max: z.number().nullable(),
  regexp: z.string().nullable(),
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

const validateRequiredFields = (
  fields: Pick<SchemaField, 'required'>[],
  ctx: z.RefinementCtx
) => {
  if (!fields.some(field => field.required)) {
    ctx.addIssue({
      code: 'custom',
      message: 'There should be at least 1 required field',
    });
  }
};

const validateFieldsRestrictions = (
  fields: Pick<SchemaField, 'type' | 'min' | 'max'>[],
  ctx: z.RefinementCtx
) => {
  fields.forEach((field, index) => {
    if (field.type === FieldKind.STRING) {
      if (field.min !== null && field.min < 0) {
        ctx.addIssue({
          code: 'custom',
          message: 'Min cannot be negative for string fields',
          path: ['fields', index, 'min'],
        });
      }
      if (field.max !== null && field.max < 0) {
        ctx.addIssue({
          code: 'custom',
          message: 'Max cannot be negative for string fields',
          path: ['fields', index, 'max'],
        });
      }
    }

    if (field.min !== null && field.max !== null && field.min > field.max) {
      ctx.addIssue({
        code: 'custom',
        message: 'Min cannot be greater than max for string fields',
        path: ['fields', index, 'min'],
      });
    }
  });
};

const validateImportedFieldConstraints = (
  field: Pick<SchemaField, 'type' | 'min' | 'max' | 'regexp'>,
  index: number,
  ctx: z.RefinementCtx
) => {
  const supportsMinMax = field.type !== FieldKind.BOOLEAN;

  if (!supportsMinMax && (field.min !== null || field.max !== null)) {
    if (field.min !== null) {
      ctx.addIssue({
        code: 'custom',
        message: 'Min is not supported for boolean fields',
        path: ['fields', index, 'min'],
      });
    }

    if (field.max !== null) {
      ctx.addIssue({
        code: 'custom',
        message: 'Max is not supported for boolean fields',
        path: ['fields', index, 'max'],
      });
    }
  }

  if (field.min !== null && field.max !== null && field.min > field.max) {
    ctx.addIssue({
      code: 'custom',
      message: 'Min must be less than or equal to max',
      path: ['fields', index, 'min'],
    });
  }

  if (field.type !== FieldKind.STRING && field.regexp !== null) {
    ctx.addIssue({
      code: 'custom',
      message: 'Regexp is only supported for string fields',
      path: ['fields', index, 'regexp'],
    });
  }

  if (field.regexp !== null) {
    try {
      new RegExp(field.regexp);
    } catch {
      ctx.addIssue({
        code: 'custom',
        message: 'Regexp must be a valid regular expression',
        path: ['fields', index, 'regexp'],
      });
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
    validateRequiredFields(payload.fields, ctx);
    validateUniqueFields(payload.fields, ctx);
    validateFieldsRestrictions(payload.fields, ctx);
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
    validateRequiredFields(payload.fields, ctx);
    validateUniqueFields(payload.fields, ctx);
    validateFieldsRestrictions(payload.fields, ctx);
    validateSort(payload, ctx);
    for (const [index, field] of payload.fields.entries()) {
      validateImportedFieldConstraints(field, index, ctx);
    }

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
