import { FieldKind, SortDirection } from '@ogame/shared/constants';
import { Schema } from '@ogame/shared/types';

import { cacheKeys, queryCache } from '../services/cache.js';
import { list, run } from '../services/db.js';

type SchemaJoinRecord = {
  id: string;
  name: string;
  sort: string | null;
  direction: SortDirection | null;
  field_id: string | null;
  field_name: string | null;
  field_type: FieldKind | null;
  field_required: number | null;
  field_min: number | null;
  field_max: number | null;
  field_regexp: string | null;
};

function nestSchemas(rows: SchemaJoinRecord[]): Schema[] {
  const byId = new Map<string, Schema>();

  for (const row of rows) {
    let schema = byId.get(row.id);
    if (!schema) {
      schema = {
        id: row.id,
        name: row.name,
        sort: row.sort,
        direction: row.direction,
        fields: [],
      };
      byId.set(row.id, schema);
    }

    if (
      row.field_id != null &&
      row.field_name != null &&
      row.field_type != null
    ) {
      schema.fields.push({
        id: row.field_id,
        name: row.field_name,
        type: row.field_type,
        required: row.field_required === 1,
        min: row.field_min,
        max: row.field_max,
        regexp: row.field_regexp,
      });
    }
  }

  return [...byId.values()];
}

async function insertSchemaFields(
  schemaId: string,
  fields: Schema['fields']
): Promise<void> {
  for (const [position, field] of fields.entries()) {
    await run(
      'INSERT INTO schema_fields (id, schema_id, name, type, required, min, max, `regexp`, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        field.id,
        schemaId,
        field.name,
        field.type,
        field.required ? 1 : 0,
        field.min,
        field.max,
        field.regexp,
        position,
      ]
    );
  }
}

const SCHEMA_JOIN_SQL = `
  SELECT
    s.id,
    s.name,
    s.sort,
    s.direction,
    f.id AS field_id,
    f.name AS field_name,
    f.type AS field_type,
    f.required AS field_required,
    f.min AS field_min,
    f.max AS field_max,
    f.\`regexp\` AS field_regexp
  FROM schemas s
  LEFT JOIN schema_fields f ON f.schema_id = s.id
`;

export async function getAllSchemas(): Promise<Schema[]> {
  return queryCache.getOrSet(cacheKeys.allSchemas, loadAllSchemas);
}

async function loadAllSchemas(): Promise<Schema[]> {
  const rows = await list<SchemaJoinRecord>(
    `${SCHEMA_JOIN_SQL} ORDER BY s.name, f.position`
  );
  return nestSchemas(rows);
}

export async function getSchemaById(id: string): Promise<Schema | null> {
  return queryCache.getOrSet(cacheKeys.schema(id), () => loadSchemaById(id));
}

async function loadSchemaById(id: string): Promise<Schema | null> {
  const rows = await list<SchemaJoinRecord>(
    `${SCHEMA_JOIN_SQL} WHERE s.id = ? ORDER BY f.position`,
    [id]
  );
  if (rows.length === 0) return null;
  return nestSchemas(rows)[0] ?? null;
}

function invalidateSchema(id: string): void {
  queryCache.delete(cacheKeys.allSchemas);
  queryCache.delete(cacheKeys.schema(id));
  queryCache.deleteByPrefix(cacheKeys.notes(id));
}

export async function createSchema(descriptor: Schema): Promise<void> {
  try {
    await run(
      'INSERT INTO schemas (id, name, sort, direction) VALUES (?, ?, ?, ?)',
      [descriptor.id, descriptor.name, descriptor.sort, descriptor.direction]
    );
    await insertSchemaFields(descriptor.id, descriptor.fields);
  } finally {
    invalidateSchema(descriptor.id);
  }
}

export async function upsertSchema(descriptor: Schema): Promise<void> {
  try {
    await run(
      'INSERT INTO schemas (id, name, sort, direction) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name = excluded.name, sort = excluded.sort, direction = excluded.direction',
      [descriptor.id, descriptor.name, descriptor.sort, descriptor.direction]
    );
    await run('DELETE FROM schema_fields WHERE schema_id = ?', [descriptor.id]);
    await insertSchemaFields(descriptor.id, descriptor.fields);
  } finally {
    invalidateSchema(descriptor.id);
  }
}

export async function deleteSchema(id: string): Promise<void> {
  try {
    await run('BEGIN');
    try {
      await run(
        'DELETE FROM note_values WHERE note_id IN (SELECT id FROM notes WHERE schema = ?)',
        [id]
      );
      await run('DELETE FROM notes WHERE schema = ?', [id]);
      await run('DELETE FROM schema_fields WHERE schema_id = ?', [id]);
      await run('DELETE FROM schemas WHERE id = ?', [id]);
      await run('COMMIT');
    } catch (error) {
      await run('ROLLBACK');
      throw error;
    }
  } finally {
    invalidateSchema(id);
  }
}
