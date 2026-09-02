import { Note } from '@ogame/shared/types';
import { NoteParams, NotePayload } from '@ogame/shared/validation';

import api from './index.js';

export async function fetchNotes(): Promise<Note[]> {
  return await api.get<Note[]>('/api/note');
}

export async function saveNote(note: NotePayload): Promise<Note> {
  return await api.post('/api/note', note);
}

export async function copyNote(note: NotePayload): Promise<Note> {
  return await api.post('/api/note', note);
}

export async function updateNote(
  noteId: NoteParams['id'],
  note: NotePayload
): Promise<void> {
  return await api.put(`/api/note/${encodeURIComponent(String(noteId))}`, note);
}

export async function deleteNote(noteId: NoteParams['id']): Promise<void> {
  return await api.delete(`/api/note/${encodeURIComponent(String(noteId))}`);
}
