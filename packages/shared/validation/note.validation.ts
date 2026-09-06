import { z } from 'zod';

import {
  FieldKind,
  FilterLogicalOperator,
  FilterOperator,
  NOTE_IDENTIFIER_REGEX,
  SCHEMA_IDENTIFIER_REGEX,
  SortDirection,
} from '../constants/index.js';
import type { SchemaField } from '../types/schema.js';
import { createPatternFromConfig } from '../utils/index.js';

export const noteId = z
  .string()
  .trim()
  .min(1, 'Id is required')
  .regex(NOTE_IDENTIFIER_REGEX, 'Invalid identifier format');

const paginationLimitParam = z.coerce.number().int().gt(0);
const paginationOffsetParam = z.coerce.number().int().min(0);

export const filterRulePayload = z.object({
  column: z
    .string()
    .min(1)
    .regex(SCHEMA_IDENTIFIER_REGEX, 'Invalid filter field'),
  operator: z.enum(FilterOperator),
  value: z.string(),
  logicalOperator: z.enum(FilterLogicalOperator),
});

export const filterRulesPayload = z.array(filterRulePayload);

const filterRulesQueryParam = z.string().transform((value, ctx) => {
  try {
    const result = filterRulesPayload.safeParse(JSON.parse(value));
    if (result.success) {
      return result.data;
    }
  } catch {
    // Report a single query-level issue below.
  }

  ctx.addIssue({
    code: 'custom',
    message: 'Filters must be a valid JSON array of filter rules',
  });
  return z.NEVER;
});

export const getNotesQueryPayload = z
  .object({
    schema: z.string().min(1).optional(),
    limit: paginationLimitParam.optional(),
    offset: paginationOffsetParam.optional(),
    sort: z
      .string()
      .min(1)
      .regex(SCHEMA_IDENTIFIER_REGEX, 'Invalid sort field')
      .optional(),
    direction: z.enum(SortDirection).optional(),
    filters: filterRulesQueryParam.optional(),
  })
  .superRefine((query, ctx) => {
    if (query.sort && query.direction == null) {
      ctx.addIssue({
        code: 'custom',
        message: 'Direction is required when sort is provided',
        path: ['direction'],
      });
    }
    if (query.direction != null && !query.sort) {
      ctx.addIssue({
        code: 'custom',
        message: 'Sort is required when direction is provided',
        path: ['sort'],
      });
    }
  });

export const noteParamsPayload = z.object({
  id: noteId,
});

export const notePayload = z.object({
  schema: z.string().describe('Schema id'),
  // other fields from selected schema
});

export function validateNoteBySchema(
  payload: NotePayload,
  fields: SchemaField[]
): z.ZodSafeParseResult<Record<string, unknown>> {
  const shape: Record<string, z.ZodType> = {};

  for (const field of fields) {
    let fieldSchema: z.ZodType;

    if (field.type === FieldKind.STRING) {
      let schema = z.string({
        error: `Field "${field.name}" must be a string`,
      });
      if (field.min !== null) {
        schema = schema.min(field.min, {
          error: `Field "${field.name}" length must be at least ${field.min}`,
        });
      }
      if (field.max !== null) {
        schema = schema.max(field.max, {
          error: `Field "${field.name}" length must be at most ${field.max}`,
        });
      }
      if (field.regexp !== null) {
        schema = schema.regex(createPatternFromConfig(field.regexp), {
          error: `Field "${field.name}" does not match configured pattern`,
        });
      }
      fieldSchema = schema;
    } else if (field.type === FieldKind.NUMBER) {
      let schema = z.number({
        error: `Field "${field.name}" must be a number`,
      });
      if (field.min !== null) {
        schema = schema.gte(field.min, {
          error: `Field "${field.name}" must be greater than or equal to ${field.min}`,
        });
      }
      if (field.max !== null) {
        schema = schema.lte(field.max, {
          error: `Field "${field.name}" must be less than or equal to ${field.max}`,
        });
      }
      fieldSchema = schema;
    } else if (field.type === FieldKind.BOOLEAN) {
      fieldSchema = z.boolean({
        error: `Field "${field.name}" must be a boolean`,
      });
    } else if (field.type === FieldKind.DATE) {
      fieldSchema = z.iso.date({
        error: `Field "${field.name}" must be a valid date in YYYY-MM-DD format`,
      });
    } else {
      fieldSchema = z.iso.time({
        error: `Field "${field.name}" must be a valid time in HH:mm format`,
      });
    }

    shape[field.id] = field.required ? fieldSchema : fieldSchema.optional();
  }

  return z.looseObject(shape).safeParse(payload);
}

export type GetNotesQuery = z.infer<typeof getNotesQueryPayload>;
export type FilterRule = z.infer<typeof filterRulePayload>;
export type NoteParams = z.infer<typeof noteParamsPayload>;
export type NotePayload = z.infer<typeof notePayload>;
