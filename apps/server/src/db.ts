import fs from 'fs/promises';
import path from 'path';

export type StoredNote = {
  id: string;
  planet: string;
  date: string;
  type: string;
  // additional dynamic fields
  [key: string]: unknown;
};

const STORE_PATH = path.join(import.meta.dirname, '..', 'store.json');
const TMP_PATH = path.join(import.meta.dirname, '..', 'store.json.tmp');

/**
 * Safe read: if file missing, return empty array.
 */
export async function readStore(): Promise<StoredNote[]> {
  try {
    const raw = await fs.readFile(STORE_PATH, { encoding: 'utf-8' });
    const parsed = JSON.parse(raw) as StoredNote[];
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (err) {
    if ((err as { code?: string }).code === 'ENOENT') {
      return [];
    }
    throw err;
  }
}

/**
 * Safe write: write to tmp file then rename (atomic-ish).
 */
export async function writeStore(notes: StoredNote[]): Promise<void> {
  const data = JSON.stringify(notes, null, 2);
  await fs.writeFile(TMP_PATH, data, { encoding: 'utf-8' });
  await fs.rename(TMP_PATH, STORE_PATH);
}

/**
 * Ensure store.json exists. Create with empty array only when missing.
 */
export async function ensureStoreExists(): Promise<void> {
  try {
    await fs.access(STORE_PATH);
    // file exists, nothing to do
  } catch (err) {
    if ((err as { code?: string }).code === 'ENOENT') {
      const data = JSON.stringify([], null, 2) + '\n';
      // Use exclusive flag to avoid race overwrites if created concurrently
      await fs.writeFile(STORE_PATH, data, { encoding: 'utf-8', flag: 'wx' });
    } else {
      throw err;
    }
  }
}

/**
 * CRUD helpers
 */
export async function getAllNotes(): Promise<StoredNote[]> {
  return await readStore();
}

export async function addNote(
  note: Omit<StoredNote, 'id'> & { id?: string }
): Promise<StoredNote> {
  const notes = await readStore();
  const id = note.id ?? `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const toStore = { ...(note as Omit<StoredNote, 'id'>), id } as StoredNote;
  notes.push(toStore);
  await writeStore(notes);
  return toStore;
}

export async function updateNote(
  id: string,
  update: Omit<StoredNote, 'id'>
): Promise<StoredNote | null> {
  const notes = await readStore();
  const idx = notes.findIndex(n => String(n.id) === String(id));
  if (idx === -1) return null;
  const existing = notes[idx];
  if (!existing) return null;
  const typedUpdate = update as {
    planet: string;
    date: string;
    type: string;
  } & { [key: string]: unknown };
  const merged = Object.assign({}, typedUpdate, {
    id: existing.id,
  });
  notes[idx] = merged;
  await writeStore(notes);
  return merged;
}

export async function deleteNote(id: string): Promise<boolean> {
  const notes = await readStore();
  const idx = notes.findIndex(n => String(n.id) === String(id));
  if (idx === -1) return false;
  notes.splice(idx, 1);
  await writeStore(notes);
  return true;
}
