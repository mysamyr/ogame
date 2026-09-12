export enum FieldKind {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  TIME = 'time',
}

export enum FilterLogicalOperator {
  AND = 'AND',
  OR = 'OR',
}

export enum FilterOperator {
  EQUALS = '=',
  NOT_EQUALS = '!=',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  LESS_THAN = '<',
  GREATER_THAN = '>',
  GREATER_EQUAL_THAN = '>=',
  LESS_EQUAL_THAN = '<=',
}

export enum SortDirection {
  DESC = 'desc',
  ASC = 'asc',
}

export const SCHEMA_IDENTIFIER_REGEX = /^[a-z0-9_ ]+$/;
export const NOTE_IDENTIFIER_REGEX = /^\d{13}-(?:\d|[1-9]\d{1,3})$/;
export const NAME_REGEX = /^[A-Za-z0-9_ ]+$/;
export const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export const ISO_TIME_PATTERN = /^\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/;
