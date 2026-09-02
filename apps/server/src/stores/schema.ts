import { FieldKind } from '@ogame/shared/constants';
import { Schema } from '@ogame/shared/types';

import { get, list, run } from '../services/db.js';

type SchemaRecord = {
  id: string;
  name: string;
};

type SchemaFieldRecord = {
  id: string;
  name: string;
  type: FieldKind;
  required: number;
};

export async function getAllSchemas(): Promise<Schema[]> {
  // TODO: use JOIN?
  const schemas = await list<SchemaRecord>(
    'SELECT id, name FROM schemas ORDER BY name'
  );

  return Promise.all(
    schemas.map(async schema => {
      const fields = await list<SchemaFieldRecord>(
        'SELECT id, name, type, required FROM schema_fields WHERE schema_id = ?',
        [schema.id]
      );
      return {
        id: schema.id,
        name: schema.name,
        fields: fields.map(f => ({ ...f, required: f.required === 1 })),
      };
    })
  );
}

export async function getSchemaById(id: string): Promise<Schema | null> {
  const schema = await get<SchemaRecord>(
    'SELECT id, name FROM schemas WHERE id = ?',
    [id]
  );
  if (!schema) return null;

  const fields = await list<SchemaFieldRecord>(
    'SELECT id, name, type, required FROM schema_fields WHERE schema_id = ?',
    [schema.id]
  );

  return {
    id: schema.id,
    name: schema.name,
    fields: fields.map(f => ({ ...f, required: f.required === 1 })),
  };
}

export async function createSchema(descriptor: Schema): Promise<void> {
  await run('INSERT INTO schemas (id, name) VALUES (?, ?)', [
    descriptor.id,
    descriptor.name,
  ]);
  for (const field of descriptor.fields) {
    await run(
      'INSERT INTO schema_fields (id, schema_id, name, type, required) VALUES (?, ?, ?, ?, ?)',

      [field.id, descriptor.id, field.name, field.type, field.required ? 1 : 0]
    );
  }
}

export async function upsertSchema(descriptor: Schema): Promise<void> {
  await run(
    'INSERT INTO schemas (id, name) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET name = excluded.name',
    [descriptor.id, descriptor.name]
  );
  await run('DELETE FROM schema_fields WHERE schema_id = ?', [descriptor.id]);
  for (const field of descriptor.fields) {
    await run(
      'INSERT INTO schema_fields (id, schema_id, name, type, required) VALUES (?, ?, ?, ?, ?)',
      [field.id, descriptor.id, field.name, field.type, field.required ? 1 : 0]
    );
  }
}

export async function deleteSchema(id: string): Promise<void> {
  await run('DELETE FROM schema_fields WHERE schema_id = ?', [id]);
  await run('DELETE FROM schemas WHERE id = ?', [id]);
}
