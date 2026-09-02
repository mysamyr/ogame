export type GetNotesQuery = {
  limit?: number;
  offset?: number;
};

export type NoteRecord = {
  id: string;
  schema: string;
  /**
   * JSON string representing the note's fields
   */
  payload: string;
};

export type Note = {
  id: string;
  schema: string;
  // additional dynamic fields
  [key: string]: unknown;
};

export type SchemaField = {
  id: number;
  schema_id: string;
  name: string;
  type: string;
  required: boolean;
};

export type SchemaDescriptor = {
  id: string;
  name: string;
  fields: Omit<SchemaField, 'schema_id'>[];
};

export type SchemaInput = {
  name: string;
  fields: Array<{
    name: string;
    type: string;
    required: boolean;
  }>;
};

export type SchemaExportInput = SchemaDescriptor & {
  notes: Note[];
};
