import { Note, NotesPage } from '@ogame/shared/types';
import {
  GetNotesQuery,
  NoteParams,
  NotePayload,
} from '@ogame/shared/validation';

import api from './index.js';

export async function fetchNotes(
  schemaId: string,
  query?: GetNotesQuery
): Promise<NotesPage> {
  const params = new URLSearchParams();
  if (query?.limit != null) {
    params.set('limit', String(query.limit));
  }
  if (query?.offset != null) {
    params.set('offset', String(query.offset));
  }
  if (query?.sort) {
    params.set('sort', query.sort);
  }
  if (query?.direction) {
    params.set('direction', query.direction);
  }
  if (query?.filters && query.filters.length > 0) {
    params.set('filters', JSON.stringify(query.filters));
  }
  const search = params.toString();
  return await api.get<NotesPage>(
    `/api/note/${encodeURIComponent(schemaId)}${search ? `?${search}` : ''}`
  );
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
): Promise<Note> {
  return await api.put(`/api/note/${encodeURIComponent(String(noteId))}`, note);
}

export async function deleteNotes(noteIds: NoteParams['id'][]): Promise<void> {
  const ids = noteIds.map(id => String(id)).join(',');
  return await api.delete(`/api/note?ids=${encodeURIComponent(ids)}`);
}
