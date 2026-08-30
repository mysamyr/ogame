import { z } from 'zod';

import { FieldKind, NoteType } from '../constants.js';

import { dateSchema, planetSchema, stringSchema } from './base-schemas.js';
import { schema as planetStatsSchema } from './i-planets-gang.js';
import { schema as testSchema } from './test.js';

const baseFields = z.object({
  id: stringSchema.optional(),
  planet: planetSchema,
  date: dateSchema,
  type: z.nativeEnum(NoteType),
});

/**
 * MAIN NOTE SCHEMAS
 * Each note type has a payload schema that is merged with the base fields.
 */
const payloadSchemas: Record<NoteType, z.AnyZodObject> = {
  [NoteType.PLANET_STATS]: planetStatsSchema,
  [NoteType.TEST]: testSchema,
} as const;

/**
 * For each record type build a full note schema (base + payload fields).
 * Export utility to get Zod schema for a type.
 */
export function getNoteSchemaForType(type: NoteType) {
  return baseFields
    .merge(payloadSchemas[type])
    .extend({ type: z.literal(type) });
}

/**
 * Generic runtime helper to test whether a type is known
 */
export function isKnownType(type: string): type is NoteType {
  return Object.values(NoteType).includes(type as NoteType);
}

/**
 * Expose a simplified schema description suitable for the frontend:
 * { type: string, fields: { name, kind }[] }
 */
export type SchemaFieldDescriptor = {
  name: string;
  kind: FieldKind;
  optional: boolean;
};
export type SchemaDescriptor = {
  type: string;
  fields: SchemaFieldDescriptor[];
};

function analyzeZodType(zodType: z.ZodTypeAny): {
  typeName: string;
  optional: boolean;
  nullable: boolean;
  isDate: boolean;
  isTime: boolean;
} {
  let current: z.ZodTypeAny | undefined = zodType;
  let optional = false;
  let nullable = false;
  let isDate = false;
  let isTime = false;

  while (current) {
    const def = current._def as {
      typeName?: string;
      innerType?: z.ZodTypeAny;
      schema?: z.ZodTypeAny;
      type?: z.ZodTypeAny;
    };
    const typeName = def.typeName;

    if (
      typeName === 'ZodOptional' ||
      typeName === 'ZodDefault' ||
      typeName === 'ZodCatch'
    ) {
      optional = true;
    }
    if (typeName === 'ZodNullable') {
      nullable = true;
    }
    if (typeName === 'ZodString') {
      isDate = (current as z.ZodString).isDate;
      isTime = (current as z.ZodString).isTime;
    }

    const next =
      typeName === 'ZodOptional' ||
      typeName === 'ZodNullable' ||
      typeName === 'ZodDefault' ||
      typeName === 'ZodCatch' ||
      typeName === 'ZodReadonly' ||
      typeName === 'ZodBranded'
        ? (def.innerType ?? def.type)
        : typeName === 'ZodEffects' || typeName === 'ZodPipeline'
          ? def.schema
          : undefined;

    if (!next || next === current) {
      return {
        typeName: typeName ?? 'ZodUnknown',
        optional,
        nullable,
        isDate,
        isTime,
      };
    }

    current = next;
  }

  return { typeName: 'ZodUnknown', optional, nullable, isDate, isTime };
}

export function getSchemaDescriptors(): SchemaDescriptor[] {
  return (Object.values(NoteType) as NoteType[]).map(type => {
    const rawShape = payloadSchemas[type]._def.shape() as Record<
      string,
      z.ZodTypeAny
    >;

    const fields: SchemaFieldDescriptor[] = Object.keys(rawShape).map(k => {
      const zodType = rawShape[k] as z.ZodTypeAny;
      const info = analyzeZodType(zodType);
      const typeName = info.typeName;
      const optional = info.optional;
      const isDate = info.isDate;
      const isTime = info.isTime;

      if (typeName === 'ZodNumber')
        return { name: k, kind: FieldKind.NUMBER, optional };
      if (typeName === 'ZodBoolean')
        return { name: k, kind: FieldKind.BOOLEAN, optional };

      if (typeName === 'ZodString' && isDate)
        return { name: k, kind: FieldKind.DATE, optional };
      if (typeName === 'ZodString' && isTime)
        return { name: k, kind: FieldKind.TIME, optional };

      return { name: k, kind: FieldKind.STRING, optional };
    });

    return { type: String(type), fields };
  });
}
