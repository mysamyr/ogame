import {
  SchemaCreatePayload,
  SchemaDescriptor,
  SchemaUpdatePayload,
} from '../types/index.js';

import api from './index.js';

export async function fetchSchemas(): Promise<SchemaDescriptor[]> {
  return await api.get<SchemaDescriptor[]>('/api/schema');
}

export async function fetchSchemaById(
  schemaId: string
): Promise<SchemaDescriptor> {
  return await api.get<SchemaDescriptor>(
    `/api/schema/${encodeURIComponent(String(schemaId))}`
  );
}

export async function createSchema(
  payload: SchemaCreatePayload
): Promise<SchemaDescriptor> {
  return await api.post<SchemaDescriptor>('/api/schema', payload);
}

export async function updateSchema(
  schemaId: string,
  payload: SchemaUpdatePayload
): Promise<SchemaDescriptor> {
  return await api.put<SchemaDescriptor>(
    `/api/schema/${encodeURIComponent(String(schemaId))}`,
    payload
  );
}

export async function deleteSchema(schemaId: string): Promise<void> {
  return await api.delete(
    `/api/schema/${encodeURIComponent(String(schemaId))}`
  );
}

export async function exportSchema(schemaId: string): Promise<unknown> {
  return await api.get<unknown>(
    `/api/schema/${encodeURIComponent(String(schemaId))}/export`
  );
}

export async function importSchema(payload: unknown): Promise<unknown> {
  return await api.post<unknown>('/api/schema/import', payload);
}
