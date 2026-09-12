import type { Schema } from '@ogame/shared/types';
import type { SchemaParams } from '@ogame/shared/validation';

import { create } from 'zustand';

interface SchemasSlice {
  schemas: Schema[];
  setSchemas: (s: Schema[]) => void;
  addSchema: (schema: Schema) => void;
  updateSchema: (schemaId: SchemaParams['id'], schema: Schema) => void;
  removeSchema: (schemaId: SchemaParams['id']) => void;
  getActiveSchema: (id: string) => Schema | null;
}

export const useSchemasStore = create<SchemasSlice>((set, getState) => ({
  schemas: [],
  setSchemas: s => set({ schemas: s }),
  addSchema: schema => set(state => ({ schemas: [...state.schemas, schema] })),
  updateSchema: (schemaId, schema) =>
    set(state => ({
      schemas: state.schemas.map(s => (s.id === schemaId ? schema : s)),
    })),
  removeSchema: schemaId =>
    set(state => ({
      schemas: state.schemas.filter(s => s.id !== schemaId),
    })),
  getActiveSchema: (id: string) =>
    getState().schemas.find(s => s.id === id) || null,
}));
