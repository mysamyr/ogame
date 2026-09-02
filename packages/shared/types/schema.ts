import type { FieldKind } from '@ogame/shared/constants/index.js';

export type SchemaField = {
  id: string;
  name: string;
  type: FieldKind;
  required: boolean;
};

export type Schema = {
  id: string;
  name: string;
  fields: SchemaField[];
};
