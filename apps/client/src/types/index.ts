import {
  FieldKind,
  FilterLogicalOperator,
  FilterOperator,
} from '../constants/index.js';

export type SchemaField = {
  id: number;
  name: string;
  type: FieldKind;
  required: boolean;
};

export type SchemaDescriptor = {
  id: string;
  name: string;
  fields: SchemaField[];
};

export type SchemaFieldPayload = {
  name: string;
  type: FieldKind;
  required: boolean;
};

export type SchemaCreatePayload = {
  name: string;
  fields: SchemaFieldPayload[];
};

export type SchemaUpdatePayload = SchemaCreatePayload;

export interface NoteRecord extends Record<string, unknown> {
  id?: string;
  planet: string;
  date: string;
  type: string;
}

export type FilterColumn = {
  id: string;
  label: string;
  type: FieldKind;
};

export type FilterRule = {
  column: string;
  operator: FilterOperator;
  value: string;
  logicalOperator: FilterLogicalOperator;
};
