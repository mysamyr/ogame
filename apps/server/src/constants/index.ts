export const planetRegex = /^\d:\d{1,3}:(?:[1-9]|1[0-6])$/;

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
