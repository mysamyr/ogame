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
  LESS_THAN = '<',
  GREATER_THAN = '>',
}

export enum FilterLogicalOperator {
  AND = 'AND',
  OR = 'OR',
}

export const PLANET_COORDINATES_REGEX = /^\d:\d{1,3}:(?:[1-9]|1[0-6])$/;

export const IDENTIFIER_NAME_REGEX = /^[A-Za-z0-9_ ]+$/;
export const IDENTIFIER_NAME_HINT =
  'Only letters, numbers, spaces, and underscores';
