import { FieldKind, SortDirection } from '@ogame/shared/constants';
import { Schema } from '@ogame/shared/types';

import { get, list, run } from '../services/db.js';

type SchemaRecord = {
  id: string;
  name: string;
  sort: string;
  direction: SortDirection;
};

type SchemaFieldRecord = {
  id: string;
  name: string;
  type: FieldKind;
  required: number;
  min: number | null;
  max: number | null;
  regexp: string | null;
};

export async function getAllSchemas(): Promise<Schema[]> {
  // TODO: use JOIN?
  const schemas = await list<SchemaRecord>(
    'SELECT id, name, sort, direction FROM schemas ORDER BY name'
  );

  return Promise.all(
    schemas.map(async schema => {
      const fields = await list<SchemaFieldRecord>(
        'SELECT id, name, type, required, min, max, `regexp` FROM schema_fields WHERE schema_id = ?',
        [schema.id]
      );
      return {
        id: schema.id,
        name: schema.name,
        sort: schema.sort,
        direction: schema.direction,
        fields: fields.map(f => ({ ...f, required: f.required === 1 })),
      };
    })
  );
}

export async function getSchemaById(id: string): Promise<Schema | null> {
  const schema = await get<SchemaRecord>(
    'SELECT id, name, sort, direction FROM schemas WHERE id = ?',
    [id]
  );
  if (!schema) return null;

  const fields = await list<SchemaFieldRecord>(
    'SELECT id, name, type, required, min, max, `regexp` FROM schema_fields WHERE schema_id = ?',
    [schema.id]
  );

  return {
    id: schema.id,
    name: schema.name,
    sort: schema.sort,
    direction: schema.direction,
    fields: fields.map(f => ({ ...f, required: f.required === 1 })),
  };
}

export async function createSchema(descriptor: Schema): Promise<void> {
  await run(
    'INSERT INTO schemas (id, name, sort, direction) VALUES (?, ?, ?, ?)',
    [descriptor.id, descriptor.name, descriptor.sort, descriptor.direction]
  );
  for (const field of descriptor.fields) {
    await run(
      'INSERT INTO schema_fields (id, schema_id, name, type, required, min, max, `regexp`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',

      [
        field.id,
        descriptor.id,
        field.name,
        field.type,
        field.required ? 1 : 0,
        field.min,
        field.max,
        field.regexp,
      ]
    );
  }
}

export async function upsertSchema(descriptor: Schema): Promise<void> {
  await run(
    'INSERT INTO schemas (id, name, sort, direction) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name = excluded.name, sort = excluded.sort, direction = excluded.direction',
    [descriptor.id, descriptor.name, descriptor.sort, descriptor.direction]
  );
  await run('DELETE FROM schema_fields WHERE schema_id = ?', [descriptor.id]);
  for (const field of descriptor.fields) {
    await run(
      'INSERT INTO schema_fields (id, schema_id, name, type, required, min, max, `regexp`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        field.id,
        descriptor.id,
        field.name,
        field.type,
        field.required ? 1 : 0,
        field.min,
        field.max,
        field.regexp,
      ]
    );
  }
}

export async function deleteSchema(id: string): Promise<void> {
  await run('DELETE FROM schema_fields WHERE schema_id = ?', [id]);
  await run('DELETE FROM schemas WHERE id = ?', [id]);
}
