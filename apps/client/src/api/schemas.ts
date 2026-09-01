import {
  SchemaCreatePayload,
  SchemaDescriptor,
  SchemaUpdatePayload,
} from '../types/index.js';

import api from './index.js';

export async function fetchSchemas(): Promise<SchemaDescriptor[]> {
  try {
    return await api.get<SchemaDescriptor[]>('/api/schemas');
  } catch (error) {
    console.error('Failed to fetch schemas:', error);
    return [];
  }
}

export async function fetchSchemaById(
  schemaId: string
): Promise<SchemaDescriptor> {
  return await api.get<SchemaDescriptor>(
    `/api/schemas/${encodeURIComponent(String(schemaId))}`
  );
}

export async function createSchema(
  payload: SchemaCreatePayload
): Promise<SchemaDescriptor> {
  return await api.post<SchemaDescriptor>('/api/schemas', payload);
}

export async function updateSchema(
  schemaId: string,
  payload: SchemaUpdatePayload
): Promise<SchemaDescriptor> {
  return await api.put<SchemaDescriptor>(
    `/api/schemas/${encodeURIComponent(String(schemaId))}`,
    payload
  );
}

export async function deleteSchema(schemaId: string): Promise<void> {
  return await api.delete(
    `/api/schemas/${encodeURIComponent(String(schemaId))}`
  );
}
