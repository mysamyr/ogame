import {
  FieldKind,
  ISO_DATE_PATTERN,
  ISO_TIME_PATTERN,
} from '@ogame/shared/constants';
import type { SchemaField } from '@ogame/shared/types';
import { createPatternFromConfig } from '@ogame/shared/utils';

type BooleanParseResult = { ok: true; value: boolean } | { ok: false };

type RecordValidationResult = {
  isValid: boolean;
  errors: Record<string, string>;
  typeMismatches: Record<string, boolean>;
};

export function formatUnknownValue(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  ) {
    return String(value);
  }
  if (value === undefined) {
    return 'undefined';
  }
  if (value === null) {
    return 'null';
  }
  try {
    return JSON.stringify(value) ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

export function parseBooleanValue(value: unknown): BooleanParseResult {
  if (value === null || value === undefined) {
    return { ok: true, value: false };
  }
  if (typeof value === 'boolean') {
    return { ok: true, value };
  }
  if (value === 1 || value === 0) {
    return { ok: true, value: value === 1 };
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') {
      return { ok: true, value: true };
    }
    if (normalized === 'false') {
      return { ok: true, value: false };
    }
  }
  return { ok: false };
}

function isMissingValue(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    value === '' ||
    (typeof value === 'number' && Number.isNaN(value))
  );
}

function parseNumberValue(
  value: unknown
): { ok: true; value: number } | { ok: false } {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return { ok: true, value };
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return { ok: true, value: parsed };
    }
  }
  return { ok: false };
}

function isIsoDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) {
    return false;
  }
  const timestamp = new Date(value).getTime();
  return !Number.isNaN(timestamp);
}

function isIsoTime(value: string): boolean {
  if (!ISO_TIME_PATTERN.test(value)) {
    return false;
  }
  const [hoursStr, minutesStr] = value.split(':');
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);
  return (
    Number.isInteger(hours) &&
    Number.isInteger(minutes) &&
    hours >= 0 &&
    hours <= 23 &&
    minutes >= 0 &&
    minutes <= 59
  );
}

function timeToMinutes(value: string): number | null {
  const [hoursStr, minutesStr] = value.split(':');
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }
  return hours * 60 + minutes;
}

function setTypeMismatch(
  result: RecordValidationResult,
  fieldId: string,
  message: string
): void {
  result.errors[fieldId] = message;
  result.typeMismatches[fieldId] = true;
  result.isValid = false;
}

function setConstraintError(
  result: RecordValidationResult,
  fieldId: string,
  message: string
): void {
  result.errors[fieldId] = message;
  result.isValid = false;
}

function validateBooleanField(
  result: RecordValidationResult,
  field: SchemaField,
  value: unknown
): void {
  const parsed = parseBooleanValue(value);
  if (!parsed.ok) {
    setTypeMismatch(
      result,
      field.id,
      `Value '${formatUnknownValue(value)}' is not a valid boolean`
    );
  }
}

function validateNumberField(
  result: RecordValidationResult,
  field: SchemaField,
  value: unknown
): void {
  if (isMissingValue(value)) {
    if (field.required) {
      setConstraintError(result, field.id, `Field "${field.name}" is required`);
    }
    return;
  }

  const parsed = parseNumberValue(value);
  if (!parsed.ok) {
    setTypeMismatch(result, field.id, `Field "${field.name}" must be a number`);
    return;
  }

  if (field.min !== null && parsed.value < field.min) {
    setConstraintError(
      result,
      field.id,
      `Field "${field.name}" must be greater than or equal to ${field.min}`
    );
    return;
  }
  if (field.max !== null && parsed.value > field.max) {
    setConstraintError(
      result,
      field.id,
      `Field "${field.name}" must be less than or equal to ${field.max}`
    );
  }
}

function validateStringField(
  result: RecordValidationResult,
  field: SchemaField,
  value: unknown
): void {
  if (isMissingValue(value)) {
    if (field.required) {
      setConstraintError(result, field.id, `Field "${field.name}" is required`);
    }
    return;
  }

  if (typeof value !== 'string') {
    setTypeMismatch(result, field.id, `Field "${field.name}" must be a string`);
    return;
  }

  if (field.min !== null && value.length < field.min) {
    setConstraintError(
      result,
      field.id,
      `Field "${field.name}" length must be at least ${field.min}`
    );
    return;
  }
  if (field.max !== null && value.length > field.max) {
    setConstraintError(
      result,
      field.id,
      `Field "${field.name}" length must be at most ${field.max}`
    );
    return;
  }
  if (field.regexp !== null) {
    try {
      const pattern = createPatternFromConfig(field.regexp);
      if (!pattern.test(value)) {
        setConstraintError(
          result,
          field.id,
          `Field "${field.name}" does not match configured pattern`
        );
      }
    } catch {
      setConstraintError(
        result,
        field.id,
        `Field "${field.name}" does not match configured pattern`
      );
    }
  }
}

function validateDateField(
  result: RecordValidationResult,
  field: SchemaField,
  value: unknown
): void {
  if (isMissingValue(value)) {
    if (field.required) {
      setConstraintError(result, field.id, `Field "${field.name}" is required`);
    }
    return;
  }

  if (typeof value !== 'string' || !isIsoDate(value)) {
    setTypeMismatch(
      result,
      field.id,
      `Field "${field.name}" must be a valid date in YYYY-MM-DD format`
    );
    return;
  }

  const timestamp = new Date(value).getTime();
  if (field.min !== null && timestamp < field.min) {
    setConstraintError(
      result,
      field.id,
      `Field "${field.name}" must be greater than or equal to the configured minimum`
    );
    return;
  }
  if (field.max !== null && timestamp > field.max) {
    setConstraintError(
      result,
      field.id,
      `Field "${field.name}" must be less than or equal to the configured maximum`
    );
  }
}

function validateTimeField(
  result: RecordValidationResult,
  field: SchemaField,
  value: unknown
): void {
  if (isMissingValue(value)) {
    if (field.required) {
      setConstraintError(result, field.id, `Field "${field.name}" is required`);
    }
    return;
  }

  if (typeof value !== 'string' || !isIsoTime(value)) {
    setTypeMismatch(
      result,
      field.id,
      `Field "${field.name}" must be a valid time in HH:mm format`
    );
    return;
  }

  const minutes = timeToMinutes(value);
  if (minutes === null) {
    setTypeMismatch(
      result,
      field.id,
      `Field "${field.name}" must be a valid time in HH:mm format`
    );
    return;
  }
  if (field.min !== null && minutes < field.min) {
    setConstraintError(
      result,
      field.id,
      `Field "${field.name}" must be greater than or equal to the configured minimum`
    );
    return;
  }
  if (field.max !== null && minutes > field.max) {
    setConstraintError(
      result,
      field.id,
      `Field "${field.name}" must be less than or equal to the configured maximum`
    );
  }
}

export function validateRecordAgainstSchema(
  record: Record<string, unknown>,
  fields: SchemaField[]
): RecordValidationResult {
  const result: RecordValidationResult = {
    isValid: true,
    errors: {},
    typeMismatches: {},
  };

  for (const field of fields) {
    const value = record[field.id];
    if (field.type === FieldKind.BOOLEAN) {
      validateBooleanField(result, field, value);
    } else if (field.type === FieldKind.NUMBER) {
      validateNumberField(result, field, value);
    } else if (field.type === FieldKind.STRING) {
      validateStringField(result, field, value);
    } else if (field.type === FieldKind.DATE) {
      validateDateField(result, field, value);
    } else {
      validateTimeField(result, field, value);
    }
  }

  return result;
}

/**
 * Coerces the values in a record to match the types defined in the schema fields.
 * String/Date/Time will be the same.
 * Number should be coerced to a number if possible. For NaN/''/null/undefined, it will be set to undefined.
 *
 * @param record The record to be coerced.
 * @param fields The schema fields to use for coercion.
 */
export function coerceRecordToSchema(
  record: Record<string, unknown>,
  fields: SchemaField[]
): Record<string, unknown> {
  const next = { ...record };

  for (const field of fields) {
    const value = next[field.id];
    if (field.type === FieldKind.BOOLEAN) {
      const parsed = parseBooleanValue(value);
      if (parsed.ok) {
        next[field.id] = parsed.value;
      }
    } else if (field.type === FieldKind.NUMBER) {
      if (isMissingValue(value)) {
        next[field.id] = undefined;
        continue;
      }
      const parsed = parseNumberValue(value);
      if (parsed.ok) {
        next[field.id] = parsed.value;
      }
    }
  }

  return next;
}
