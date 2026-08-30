export type SchemaField = {
  name: string;
  kind: 'string' | 'number' | 'boolean' | 'date' | 'time';
  optional?: boolean;
};

export type SchemaDescriptor = {
  type: string;
  fields: SchemaField[];
};

export interface NoteRecord extends Record<string, unknown> {
  id?: string;
  planet: string;
  date: string;
  type: string;
}
