import { FieldKind } from '../constants/index.js';
import type { FilterColumn, FilterRule, NoteRecord } from '../types/index.js';

function compareValues(
  value: unknown,
  filterValue: string,
  type: FieldKind,
  operator: FilterRule['operator']
): boolean {
  if (type === FieldKind.BOOLEAN) {
    const matches = value === (filterValue === 'true');
    return operator === '!=' ? !matches : matches;
  }

  if (type === FieldKind.NUMBER) {
    const rowValue = Number(value);
    const expectedValue = Number(filterValue);
    if (Number.isNaN(rowValue) || Number.isNaN(expectedValue)) return false;
    if (operator === '=') return rowValue === expectedValue;
    if (operator === '!=') return rowValue !== expectedValue;
    return operator === '<'
      ? rowValue < expectedValue
      : rowValue > expectedValue;
  }

  const rowValue =
    typeof value === 'string' || typeof value === 'number' ? String(value) : '';
  if (type === FieldKind.STRING) {
    const normalizedRowValue = rowValue.toLocaleLowerCase();
    const normalizedFilterValue = filterValue.toLocaleLowerCase();
    if (operator === '=') return normalizedRowValue === normalizedFilterValue;
    if (operator === '!=') return normalizedRowValue !== normalizedFilterValue;
    return operator === '<'
      ? normalizedRowValue < normalizedFilterValue
      : normalizedRowValue > normalizedFilterValue;
  }

  if (operator === '=') return rowValue === filterValue;
  if (operator === '!=') return rowValue !== filterValue;
  return operator === '<' ? rowValue < filterValue : rowValue > filterValue;
}

export function matchesFilterRules(
  note: NoteRecord,
  rules: FilterRule[],
  columns: FilterColumn[]
): boolean {
  if (rules.length === 0) return true;

  const results = rules.map(rule => {
    const column = columns.find(item => item.id === rule.column);
    return column
      ? compareValues(note[column.id], rule.value, column.type, rule.operator)
      : true;
  });

  let matches = results[0] ?? true;
  for (let index = 1; index < results.length; index += 1) {
    const rule = rules[index];
    const result = results[index] ?? true;
    matches =
      rule?.logicalOperator === 'OR' ? matches || result : matches && result;
  }

  return matches;
}
