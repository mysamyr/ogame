import { useShallow } from 'zustand/react/shallow';

import { useNotesStore } from '../store/index.js';

type NotesState = ReturnType<typeof useNotesStore.getState>;

export function useNotes<T>(selector: (state: NotesState) => T) {
  return useNotesStore(useShallow(selector));
}
