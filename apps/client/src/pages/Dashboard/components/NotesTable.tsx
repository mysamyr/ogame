import { useMemo } from 'react';

import { FieldKind } from '@ogame/shared/constants';
import { Note, SchemaField } from '@ogame/shared/types';
import { toCapital } from '@ogame/shared/utils';

import {
  createColumnHelper,
  createCoreRowModel,
  createFilteredRowModel,
  createSortedRowModel,
  columnFilteringFeature,
  flexRender,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_text,
  tableFeatures,
  useTable,
} from '@tanstack/react-table';

import {
  CopyIcon,
  DeleteIcon,
  EditIcon,
} from '../../../components/icons/index.js';
import { Checkbox } from '../../../components/index.js';
import { useSchemas } from '../../../hooks/index.js';
import type { FilterColumn, FilterRule } from '../../../types/index.js';
import { formatNumber, matchesFilterRules } from '../../../utils/index.js';

import styles from './NotesTable.module.css';

type Props = {
  notes: Note[];
  selectedType: string;
  filterColumns: FilterColumn[];
  filterRules: FilterRule[];
  onCopy: (note: Note) => Promise<void>;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void | Promise<void>;
};

const features = tableFeatures({
  coreRowModel: createCoreRowModel(),
  columnFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    text: sortFn_text,
  },
});
const columnHelper = createColumnHelper<typeof features, Note>();

const SORT_INDICATOR: Record<string, string> = {
  asc: ' ↑',
  desc: ' ↓',
};

export default function NotesTable({
  notes,
  selectedType,
  filterColumns,
  filterRules,
  onCopy,
  onEdit,
  onDelete,
}: Props) {
  const { schemas } = useSchemas();

  const schema = useMemo(
    () => schemas.find(item => item.id === selectedType) ?? null,
    [schemas, selectedType]
  );

  const data = useMemo(
    () =>
      (notes ?? []).filter(note =>
        matchesFilterRules(note, filterRules, filterColumns)
      ),
    [notes, filterRules, filterColumns]
  );

  const columns = useMemo(() => {
    const fields: SchemaField[] = schema?.fields ?? [];

    const dynamicColumns = fields.map(field =>
      columnHelper.accessor(row => row[field.id], {
        id: field.id,
        header: toCapital(field.name),
        cell: ({ getValue }) => {
          const value = getValue();
          if (field.type === FieldKind.BOOLEAN) {
            return (
              <span className={styles.cellBoolean}>
                <Checkbox disabled checked={Boolean(value)} />
              </span>
            );
          }
          if (field.type === FieldKind.NUMBER) {
            return value !== undefined ? formatNumber(Number(value)) : '';
          }
          const primitive =
            typeof value === 'string' ||
            typeof value === 'number' ||
            typeof value === 'boolean'
              ? value
              : null;
          return primitive !== null ? String(primitive) : '';
        },
      })
    );

    return [
      ...dynamicColumns,
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        cell: ({ row }) => {
          const note = row.original;
          return (
            <div className={styles.noteActions}>
              <button
                type="button"
                className={styles.copy}
                data-action="copy"
                onClick={() => void onCopy(note)}
                aria-label="Copy note"
              >
                <CopyIcon className={styles.actionIcon} />
              </button>
              <button
                type="button"
                data-action="edit"
                onClick={() => onEdit(note)}
                aria-label="Edit note"
              >
                <EditIcon className={styles.actionIcon} />
              </button>
              <button
                type="button"
                className={styles.del}
                onClick={() => void onDelete(note.id)}
                aria-label="Delete note"
              >
                <DeleteIcon className={styles.actionIcon} />
              </button>
            </div>
          );
        },
      }),
    ];
  }, [schema, onCopy, onEdit, onDelete]);

  const table = useTable(
    {
      features,
      columns,
      data,
    },
    state => state.sorting
  );

  return (
    <div className={styles.tableContainer}>
      <table className={styles.notesTable}>
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => {
                const canSort = header.column.getCanSort();
                const sorted = header.column.getIsSorted();
                return (
                  <th
                    key={header.id}
                    className={
                      header.id === 'actions' ? styles.noteActions : ''
                    }
                    style={
                      canSort
                        ? { cursor: 'pointer', userSelect: 'none' }
                        : undefined
                    }
                    onClick={
                      canSort
                        ? header.column.getToggleSortingHandler()
                        : undefined
                    }
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
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
