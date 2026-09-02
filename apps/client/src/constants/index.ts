export enum ButtonVariant {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  DANGER = 'danger',
  TEXT = 'text',
  ICON = 'icon',
}

export enum FieldKind {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  TIME = 'time',
}

export enum FilterOperator {
  EQUALS = '=',
  NOT_EQUALS = '!=',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  LESS_THAN = '<',
  GREATER_THAN = '>',
}

export enum FilterLogicalOperator {
  AND = 'AND',
  OR = 'OR',
}

export const IDENTIFIER_NAME_REGEX = /^[A-Za-z0-9_ ]+$/;
export const IDENTIFIER_NAME_HINT =
  'Only letters, numbers, spaces, and underscores';

export const SCHEMA_IDENTIFIER_REGEX = /^[a-z0-9_ ]+$/;
export const NOTE_IDENTIFIER_REGEX = /^\d{13}-(?:\d|[1-9]\d{1,3})$/;
export const IDENTIFIER_MESSAGE = 'Invalid identifier format';
export const IDENTIFIER_NAME_MESSAGE =
  'Only letters, numbers, spaces, and underscores are allowed';
