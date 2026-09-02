import { get, list, run } from '../services/db.js';
import { GetNotesQuery, Note, NoteRecord } from '../types/index.js';
import { uuid } from '../utils/uuid.js';

export async function getNotes(
  schemaId?: string,
  config?: GetNotesQuery
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
    if (config.offset) {
      paginationClause += ' OFFSET ?';
      params.push(String(config.offset));
    }
  }

  const rows = await list<NoteRecord>(
    `SELECT id, schema, payload FROM notes${whereClause} ${paginationClause}`,
    params
  );
  return rows.map(row => ({
    id: row.id,
    schema: row.schema,
    ...(JSON.parse(row.payload) as Record<string, unknown>),
  }));
}

export async function addNote(
  note: Omit<Note, 'id'> & { id?: string }
): Promise<Note> {
  const id = note.id ?? uuid();
  const { schema, ...payload } = note;
  const toStore = { ...(note as Omit<Note, 'id'>), id } as Note;

  await run('INSERT INTO notes (id, schema, payload) VALUES (?, ?, ?)', [
    id,
    schema,
    JSON.stringify(payload),
  ]);

  return toStore;
}

export async function updateNote(
  id: string,
  update: Omit<Note, 'id'>
): Promise<boolean> {
  const existing = await get<{ id: string }>(
    'SELECT id FROM notes WHERE id = ?',
    [id]
  );
  if (!existing) return false;

  const { schema, ...payload } = update;

  await run('UPDATE notes SET schema = ?, payload = ? WHERE id = ?', [
    schema,
    JSON.stringify(payload),
    id,
  ]);
  return true;
}

export async function upsertNote(note: Note): Promise<void> {
  const { id, schema, ...payload } = note;

  await run(
    'INSERT INTO notes (id, schema, payload) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET schema = excluded.schema, payload = excluded.payload',
    [id, schema, JSON.stringify(payload)]
  );
}

export async function deleteNote(id: string): Promise<boolean> {
  const existing = await get<{ id: string }>(
    'SELECT id FROM notes WHERE id = ?',
    [id]
  );
  if (!existing) return false;
  await run('DELETE FROM notes WHERE id = ?', [id]);
  return true;
}
