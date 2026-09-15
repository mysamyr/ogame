export type Note = {
  id: string;
  schema: string;
  // additional dynamic fields
  [key: string]: unknown;
};

export type NotesPage = {
  items: Note[];
  total: number;
  limit: number | null;
  offset: number;
};
