import { Schema } from '@ogame/shared/types';
import {
  SchemaImportPayload,
  SchemaParams,
  SchemaPayload,
} from '@ogame/shared/validation';

import api from './index.js';

export async function fetchSchemas(): Promise<Schema[]> {
  return await api.get<Schema[]>('/api/schema');
}

export async function fetchSchemaById(
  schemaId: SchemaParams['id']
): Promise<Schema> {
  return await api.get<Schema>(
    `/api/schema/${encodeURIComponent(String(schemaId))}`
  );
}

export async function createSchema(payload: SchemaPayload): Promise<Schema> {
  return await api.post<Schema>('/api/schema', payload);
}

export async function updateSchema(
  schemaId: SchemaParams['id'],
  payload: SchemaPayload
): Promise<Schema> {
  return await api.put<Schema>(
    `/api/schema/${encodeURIComponent(String(schemaId))}`,
    payload
  );
}

export async function deleteSchema(
  schemaId: SchemaParams['id']
): Promise<void> {
  await api.delete(`/api/schema/${encodeURIComponent(String(schemaId))}`);
}

export async function exportSchema(
  schemaId: SchemaParams['id']
): Promise<Schema> {
  return await api.get<Schema>(
    `/api/schema/${encodeURIComponent(String(schemaId))}/export`
  );
}

export async function importSchema(
  payload: SchemaImportPayload
): Promise<void> {
  await api.post<unknown>('/api/schema/import', payload);
}
