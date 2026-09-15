import { useShallow } from 'zustand/react/shallow';

import { useNotesStore } from '../store/index.js';

export function useNotes() {
  return useNotesStore(
    useShallow(s => ({
      notes: s.notes,
      setNotes: s.setNotes,
      appendNotes: s.appendNotes,
      activeNote: s.activeNote,
      setActiveNote: s.setActiveNote,
      addNote: s.addNote,
      updateNote: s.updateNote,
      removeNote: s.removeNote,
      removeNotes: s.removeNotes,
    }))
  );
}
