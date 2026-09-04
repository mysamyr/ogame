import { useEffect, useMemo, useState } from 'react';

import type { Note } from '@ogame/shared/types';
import { toCapital } from '@ogame/shared/utils';
import type { SchemaImportPayload } from '@ogame/shared/validation';
import { useSearchParams } from 'react-router-dom';

import { copyNote, deleteNote, fetchNotes } from '../../../api/notes.js';
import {
  exportSchema,
  fetchSchemas,
  importSchema,
} from '../../../api/schemas.js';
import { ConfirmModal } from '../../../components/index.js';
import { ButtonVariant } from '../../../constants/index.js';
import {
  useModal,
  useNotes,
  useSchemas,
  useSnackbar,
} from '../../../hooks/index.js';
import type { FilterColumn, FilterRule } from '../../../types/index.js';

import FilterBuilderModal from './modals/FilterBuilderModal.js';
import ImportSchemaModal from './modals/ImportSchemaModal.js';
import styles from './NotesBoard.module.css';
import NotesTable from './NotesTable.js';
import NotesToolbar from './NotesToolbar.js';

export default function NotesBoard() {
  const { notes, setNotes, setActiveNote, addNote, removeNote } = useNotes();
  const { getActiveSchema, setSchemas } = useSchemas();
  const { showModal, closeModal } = useModal();
  const { showSnackbar } = useSnackbar();
  const [searchParams] = useSearchParams();
  const [filterRules, setFilterRules] = useState<FilterRule[]>([]);

  const selectedType = searchParams.get('type') ?? '';
  const activeSchema = getActiveSchema(selectedType);

  const filterColumns = useMemo<FilterColumn[]>(() => {
    return (
      activeSchema?.fields.map(field => ({
        id: field.id,
        label: toCapital(field.name),
        type: field.type,
      })) ?? []
    );
  }, [activeSchema]);

  useEffect(() => {
    setFilterRules([]);
  }, [selectedType]);

  const handleEdit = (note: Note) => {
    setActiveNote(note);
  };

  const handleCopy = async (note: Note) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...payload } = note;
      const newNote = await copyNote(payload);
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
        confirmVariant: ButtonVariant.DANGER,
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

  const handleOpenImport = () => {
    showModal({
      component: ImportSchemaModal,
      props: {
        onCancel: closeModal,
        onError: (message: string) => {
          closeModal();
          showSnackbar(message);
        },
        onImport: (payload: SchemaImportPayload) => {
          void (async () => {
            try {
              await importSchema(payload);
              const [refreshedNotes, refreshedSchemas] = await Promise.all([
                fetchNotes(),
                fetchSchemas(),
              ]);
              setNotes(refreshedNotes);
              setSchemas(refreshedSchemas);
              closeModal();
              showSnackbar('Schema imported');
            } catch (error) {
              closeModal();
              showSnackbar(
                error instanceof Error ? error.message : 'Import failed'
              );
            }
          })();
        },
      },
    });
  };

  const handleOpenExport = () => {
    showModal({
      component: ConfirmModal,
      props: {
        title: 'Export schema',
        message: "Do you want to export schema with all it's notes?",
        confirmText: 'Export',
        onCancel: closeModal,
        onConfirm: () => {
          void (async () => {
            closeModal();
            if (!activeSchema) {
              return;
            }

            try {
              const data = await exportSchema(activeSchema.id);
              const blob = new Blob([JSON.stringify(data, null, 2)], {
                type: 'application/json',
              });
              const url = URL.createObjectURL(blob);
              const anchor = document.createElement('a');

              anchor.href = url;
              anchor.download = `${activeSchema.id}-export.json`;
              document.body.append(anchor);
              anchor.click();
              anchor.remove();
              URL.revokeObjectURL(url);
              showSnackbar('Exported');
            } catch {
              showSnackbar('Export failed');
            }
          })();
        },
      },
    });
  };

  const displayedNotes = useMemo(() => {
    const filtered = selectedType
      ? notes.filter(note => note.schema === selectedType)
      : notes;

    return filtered ?? [];
  }, [selectedType, notes]);

  return (
    <>
      <div className={styles.header}>
        <h2>Notes</h2>
        <NotesToolbar
          activeFilterCount={filterRules.length}
          onExport={activeSchema ? handleOpenExport : undefined}
          onImport={handleOpenImport}
          onOpenFilters={activeSchema ? handleOpenFilters : undefined}
        />
      </div>
      {activeSchema ? (
        displayedNotes.length === 0 ? (
          <div className={styles.noteMeta}>No notes</div>
        ) : (
          <NotesTable
            key={`${selectedType}-${activeSchema.sort ?? ''}-${activeSchema.direction ?? ''}`}
            notes={displayedNotes}
            selectedType={selectedType}
            filterColumns={filterColumns}
            filterRules={filterRules}
            onCopy={handleCopy}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )
      ) : (
        <p className={styles.placeholder}>No schema available</p>
      )}
    </>
  );
}
