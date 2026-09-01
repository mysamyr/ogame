import { get, list, run } from '../services/db.js';
import type { Note } from '../types/index.js';
import { uuid } from '../utils/uuid.js';

export async function getAllNotes(): Promise<Note[]> {
  const rows = await list<{
    id: string;
    planet: string;
    date: string;
    schema: string;
    payload: string;
  }>(
    'SELECT id, planet, date, schema, payload FROM notes ORDER BY date DESC, id DESC'
  );
  return rows.map(row => ({
    id: row.id,
    planet: row.planet,
    date: row.date,
    schema: row.schema,
    ...(JSON.parse(row.payload) as Record<string, unknown>),
  }));
}

export async function addNote(
  note: Omit<Note, 'id'> & { id?: string }
): Promise<Note> {
  const id = note.id ?? uuid();
  const { planet, date, schema, ...payload } = note;
  const toStore = { ...(note as Omit<Note, 'id'>), id } as Note;

  await run(
    'INSERT INTO notes (id, planet, date, schema, payload) VALUES (?, ?, ?, ?, ?)',
    [id, planet, date, schema, JSON.stringify(payload)]
  );

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

  const { planet, date, schema, ...payload } = update;

  await run(
    'UPDATE notes SET planet = ?, date = ?, schema = ?, payload = ? WHERE id = ?',
    [planet, date, schema, JSON.stringify(payload), id]
  );
  return true;
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
