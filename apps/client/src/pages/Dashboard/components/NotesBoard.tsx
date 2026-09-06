import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { SortDirection } from '@ogame/shared/constants';
import type { Note } from '@ogame/shared/types';
import { toCapital } from '@ogame/shared/utils';
import type {
  FilterRule,
  SchemaImportPayload,
} from '@ogame/shared/validation';
import { useSearchParams } from 'react-router-dom';

import { copyNote, deleteNote, fetchNotes } from '../../../api/notes.js';
import {
  exportSchema,
  fetchSchemas,
  importSchema,
} from '../../../api/schemas.js';
import { ConfirmModal } from '../../../components/index.js';
import { ButtonVariant, NOTES_PAGE_SIZE } from '../../../constants/index.js';
import {
  useModal,
  useNotes,
  useSchemas,
  useSnackbar,
} from '../../../hooks/index.js';
import type { FilterColumn } from '../../../types/index.js';

import FilterBuilderModal from './modals/FilterBuilderModal.js';
import ImportSchemaModal from './modals/ImportSchemaModal.js';
import styles from './NotesBoard.module.css';
import NotesTable from './NotesTable.js';
import NotesToolbar from './NotesToolbar.js';

type NotesSortState = {
  sort: string;
  direction: SortDirection;
} | null;

function sortQuery(sortState: NotesSortState) {
  if (!sortState) {
    return {};
  }
  return { sort: sortState.sort, direction: sortState.direction };
}

export default function NotesBoard() {
  const { notes, setNotes, appendNotes, setActiveNote, addNote, removeNote } =
    useNotes();
  const { getActiveSchema, setSchemas } = useSchemas();
  const { showModal, closeModal } = useModal();
  const { showSnackbar } = useSnackbar();
  const [searchParams] = useSearchParams();
  const [filterRules, setFilterRules] = useState<FilterRule[]>([]);
  const [notesSort, setNotesSort] = useState<NotesSortState>(null);
  const [nextOffset, setNextOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const loadRequestIdRef = useRef(0);

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

  const loadFirstPage = useCallback(
    async (
      schemaId: string,
      sortState: NotesSortState,
      filters: FilterRule[]
    ) => {
      const requestId = ++loadRequestIdRef.current;
      setIsLoading(true);
      try {
        const page = await fetchNotes(schemaId, {
          limit: NOTES_PAGE_SIZE,
          offset: 0,
          ...sortQuery(sortState),
          ...(filters.length > 0 ? { filters } : {}),
        });
        if (requestId !== loadRequestIdRef.current) {
          return;
        }
        setNotes(page);
        setNextOffset(NOTES_PAGE_SIZE);
        setHasMore(page.length === NOTES_PAGE_SIZE);
      } catch {
        if (requestId !== loadRequestIdRef.current) {
          return;
        }
        setNotes([]);
        setNextOffset(0);
        setHasMore(false);
        showSnackbar('Failed to fetch notes');
      } finally {
        if (requestId === loadRequestIdRef.current) {
          setIsLoading(false);
        }
      }
    },
    [setNotes, showSnackbar]
  );

  useEffect(() => {
    setFilterRules([]);
    setNotes([]);
    setNextOffset(0);
    setHasMore(false);
    if (!selectedType) {
      setNotesSort(null);
      return;
    }
    const nextSort =
      activeSchema?.sort && activeSchema.direction
        ? { sort: activeSchema.sort, direction: activeSchema.direction }
        : null;
    setNotesSort(nextSort);
    void loadFirstPage(selectedType, nextSort, []);
  }, [
    selectedType,
    activeSchema?.sort,
    activeSchema?.direction,
    loadFirstPage,
    setNotes,
  ]);

  const handleLoadMore = async () => {
    if (!selectedType || isLoading || !hasMore) {
      return;
    }

    const requestId = ++loadRequestIdRef.current;
    const offset = nextOffset;
    setIsLoading(true);
    try {
      const page = await fetchNotes(selectedType, {
        limit: NOTES_PAGE_SIZE,
        offset,
        ...sortQuery(notesSort),
        ...(filterRules.length > 0 ? { filters: filterRules } : {}),
      });
      if (requestId !== loadRequestIdRef.current) {
        return;
      }
      appendNotes(page);
      setNextOffset(offset + NOTES_PAGE_SIZE);
      setHasMore(page.length === NOTES_PAGE_SIZE);
    } catch {
      if (requestId !== loadRequestIdRef.current) {
        return;
      }
      showSnackbar('Failed to load more notes');
    } finally {
      if (requestId === loadRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleSortChange = (sort: string | null, direction: SortDirection | null) => {
    if (!selectedType) {
      return;
    }
    const nextSort = sort && direction ? { sort, direction } : null;
    setNotesSort(nextSort);
    void loadFirstPage(selectedType, nextSort, filterRules);
  };

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
        onApply: (rules: FilterRule[]) => {
          setFilterRules(rules);
          if (selectedType) {
            void loadFirstPage(selectedType, notesSort, rules);
          }
        },
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
              const refreshedSchemas = await fetchSchemas();
              setSchemas(refreshedSchemas);
              if (selectedType) {
                await loadFirstPage(selectedType, notesSort, filterRules);
              }
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
        displayedNotes.length === 0 && !hasMore ? (
          <div className={styles.noteMeta}>
            {isLoading ? 'Loading notes…' : 'No notes'}
          </div>
        ) : (
          <NotesTable
            key={selectedType}
            notes={displayedNotes}
            selectedType={selectedType}
            sort={notesSort?.sort ?? null}
            direction={notesSort?.direction ?? null}
            hasMore={hasMore}
            isLoadingMore={isLoading}
            onLoadMore={handleLoadMore}
            onSortChange={handleSortChange}
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
