import { useEffect, useMemo, useState } from 'react';

import { useSearchParams } from 'react-router-dom';

import { copyNote, deleteNote } from '../../../api/notes.js';
import { ConfirmModal } from '../../../components/index.js';
import { FieldKind } from '../../../constants/index.js';
import {
  useModal,
  useNotes,
  useSchemas,
  useSnackbar,
} from '../../../hooks/index.js';
import type {
  FilterColumn,
  FilterRule,
  NoteRecord,
} from '../../../types/index.js';
import { toCapital } from '../../../utils/index.js';

import FilterBuilderModal from './modals/FilterBuilderModal.js';
import styles from './NotesBoard.module.css';
import NotesTable from './NotesTable.js';
import NotesToolbar from './NotesToolbar.js';

export default function NotesBoard() {
  const { notes, setActiveNote, addNote, removeNote } = useNotes();
  const { schemas } = useSchemas();
  const { showModal, closeModal } = useModal();
  const { showSnackbar } = useSnackbar();
  const [searchParams] = useSearchParams();
  const [filterRules, setFilterRules] = useState<FilterRule[]>([]);
  const selectedType = searchParams.get('type') ?? '';

  const filterColumns = useMemo<FilterColumn[]>(() => {
    const schema = schemas.find(item => item.id === selectedType);
    return [
      { id: 'planet', label: 'Planet', type: FieldKind.STRING },
      { id: 'date', label: 'Date', type: FieldKind.DATE },
      ...(schema?.fields.map(field => ({
        id: field.name,
        label: toCapital(field.name),
        type: field.type,
      })) ?? []),
    ];
  }, [schemas, selectedType]);

  useEffect(() => {
    setFilterRules([]);
  }, [selectedType]);

  const handleEdit = (note: NoteRecord) => {
    setActiveNote(note);
  };

  const handleCopy = async (note: NoteRecord) => {
    try {
      const newNote = await copyNote(note);
      showSnackbar('Copied');
      addNote(newNote);
    } catch {
      showSnackbar('Copy failed');
    }
  };

  const handleDelete = (noteIdValue: string) => {
    showModal({
      component: ConfirmModal,
      props: {
        title: 'Delete note',
        message: 'Delete note?',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        onCancel: closeModal,
        onConfirm: () => {
          void (async () => {
            closeModal();
            try {
              await deleteNote(noteIdValue);
              removeNote(noteIdValue);
              showSnackbar('Deleted');
            } catch {
              showSnackbar('Delete failed');
            }
          })();
        },
      },
    });
  };

  const handleOpenFilters = () => {
    showModal({
      component: FilterBuilderModal,
      props: {
        columns: filterColumns,
        initialRules: filterRules,
        onApply: setFilterRules,
        onCancel: closeModal,
      },
    });
  };

  const displayedNotes = useMemo(() => {
    const filtered = selectedType
      ? notes.filter(note => note.type === selectedType)
      : notes;

    return [...(filtered ?? [])].sort((a, b) =>
      String(b.date).localeCompare(String(a.date))
    );
  }, [selectedType, notes]);

  return (
    <div id="notes-list">
      <NotesToolbar
        activeFilterCount={filterRules.length}
        onOpenFilters={handleOpenFilters}
      />
      {displayedNotes.length === 0 ? (
        <div className={styles.noteMeta}>No notes yet</div>
      ) : (
        <NotesTable
          notes={displayedNotes}
          selectedType={selectedType}
          filterColumns={filterColumns}
          filterRules={filterRules}
          onCopy={handleCopy}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
