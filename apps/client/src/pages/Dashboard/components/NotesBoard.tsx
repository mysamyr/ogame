import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  FieldKind,
  ISO_DATE_PATTERN,
  ISO_TIME_PATTERN,
  SortDirection,
} from '@ogame/shared/constants';
import type { Note, SchemaField } from '@ogame/shared/types';
import { toCapital } from '@ogame/shared/utils';
import type { FilterRule, SchemaImportPayload } from '@ogame/shared/validation';
import {
  createColumnHelper,
  createCoreRowModel,
  flexRender,
  tableFeatures,
  useTable,
} from '@tanstack/react-table';
import { useSearchParams } from 'react-router-dom';

import { copyNote, deleteNote, fetchNotes } from '../../../api/notes.js';
import {
  exportSchema,
  fetchSchemas,
  importSchema,
} from '../../../api/schemas.js';
import {
  CopyIcon,
  DeleteIcon,
  EditIcon,
  WarningIcon,
} from '../../../components/icons/index.js';
import { Button, Checkbox, ConfirmModal } from '../../../components/index.js';
import { ButtonVariant, NOTES_PAGE_SIZE } from '../../../constants/index.js';
import {
  useModal,
  useNotes,
  useSchemas,
  useSnackbar,
} from '../../../hooks/index.js';
import type { FilterColumn } from '../../../types/index.js';
import {
  formatNumber,
  formatUnknownValue,
  parseBooleanValue,
  validateRecordAgainstSchema,
} from '../../../utils/index.js';

import FilterBuilderModal from './modals/FilterBuilderModal.js';
import ImportSchemaModal from './modals/ImportSchemaModal.js';
import styles from './NotesBoard.module.css';
import NotesToolbar from './NotesToolbar.js';

type NotesSortState = {
  sort: string;
  direction: SortDirection;
} | null;

const features = tableFeatures({
  coreRowModel: createCoreRowModel(),
});
const columnHelper = createColumnHelper<typeof features, Note>();

const SORT_INDICATOR: Record<string, string> = {
  asc: ' ↑',
  desc: ' ↓',
};

function sortQuery(sortState: NotesSortState) {
  if (!sortState) {
    return {};
  }
  return { sort: sortState.sort, direction: sortState.direction };
}

function RowStatusCell({
  note,
  fields,
}: {
  note: Note;
  fields: SchemaField[];
}) {
  const validation = validateRecordAgainstSchema(note, fields);
  if (validation.isValid) {
    return null;
  }

  const tooltip = Object.values(validation.errors).join('\n');

  return (
    <button
      type="button"
      className={styles.rowWarning}
      title={tooltip}
      aria-label={tooltip}
    >
      <WarningIcon className={styles.rowWarningIcon} />
      <span className={styles.tooltip} role="tooltip">
        {tooltip}
      </span>
    </button>
  );
}

function WarningValueCell({
  displayValue,
  tooltip,
}: {
  displayValue: string;
  tooltip: string;
}) {
  return (
    <span className={styles.warningPill} title={tooltip} tabIndex={0}>
      <WarningIcon className={styles.warningPillIcon} />
      <span className={styles.warningPillValue}>{displayValue}</span>
      <span className={styles.tooltip} role="tooltip">
        {tooltip}
      </span>
    </span>
  );
}

function BooleanCell({ value }: { value: unknown }) {
  const parsed = parseBooleanValue(value);
  if (parsed.ok) {
    return (
      <span className={styles.cellBoolean}>
        <Checkbox disabled checked={parsed.value} />
      </span>
    );
  }

  const displayValue =
    typeof value === 'string'
      ? JSON.stringify(value)
      : formatUnknownValue(value);
  const tooltip = `Value '${formatUnknownValue(value)}' is not a valid boolean`;

  return <WarningValueCell displayValue={displayValue} tooltip={tooltip} />;
}

function NumberCell({ value }: { value: unknown }) {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim() !== ''
        ? Number(value)
        : Number.NaN;
  if (Number.isFinite(parsed)) {
    return formatNumber(parsed);
  }

  if (value === null || value === undefined || value === '') {
    return '';
  }

  const displayValue =
    typeof value === 'string'
      ? JSON.stringify(value)
      : formatUnknownValue(value);

  return (
    <WarningValueCell
      displayValue={displayValue}
      tooltip={`Value '${formatUnknownValue(value)}' is not a valid number`}
    />
  );
}

function DateTimeCell({
  value,
  kind,
}: {
  value: unknown;
  kind: FieldKind.DATE | FieldKind.TIME;
}) {
  if (typeof value !== 'string') {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    return (
      <WarningValueCell
        displayValue={formatUnknownValue(value)}
        tooltip={`Value '${formatUnknownValue(value)}' is not a valid ${kind.toLowerCase()}`}
      />
    );
  }

  const trimmed = value.trim();
  if (trimmed === '') {
    return '';
  }

  const isValid =
    kind === FieldKind.DATE
      ? ISO_DATE_PATTERN.test(trimmed) &&
        !Number.isNaN(new Date(trimmed).getTime())
      : ISO_TIME_PATTERN.test(trimmed) &&
        (() => {
          const [hoursStr, minutesStr] = trimmed.split(':');
          const hours = Number(hoursStr);
          const minutes = Number(minutesStr);
          return (
            Number.isInteger(hours) &&
            Number.isInteger(minutes) &&
            hours >= 0 &&
            hours <= 23 &&
            minutes >= 0 &&
            minutes <= 59
          );
        })();

  if (isValid) {
    return value;
  }

  return (
    <WarningValueCell
      displayValue={JSON.stringify(value)}
      tooltip={`Value '${value}' is not a valid ${kind === FieldKind.DATE ? 'date in YYYY-MM-DD format' : 'time in HH:mm format'}`}
    />
  );
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

  const filterColumns = useMemo<FilterColumn[]>(
    () =>
      activeSchema?.fields.map(field => ({
        id: field.id,
        label: toCapital(field.name),
        type: field.type,
      })) ?? [],
    [activeSchema]
  );

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

  const handleSortChange = (
    sort: string | null,
    direction: SortDirection | null
  ) => {
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

  const handleHeaderClick = (columnId: string, canSort: boolean) => {
    if (!canSort) {
      return;
    }
    if (notesSort?.sort !== columnId) {
      handleSortChange(columnId, SortDirection.ASC);
      return;
    }
    if (notesSort?.direction === SortDirection.ASC) {
      handleSortChange(columnId, SortDirection.DESC);
      return;
    }
    handleSortChange(null, null);
  };

  const displayedNotes = useMemo(() => {
    const filtered = selectedType
      ? notes.filter(note => note.schema === selectedType)
      : notes;

    return filtered ?? [];
  }, [selectedType, notes]);

  const schema = useMemo(() => activeSchema ?? null, [activeSchema]);

  const columns = useMemo(() => {
    const fields: SchemaField[] = schema?.fields ?? [];

    const statusColumn = columnHelper.display({
      id: 'rowStatus',
      header: '',
      cell: ({ row }) => <RowStatusCell note={row.original} fields={fields} />,
    });

    const dynamicColumns = fields.map(field => {
      return columnHelper.accessor(row => row[field.id], {
        id: field.id,
        header: toCapital(field.name),
        cell: ({ getValue }) => {
          const value = getValue();
          if (field.type === FieldKind.BOOLEAN) {
            return <BooleanCell value={value} />;
          }
          if (field.type === FieldKind.NUMBER) {
            return <NumberCell value={value} />;
          }
          if (field.type === FieldKind.DATE || field.type === FieldKind.TIME) {
            return <DateTimeCell value={value} kind={field.type} />;
          }
          const primitive =
            typeof value === 'string' ||
            typeof value === 'number' ||
            typeof value === 'boolean'
              ? value
              : null;
          return primitive !== null ? String(primitive) : '';
        },
      });
    });

    return [
      statusColumn,
      ...dynamicColumns,
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const note = row.original;
          return (
            <div className={styles.noteActions}>
              <button
                type="button"
                className={styles.copy}
                data-action="copy"
                onClick={() => void handleCopy(note)}
                aria-label="Copy note"
              >
                <CopyIcon className={styles.actionIcon} />
              </button>
              <button
                type="button"
                data-action="edit"
                onClick={() => handleEdit(note)}
                aria-label="Edit note"
              >
                <EditIcon className={styles.actionIcon} />
              </button>
              <button
                type="button"
                className={styles.del}
                onClick={() => void handleDelete(note.id)}
                aria-label="Delete note"
              >
                <DeleteIcon className={styles.actionIcon} />
              </button>
            </div>
          );
        },
      }),
    ];
  }, [activeSchema, handleCopy, handleDelete, handleEdit, selectedType]);

  const table = useTable({
    features,
    columns,
    data: displayedNotes,
  });

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
          <div className={styles.tableContainer}>
            <table className={styles.notesTable}>
              <thead>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => {
                      const canSort =
                        header.id !== 'actions' && header.id !== 'rowStatus';
                      const sorted =
                        notesSort?.sort === header.id && notesSort.direction
                          ? notesSort.direction
                          : false;
                      return (
                        <th
                          key={header.id}
                          className={
                            header.id === 'actions'
                              ? styles.noteActions
                              : header.id === 'rowStatus'
                                ? styles.rowStatus
                                : ''
                          }
                          style={
                            canSort
                              ? { cursor: 'pointer', userSelect: 'none' }
                              : undefined
                          }
                          onClick={() => handleHeaderClick(header.id, canSort)}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {sorted !== false ? SORT_INDICATOR[sorted] : ''}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id}>
                    {row.getAllCells().map(cell => (
                      <td
                        key={cell.id}
                        className={
                          cell.column.id === 'rowStatus' ? styles.rowStatus : ''
                        }
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {hasMore ? (
              <div className={styles.loadMore}>
                <Button
                  variant={ButtonVariant.SECONDARY}
                  onClick={() => void handleLoadMore()}
                  disabled={isLoading}
                >
                  {isLoading ? 'Loading…' : 'Load more'}
                </Button>
              </div>
            ) : null}
          </div>
        )
      ) : (
        <p className={styles.placeholder}>No schema available</p>
      )}
    </>
  );
}
