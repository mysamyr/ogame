export type Note = {
  id: string;
  schema: string;
  // additional dynamic fields
  [key: string]: unknown;
};
