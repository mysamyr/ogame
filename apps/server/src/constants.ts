export const planetRegex = /^\d+:\d+:\d+$/;

export enum NoteType {
  PLANET_STATS = 'planet_stats',
  TEST = 'test',
}

export enum FieldKind {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  TIME = 'time',
}
