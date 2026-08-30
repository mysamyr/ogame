import { NoteRecord } from '../types/index.js';

import api from './index.js';

export async function fetchNotes(): Promise<NoteRecord[]> {
  try {
    return await api.get<NoteRecord[]>('/api/notes');
  } catch (error) {
    console.error('Failed to fetch notes:', error);
    return [];
  }
}

export async function saveNote(note: NoteRecord): Promise<NoteRecord> {
  return await api.post('/api/notes', note);
}

export async function copyNote(note: NoteRecord): Promise<NoteRecord> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, ...payload } = note;
  return await api.post('/api/notes', payload);
}

export async function updateNote(
  noteId: string,
  note: NoteRecord
): Promise<void> {
  return await api.put(
    `/api/notes/${encodeURIComponent(String(noteId))}`,
    note
  );
}

export async function deleteNote(noteId: string): Promise<void> {
  return await api.delete(`/api/notes/${encodeURIComponent(String(noteId))}`);
}
