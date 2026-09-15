import type { Note } from '@ogame/shared/types';
import type { NoteParams } from '@ogame/shared/validation';

import { create } from 'zustand';

interface NotesSlice {
  notes: Note[];
  setNotes: (n: Note[]) => void;
  appendNotes: (notes: Note[]) => void;
  activeNote: Note | null;
  setActiveNote: (n: Note | null) => void;
  addNote: (note: Note) => void;
  updateNote: (id: NoteParams['id'], note: Note) => void;
  removeNote: (id: NoteParams['id']) => void;
  removeNotes: (ids: NoteParams['id'][]) => void;
}

export const useNotesStore = create<NotesSlice>((set, get) => ({
  notes: [],
  setNotes: n => set({ notes: n }),
  appendNotes: notes =>
    set(state => {
      const existingIds = new Set(state.notes.map(note => note.id));
      const unique = notes.filter(note => !existingIds.has(note.id));
      if (unique.length === 0) {
        return state;
      }
      return { notes: [...state.notes, ...unique] };
    }),
  activeNote: null,
  setActiveNote: n => set({ activeNote: n }),
  addNote: note => set(state => ({ notes: [...state.notes, note] })),
  updateNote: (id, note) =>
    set(state => ({
      notes: state.notes.map(n => (n.id === id ? { ...note, id } : n)),
    })),
  removeNotes: ids =>
    set(state => {
      const idSet = new Set(ids.map(id => String(id)));
      const notes = state.notes.filter(n => !idSet.has(n.id));
      const activeNote =
        state.activeNote && idSet.has(state.activeNote.id)
          ? null
          : state.activeNote;
      return { notes, activeNote };
    }),
  removeNote: id => get().removeNotes([id]),
}));
