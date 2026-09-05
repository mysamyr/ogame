import { FieldKind, SortDirection } from '@ogame/shared/constants';
import type { Note } from '@ogame/shared/types';
import type { GetNotesQuery, NotePayload } from '@ogame/shared/validation';

import { get, list, run } from '../services/db.js';

type NoteRecord = {
  id: string;
  schema: string;
  /**
   * JSON string representing the note's fields
   */
  payload: string;
};

type GetNotesConfig = GetNotesQuery & {
  sortKind?: FieldKind;
};

function jsonExtract(fieldId: string): string {
  const escaped = fieldId.replaceAll("'", "''");
  return `json_extract(payload, '$."${escaped}"')`;
}

function jsonType(fieldId: string): string {
  const escaped = fieldId.replaceAll("'", "''");
  return `json_type(payload, '$."${escaped}"')`;
}

function sortExpression(fieldId: string, kind: FieldKind): string {
  const extract = jsonExtract(fieldId);
  if (kind === FieldKind.NUMBER) {
    return `CAST(${extract} AS REAL)`;
  }
  if (kind === FieldKind.BOOLEAN) {
    const typeExpr = jsonType(fieldId);
    return `CASE
      WHEN ${typeExpr} IN ('true', 'false') THEN ${extract}
      WHEN lower(CAST(${extract} AS TEXT)) IN ('true', '1') THEN 1
      WHEN lower(CAST(${extract} AS TEXT)) IN ('false', '0') THEN 0
      ELSE NULL
    END`;
  }
  return `CAST(${extract} AS TEXT) COLLATE NOCASE`;
}

function orderByClause(config?: GetNotesConfig): string {
  if (!config?.sort || !config.direction || !config.sortKind) {
    return ' ORDER BY id';
  }
  const expr = sortExpression(config.sort, config.sortKind);
  const direction = config.direction === SortDirection.DESC ? 'DESC' : 'ASC';
  return ` ORDER BY (${expr}) IS NULL, ${expr} ${direction}, id ASC`;
}

export async function getNotes(
  schemaId?: string,
  config?: GetNotesConfig
): Promise<Note[]> {
  const where: string[] = [];
  const params: string[] = [];

  if (schemaId) {
    where.push('schema = ?');
    params.push(schemaId);
  }

  const whereClause = where.length > 0 ? ` WHERE ${where.join(' AND ')}` : '';
  let paginationClause = '';
  if (config?.limit) {
    paginationClause = ' LIMIT ?';
    params.push(String(config.limit));
    if (config.offset != null) {
      paginationClause += ' OFFSET ?';
      params.push(String(config.offset));
    }
  }

  const rows = await list<NoteRecord>(
    `SELECT id, schema, payload FROM notes${whereClause}${orderByClause(config)}${paginationClause}`,
    params
  );
  return rows.map(row => ({
    id: row.id,
    schema: row.schema,
    ...(JSON.parse(row.payload) as Record<string, unknown>),
  }));
}

export async function getNoteById(id: string): Promise<Note | null> {
  const row = await get<NoteRecord>(
    'SELECT id, schema, payload FROM notes WHERE id = ?',
    [id]
  );
  if (!row) return null;

  return {
    id: row.id,
    schema: row.schema,
    ...(JSON.parse(row.payload) as Record<string, unknown>),
  };
}

export async function addNote(note: Note): Promise<void> {
  const { id, schema, ...payload } = note;
  await run('INSERT INTO notes (id, schema, payload) VALUES (?, ?, ?)', [
    id,
    schema,
    JSON.stringify(payload),
  ]);
}

export async function updateNote(
  id: string,
  update: NotePayload
): Promise<void> {
  const { schema, ...payload } = update;

  await run('UPDATE notes SET schema = ?, payload = ? WHERE id = ?', [
    schema,
    JSON.stringify(payload),
    id,
  ]);
}

export async function upsertNote(note: Note): Promise<void> {
  const { id, schema, ...payload } = note;

  await run(
    'INSERT INTO notes (id, schema, payload) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET schema = excluded.schema, payload = excluded.payload',
    [id, schema, JSON.stringify(payload)]
  );
}

export async function deleteNote(id: string): Promise<void> {
  await run('DELETE FROM notes WHERE id = ?', [id]);
}
