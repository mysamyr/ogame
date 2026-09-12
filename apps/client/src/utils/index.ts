import { FieldKind } from '@ogame/shared/constants';

export function classNames(
  ...classes: (string | boolean | undefined)[]
): string {
  return classes.filter(Boolean).join(' ');
}

export function getInputType(
  type: FieldKind
): 'date' | 'number' | 'text' | 'time' {
  if (type === FieldKind.DATE) return 'date';
  if (type === FieldKind.NUMBER) return 'number';
  if (type === FieldKind.TIME) return 'time';
  return 'text';
}

export * from './date.js';
export * from './number.js';
export * from './schemaValidation.js';
