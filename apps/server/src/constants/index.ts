export const schemaIdentifierRegex = /^[a-z0-9_ ]+$/;
export const noteIdentifierRegex = /^\d{13}-(?:\d|[1-9]\d{1,3})$/;
export const identifierMessage = 'Invalid identifier format';

export const identifierNameRegex = /^[A-Za-z0-9_ ]+$/;
export const identifierNameMessage =
  'Only letters, numbers, spaces, and underscores are allowed';

export enum FieldKind {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  TIME = 'time',
}
