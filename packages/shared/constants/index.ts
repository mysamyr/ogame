export enum FieldKind {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  TIME = 'time',
}

export enum SortDirection {
  DESC = 'desc',
  ASC = 'asc',
}

export const SCHEMA_IDENTIFIER_REGEX = /^[a-z0-9_ ]+$/;
export const NOTE_IDENTIFIER_REGEX = /^\d{13}-(?:\d|[1-9]\d{1,3})$/;
export const NAME_REGEX = /^[A-Za-z0-9_ ]+$/;
