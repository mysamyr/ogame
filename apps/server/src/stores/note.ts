import {
  FieldKind,
  FilterLogicalOperator,
  FilterOperator,
  SortDirection,
} from '@ogame/shared/constants';
import type { Note, NotesPage } from '@ogame/shared/types';
import type { FilterRule, GetNotesQuery } from '@ogame/shared/validation';

import { cacheKeys, queryCache } from '../services/cache.js';
import { get, list, run } from '../services/db.js';
import { sha256 } from '../utils/hash.js';

type NoteRecord = {
  id: string;
  schema: string;
  /**
   * JSON object of field_id -> value, or null when the note has no values
   */
  fields: string | null;
};

type FieldTypeRecord = {
  id: string;
  type: FieldKind;
};

type CountRecord = {
  total: number;
};

type NoteSchemaRecord = {
  schema: string;
};

export type ResolvedFilterRule = FilterRule & {
  kind: FieldKind;
};

type GetNotesConfig = Omit<GetNotesQuery, 'filters'> & {
  filters?: ResolvedFilterRule[];
  sortKind?: FieldKind;
};

const VALUE_JSON_EXPR = `CASE
  WHEN v.string IS NOT NULL THEN json_quote(v.string)
  WHEN v.number IS NOT NULL THEN v.number
  WHEN v.boolean IS NOT NULL THEN
    CASE WHEN v.boolean = 1 THEN json('true') ELSE json('false') END
  WHEN v.date IS NOT NULL THEN json_quote(v.date)
  WHEN v.time IS NOT NULL THEN json_quote(v.time)
END`;

function sortColumn(kind: FieldKind): string {
  if (kind === FieldKind.NUMBER) {
    return 'sv.number';
  }
  if (kind === FieldKind.BOOLEAN) {
    return 'sv.boolean';
  }
  if (kind === FieldKind.DATE) {
    return `CAST(sv.date AS TEXT) COLLATE NOCASE`;
  }
  if (kind === FieldKind.TIME) {
    return `CAST(sv.time AS TEXT) COLLATE NOCASE`;
  }
  return `CAST(sv.string AS TEXT) COLLATE NOCASE`;
}

function orderByClause(config?: GetNotesConfig): string {
  if (!config?.sort || !config.direction || !config.sortKind) {
    return ' ORDER BY n.id';
  }
  const expr = sortColumn(config.sortKind);
  const direction = config.direction === SortDirection.DESC ? 'DESC' : 'ASC';
  return ` ORDER BY (${expr}) IS NULL, ${expr} ${direction}, n.id ASC`;
}

function filterValueExpression(kind: FieldKind): string {
  const valueColumn =
    kind === FieldKind.NUMBER
      ? 'number'
      : kind === FieldKind.BOOLEAN
        ? 'boolean'
        : kind;
  const value = `(SELECT fv.${valueColumn}
    FROM note_values fv
    WHERE fv.note_id = n.id AND fv.field_id = ?)`;

  if (kind === FieldKind.NUMBER) {
    return value;
  }
  if (kind === FieldKind.BOOLEAN) {
    return `COALESCE(${value}, 0)`;
  }
  return `COALESCE(CAST(${value} AS TEXT), '')`;
}

function comparisonOperator(operator: FilterOperator): string {
  if (operator === FilterOperator.EQUALS) {
    return FilterOperator.EQUALS;
  }
  if (operator === FilterOperator.NOT_EQUALS) {
    return FilterOperator.NOT_EQUALS;
  }
  if (operator === FilterOperator.LESS_THAN) {
    return FilterOperator.LESS_THAN;
  }
  if (operator === FilterOperator.GREATER_THAN) {
    return FilterOperator.GREATER_THAN;
  }
  if (operator === FilterOperator.GREATER_EQUAL_THAN) {
    return FilterOperator.GREATER_EQUAL_THAN;
  }
  if (operator === FilterOperator.LESS_EQUAL_THAN) {
    return FilterOperator.LESS_EQUAL_THAN;
  }
  throw new Error(`Unsupported comparison operator: ${operator}`);
}

function filterCondition(rule: ResolvedFilterRule, params: unknown[]): string {
  const expression = filterValueExpression(rule.kind);
  params.push(rule.column);

  if (
    rule.kind === FieldKind.STRING &&
    (rule.operator === FilterOperator.CONTAINS ||
      rule.operator === FilterOperator.NOT_CONTAINS)
  ) {
    params.push(rule.value);
    const comparison = `instr(lower(${expression}), lower(?))`;
    return rule.operator === FilterOperator.CONTAINS
      ? `${comparison} > 0`
      : `${comparison} = 0`;
  }

  const operator = comparisonOperator(rule.operator);
  const value =
    rule.kind === FieldKind.NUMBER
      ? Number(rule.value)
      : rule.kind === FieldKind.BOOLEAN
        ? rule.value === 'true'
          ? 1
          : 0
        : rule.value;
  params.push(value);

  return rule.kind === FieldKind.STRING
    ? `${expression} ${operator} ? COLLATE NOCASE`
    : `${expression} ${operator} ?`;
}

function filterClause(
  rules: ResolvedFilterRule[],
  params: unknown[]
): string | null {
  const firstRule = rules[0];
  if (!firstRule) {
    return null;
  }

  let expression = filterCondition(firstRule, params);
  for (const rule of rules.slice(1)) {
    const logicalOperator =
      rule.logicalOperator === FilterLogicalOperator.OR ? 'OR' : 'AND';
    expression = `(${expression} ${logicalOperator} ${filterCondition(
      rule,
      params
    )})`;
  }
  return expression;
}

function parseNote(row: NoteRecord): Note {
  const fields =
    row.fields != null
      ? (JSON.parse(row.fields) as Record<string, unknown>)
      : {};
  return {
    id: row.id,
    schema: row.schema,
    ...fields,
  };
}

function getNotesCacheKey(schemaId: string, config?: GetNotesConfig): string {
  const hasSort = Boolean(config?.sort && config.direction && config.sortKind);
  const normalizedConfig = {
    limit: config?.limit ?? null,
    offset: config?.offset ?? 0,
    sort: hasSort ? config?.sort : null,
    direction: hasSort ? config?.direction : null,
    sortKind: hasSort ? config?.sortKind : null,
    filters: (config?.filters ?? []).map(rule => ({
      column: rule.column,
      operator: rule.operator,
      value: rule.value,
      logicalOperator: rule.logicalOperator,
      kind: rule.kind,
    })),
  };

  return `${cacheKeys.notes(schemaId)}${sha256(
    JSON.stringify(normalizedConfig)
  )}`;
}

function invalidateNotes(schemaIds: Iterable<string>): void {
  for (const schemaId of new Set(schemaIds)) {
    queryCache.deleteByPrefix(cacheKeys.notes(schemaId));
  }
}

async function withTransaction(fn: () => Promise<void>): Promise<void> {
  await run('BEGIN');
  try {
    await fn();
    await run('COMMIT');
  } catch (error) {
    await run('ROLLBACK');
    throw error;
  }
}

async function replaceNoteValues(
  noteId: string,
  schemaId: string,
  payload: Record<string, unknown>
): Promise<void> {
  // TODO: use more efficient
  const fields = await list<FieldTypeRecord>(
    'SELECT id, type FROM schema_fields WHERE schema_id = ?',
    [schemaId]
  );
  const typeById = new Map(fields.map(field => [field.id, field.type]));

  await run('DELETE FROM note_values WHERE note_id = ?', [noteId]);

  for (const [fieldId, value] of Object.entries(payload)) {
    if (value === undefined || value === null) continue;
    const type = typeById.get(fieldId);
    if (!type) continue;

    let string: string | null = null;
    let number: number | null = null;
    let boolean: number | null = null;
    let date: string | null = null;
    let time: string | null = null;

    if (type === FieldKind.STRING) {
      if (typeof value !== 'string') continue;
      string = value;
    } else if (type === FieldKind.NUMBER) {
      if (typeof value !== 'number') continue;
      number = value;
    } else if (type === FieldKind.BOOLEAN) {
      if (typeof value !== 'boolean') continue;
      boolean = value ? 1 : 0;
    } else if (type === FieldKind.DATE) {
      if (typeof value !== 'string') continue;
      date = value;
    } else if (type === FieldKind.TIME) {
      if (typeof value !== 'string') continue;
      time = value;
    } else {
      continue;
    }

    await run(
      `INSERT INTO note_values (
        note_id, field_id, string, number, boolean, date, time
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [noteId, fieldId, string, number, boolean, date, time]
    );
  }
}

export async function getNotes(
  schemaId: string,
  config?: GetNotesConfig
): Promise<NotesPage> {
  return queryCache.getOrSet(getNotesCacheKey(schemaId, config), () =>
    loadNotes(schemaId, config)
  );
}

async function loadNotes(
  schemaId: string,
  config?: GetNotesConfig
): Promise<NotesPage> {
  const where: string[] = [];
  const queryParams: unknown[] = [];
  const countParams: unknown[] = [];

  let sortJoin = '';
  if (config?.sort && config.direction && config.sortKind) {
    sortJoin =
      ' LEFT JOIN note_values sv ON sv.note_id = n.id AND sv.field_id = ?';
    queryParams.push(config.sort);
  }

  where.push('n.schema = ?');
  queryParams.push(schemaId);
  countParams.push(schemaId);

  const filters = config?.filters
    ? filterClause(config.filters, queryParams)
    : null;
  if (filters) {
    where.push(filters);
    filterClause(config!.filters ?? [], countParams);
  }

  const whereClause = where.length > 0 ? ` WHERE ${where.join(' AND ')}` : '';
  let paginationClause = '';
  if (config?.limit) {
    paginationClause = ' LIMIT ?';
    queryParams.push(config.limit);
    if (config.offset != null) {
      paginationClause += ' OFFSET ?';
      queryParams.push(config.offset);
    }
  }

  const rows = await list<NoteRecord>(
    `SELECT
      n.id,
      n.schema,
      json_group_object(v.field_id, ${VALUE_JSON_EXPR})
        FILTER (WHERE v.field_id IS NOT NULL) AS fields
    FROM notes n
    LEFT JOIN note_values v ON v.note_id = n.id
    ${sortJoin}
    ${whereClause}
    GROUP BY n.id, n.schema
    ${orderByClause(config)}
    ${paginationClause}`,
    queryParams
  );

  const countRow = await get<CountRecord>(
    `SELECT COUNT(*) AS total
    FROM notes n
    ${whereClause}`,
    countParams
  );

  return {
    items: rows.map(parseNote),
    total: countRow?.total ?? 0,
    limit: config?.limit ?? null,
    offset: config?.offset ?? 0,
  };
}

export async function getNoteById(id: string): Promise<Note | null> {
  const row = await get<NoteRecord>(
    `SELECT
      n.id,
      n.schema,
      json_group_object(v.field_id, ${VALUE_JSON_EXPR})
        FILTER (WHERE v.field_id IS NOT NULL) AS fields
    FROM notes n
    LEFT JOIN note_values v ON v.note_id = n.id
    WHERE n.id = ?
    GROUP BY n.id, n.schema`,
    [id]
  );
  if (!row) return null;
  return parseNote(row);
}

export async function addNote(note: Note): Promise<void> {
  const { id, schema, ...payload } = note;
  await withTransaction(async () => {
    await run('INSERT INTO notes (id, schema) VALUES (?, ?)', [id, schema]);
    await replaceNoteValues(id, schema, payload);
  });
  invalidateNotes([schema]);
}

export async function upsertNote(note: Note): Promise<void> {
  const { id, schema, ...payload } = note;
  const existing = await get<NoteSchemaRecord>(
    'SELECT schema FROM notes WHERE id = ?',
    [id]
  );
  await withTransaction(async () => {
    await run(
      'INSERT INTO notes (id, schema) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET schema = excluded.schema',
      [id, schema]
    );
    await replaceNoteValues(id, schema, payload);
  });
  invalidateNotes(existing ? [existing.schema, schema] : [schema]);
}

export async function deleteNotes(ids: string[]): Promise<void> {
  if (ids.length === 0) {
    return;
  }
  const placeholders = ids.map(() => '?').join(', ');
  const affectedSchemas = await list<NoteSchemaRecord>(
    `SELECT DISTINCT schema FROM notes WHERE id IN (${placeholders})`,
    ids
  );
  await run(`DELETE FROM notes WHERE id IN (${placeholders})`, ids);
  invalidateNotes(affectedSchemas.map(row => row.schema));
}
