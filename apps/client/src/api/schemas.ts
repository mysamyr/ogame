import { SchemaDescriptor } from '../types/index.js';

import api from './index.js';

export async function fetchSchemas(): Promise<SchemaDescriptor[]> {
  try {
    return await api.get<SchemaDescriptor[]>('/api/schemas');
  } catch (error) {
    console.error('Failed to fetch schemas:', error);
    return [];
  }
}
