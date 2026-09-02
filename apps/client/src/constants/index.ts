export enum ButtonVariant {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  DANGER = 'danger',
  TEXT = 'text',
  ICON = 'icon',
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

export const IDENTIFIER_NAME_HINT =
  'Only letters, numbers, spaces, and underscores';

export const IDENTIFIER_MESSAGE = 'Invalid identifier format';
export const IDENTIFIER_NAME_MESSAGE =
  'Only letters, numbers, spaces, and underscores are allowed';
