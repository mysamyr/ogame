import { get, list, run } from '../services/db.js';
import type { SchemaDescriptor, SchemaInput } from '../types/index.js';
import { uuid } from '../utils/uuid.js';

export async function upsertSchema(descriptor: SchemaInput): Promise<void> {
  const existing = await get<{ id: string }>(
    'SELECT id FROM schemas WHERE name = ?',
    [descriptor.name]
  );
  const id = existing?.id ?? uuid();

  await run(
    'INSERT INTO schemas (id, name) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET name = excluded.name',
    [id, descriptor.name]
  );
  await run('DELETE FROM schema_fields WHERE schema_id = ?', [id]);
  for (const field of descriptor.fields) {
    await run(
      'INSERT INTO schema_fields (id, schema_id, name, type, required) VALUES (?, ?, ?, ?, ?)',
      [uuid(), id, field.name, field.type, field.required ? 1 : 0]
    );
  }
}

export async function getAllSchemas(): Promise<SchemaDescriptor[]> {
  const schemas = await list<{ id: string; name: string }>(
    'SELECT id, name FROM schemas ORDER BY name'
  );

  return Promise.all(
    schemas.map(async schema => {
      const fields = await list<{
        id: number;
        name: string;
        type: string;
        required: number;
      }>(
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

export async function getSchemaById(
  id: string
): Promise<SchemaDescriptor | null> {
  const schema = await get<{ id: string; name: string }>(
    'SELECT id, name FROM schemas WHERE id = ?',
    [id]
  );
  if (!schema) return null;

  const fields = await list<{
    id: number;
    name: string;
    type: string;
    required: number;
  }>('SELECT id, name, type, required FROM schema_fields WHERE schema_id = ?', [
    schema.id,
  ]);

  return {
    id: schema.id,
    name: schema.name,
    fields: fields.map(f => ({ ...f, required: f.required === 1 })),
  };
}

export async function createSchema(
  descriptor: SchemaInput
): Promise<SchemaDescriptor> {
  const id = uuid();
  await run('INSERT INTO schemas (id, name) VALUES (?, ?)', [
    id,
    descriptor.name,
  ]);
  for (const field of descriptor.fields) {
    await run(
      'INSERT INTO schema_fields (id, schema_id, name, type, required) VALUES (?, ?, ?, ?, ?)',
      [uuid(), id, field.name, field.type, field.required ? 1 : 0]
    );
  }
  const created = await getSchemaById(id);
  if (!created) throw new Error('failed to create schema');
  return created;
}

export async function updateSchema(
  id: string,
  descriptor: SchemaInput
): Promise<SchemaDescriptor | null> {
  const existing = await get<{ id: string }>(
    'SELECT id FROM schemas WHERE id = ?',
    [id]
  );
  if (!existing) return null;

  await run('UPDATE schemas SET name = ? WHERE id = ?', [descriptor.name, id]);
  await run('DELETE FROM schema_fields WHERE schema_id = ?', [id]);
  for (const field of descriptor.fields) {
    await run(
      'INSERT INTO schema_fields (id, schema_id, name, type, required) VALUES (?, ?, ?, ?, ?)',
      [uuid(), id, field.name, field.type, field.required ? 1 : 0]
    );
  }

  const updated = await getSchemaById(id);
  if (!updated) throw new Error('failed to update schema');
  return updated;
}

export async function deleteSchema(id: string): Promise<boolean> {
  const existing = await get<{ id: string }>(
    'SELECT id FROM schemas WHERE id = ?',
    [id]
  );
  if (!existing) return false;

  await run('DELETE FROM schema_fields WHERE schema_id = ?', [id]);
  await run('DELETE FROM schemas WHERE id = ?', [id]);
  return true;
}
