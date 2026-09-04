import { useMemo } from 'react';

import { FieldKind, SortDirection } from '@ogame/shared/constants';
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
  WarningIcon,
} from '../../../components/icons/index.js';
import { Checkbox } from '../../../components/index.js';
import { useSchemas } from '../../../hooks/index.js';
import type { FilterColumn, FilterRule } from '../../../types/index.js';
import {
  formatNumber,
  formatUnknownValue,
  matchesFilterRules,
  parseBooleanValue,
  validateRecordAgainstSchema,
} from '../../../utils/index.js';

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

function filterBooleanSafe(
  row: { getValue: (columnId: string) => unknown },
  columnId: string,
  filterValue: unknown
): boolean {
  const parsed = parseBooleanValue(row.getValue(columnId));
  if (!parsed.ok) {
    return false;
  }
  const expected = parseBooleanValue(filterValue);
  if (!expected.ok) {
    return false;
  }
  return parsed.value === expected.value;
}

function sortBooleanSafe(
  rowA: {
    getValue: (columnId: string) => unknown;
    table: { getColumn: (columnId: string) => { getIsSorted: () => false | 'asc' | 'desc' } | undefined };
  },
  rowB: { getValue: (columnId: string) => unknown },
  columnId: string
): number {
  const parsedA = parseBooleanValue(rowA.getValue(columnId));
  const parsedB = parseBooleanValue(rowB.getValue(columnId));
  const isDesc = rowA.table.getColumn(columnId)?.getIsSorted() === 'desc';

  if (!parsedA.ok && !parsedB.ok) {
    return 0;
  }
  if (!parsedA.ok) {
    return isDesc ? -1 : 1;
  }
  if (!parsedB.ok) {
    return isDesc ? 1 : -1;
  }

  return Number(parsedA.value) - Number(parsedB.value);
}

const features = tableFeatures({
  coreRowModel: createCoreRowModel(),
  columnFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    booleanSafe: sortBooleanSafe,
    text: sortFn_text,
  },
  filterFns: {
    booleanSafe: filterBooleanSafe,
  },
});
const columnHelper = createColumnHelper<typeof features, Note>();

const SORT_INDICATOR: Record<string, string> = {
  asc: ' ↑',
  desc: ' ↓',
};

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
    typeof value === 'string' ? JSON.stringify(value) : formatUnknownValue(value);
  const tooltip = `Value '${formatUnknownValue(value)}' is not a valid boolean`;

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

    const statusColumn = columnHelper.display({
      id: 'rowStatus',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <RowStatusCell note={row.original} fields={fields} />
      ),
    });

    const dynamicColumns = fields.map(field => {
      const isBoolean = field.type === FieldKind.BOOLEAN;

      return columnHelper.accessor(row => row[field.id], {
        id: field.id,
        header: toCapital(field.name),
        ...(isBoolean
          ? { sortFn: 'booleanSafe' as const, filterFn: 'booleanSafe' as const }
          : {}),
        cell: ({ getValue }) => {
          const value = getValue();
          if (isBoolean) {
            return <BooleanCell value={value} />;
          }
          if (field.type === FieldKind.NUMBER) {
            const parsed =
              typeof value === 'number'
                ? value
                : typeof value === 'string' && value.trim() !== ''
                  ? Number(value)
                  : Number.NaN;
            return Number.isFinite(parsed) ? formatNumber(parsed) : '';
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

  const defaultSorting = useMemo(() => {
    if (!schema?.sort) return [];
    return [
      {
        id: schema.sort,
        desc: schema.direction === SortDirection.DESC,
      },
    ];
  }, [schema?.sort, schema?.direction]);

  const table = useTable(
    {
      features,
      columns,
      data,
      initialState: {
        sorting: defaultSorting,
      },
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
                <td
                  key={cell.id}
                  className={
                    cell.column.id === 'rowStatus' ? styles.rowStatus : ''
                  }
                >
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
