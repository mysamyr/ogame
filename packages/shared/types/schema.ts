import type {
  FieldKind,
  SortDirection,
} from '@ogame/shared/constants/index.js';

export type SchemaField = {
  id: string;
  name: string;
  type: FieldKind;
  required: boolean;
  min: number | null;
  max: number | null;
  regexp: string | null;
};

export type Schema = {
  id: string;
  name: string;
  /**
   * The ID of the field by which the schema is sorted, or null if not sorted.
   */
  sort: string | null;
  /**
   * The direction in which the schema is sorted, or null if not sorted.
   */
  direction: SortDirection | null;
  fields: SchemaField[];
};
