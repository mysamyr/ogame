import { type ComponentType } from 'react';

import type { Note, Schema } from '@ogame/shared/types';
import { SchemaParams, NoteParams } from '@ogame/shared/validation';

import { create } from 'zustand';

// ─── Snackbar ────────────────────────────────────────────────────────────────

interface SnackbarSlice {
  open: boolean;
  message: string;
  showSnackbar: (message: string, duration?: number) => void;
  closeSnackbar: () => void;
}

let snackbarTimeout: ReturnType<typeof setTimeout> | null = null;

export const useSnackbarStore = create<SnackbarSlice>(set => ({
  open: false,
  message: '',
  showSnackbar: (msg, duration = 5000) => {
    if (snackbarTimeout) clearTimeout(snackbarTimeout);
    set({ open: true, message: msg });
    snackbarTimeout = setTimeout(() => set({ open: false }), duration);
  },
  closeSnackbar: () => set({ open: false }),
}));

// ─── Modal ───────────────────────────────────────────────────────────────────

interface ModalSlice {
  open: boolean;
  modal: ModalConfig | null;
  showModal: <T extends Record<string, unknown>>(
    config: ModalConfig<T>
  ) => void;
  requestCloseModal: (reason?: ModalCloseReason) => void;
  closeModal: () => void;
}

export type ModalCloseReason = 'escape' | 'programmatic';

export interface ModalConfig<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  component: ComponentType<T>;
  props?: T;
  onClose?: (reason: ModalCloseReason) => boolean | void;
  closeOnNavigate?: boolean;
}

let modalUnmountTimeout: ReturnType<typeof setTimeout> | null = null;

export const useModalStore = create<ModalSlice>((set, get) => ({
  open: false,
  modal: null,
  showModal: config => {
    if (modalUnmountTimeout) {
      clearTimeout(modalUnmountTimeout);
      modalUnmountTimeout = null;
    }
    set({
      open: true,
      modal: config as ModalConfig,
    });
  },
  requestCloseModal: (reason = 'programmatic') => {
    const activeModal = get().modal;
    if (!activeModal) {
      return;
    }

    const shouldClose = activeModal.onClose?.(reason) !== false;
    if (!shouldClose) {
      return;
    }

    get().closeModal();
  },
  closeModal: () => {
    if (modalUnmountTimeout) {
      clearTimeout(modalUnmountTimeout);
    }
    set({ open: false });
    modalUnmountTimeout = setTimeout(() => {
      set({ modal: null });
      modalUnmountTimeout = null;
    }, 200);
  },
}));

// ─── Schemas ─────────────────────────────────────────────────────────────────

interface SchemasSlice {
  schemas: Schema[];
  setSchemas: (s: Schema[]) => void;
  addSchema: (schema: Schema) => void;
  updateSchema: (schemaId: SchemaParams['id'], schema: Schema) => void;
  removeSchema: (schemaId: SchemaParams['id']) => void;
  getActiveSchema: (id: string) => Schema | null;
}

export const useSchemasStore = create<SchemasSlice>((set, getState) => ({
  schemas: [],
  setSchemas: s => set({ schemas: s }),
  addSchema: schema => set(state => ({ schemas: [...state.schemas, schema] })),
  updateSchema: (schemaId, schema) =>
    set(state => ({
      schemas: state.schemas.map(s => (s.id === schemaId ? schema : s)),
    })),
  removeSchema: schemaId =>
    set(state => ({
      schemas: state.schemas.filter(s => s.id !== schemaId),
    })),
  getActiveSchema: (id: string) =>
    getState().schemas.find(s => s.id === id) || null,
}));

// ─── Notes ───────────────────────────────────────────────────────────────────

interface NotesSlice {
  notes: Note[];
  setNotes: (n: Note[]) => void;
  activeNote: Note | null;
  setActiveNote: (n: Note | null) => void;
  addNote: (note: Note) => void;
  updateNote: (id: NoteParams['id'], note: Note) => void;
  removeNote: (id: NoteParams['id']) => void;
}

export const useNotesStore = create<NotesSlice>(set => ({
  notes: [],
  setNotes: n => set({ notes: n }),
  activeNote: null,
  setActiveNote: n => set({ activeNote: n }),
  addNote: note => set(state => ({ notes: [...state.notes, note] })),
  updateNote: (id, note) =>
    set(state => ({
      notes: state.notes.map(n => (n.id === id ? { ...note, id } : n)),
    })),
  removeNote: id =>
    set(state => ({ notes: state.notes.filter(n => n.id !== id) })),
}));
