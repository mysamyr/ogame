import { FieldKind } from '@ogame/shared/constants';
import { Note } from '@ogame/shared/types';

import { FilterLogicalOperator, FilterOperator } from '../constants/index.js';
import type { FilterColumn, FilterRule } from '../types/index.js';

function compareValues(
  value: unknown,
  filterValue: string,
  type: FieldKind,
  operator: FilterRule['operator']
): boolean {
  if (type === FieldKind.BOOLEAN) {
    const matches = Boolean(value) === (filterValue === 'true');
    return operator === FilterOperator.NOT_EQUALS ? !matches : matches;
  }

  if (type === FieldKind.NUMBER) {
    if (value === undefined || value === null || value === '') return false;
    const rowValue = Number(value);
    const expectedValue = Number(filterValue);
    if (Number.isNaN(rowValue) || Number.isNaN(expectedValue)) return false;
    if (operator === FilterOperator.EQUALS) return rowValue === expectedValue;
    if (operator === FilterOperator.NOT_EQUALS)
      return rowValue !== expectedValue;
    return operator === FilterOperator.LESS_THAN
      ? rowValue < expectedValue
      : rowValue > expectedValue;
  }

  const rowValue =
    typeof value === 'string' || typeof value === 'number' ? String(value) : '';
  if (type === FieldKind.STRING) {
    const normalizedRowValue = rowValue.toLowerCase();
    const normalizedFilterValue = filterValue.toLowerCase();
    if (operator === FilterOperator.CONTAINS)
      return normalizedRowValue.includes(normalizedFilterValue);
    if (operator === FilterOperator.NOT_CONTAINS)
      return !normalizedRowValue.includes(normalizedFilterValue);
    if (operator === FilterOperator.EQUALS)
      return normalizedRowValue === normalizedFilterValue;
    if (operator === FilterOperator.NOT_EQUALS)
      return normalizedRowValue !== normalizedFilterValue;
  }

  if (operator === FilterOperator.EQUALS) return rowValue === filterValue;
  if (operator === FilterOperator.NOT_EQUALS) return rowValue !== filterValue;
  if (!rowValue) return false;
  return operator === FilterOperator.LESS_THAN
    ? rowValue < filterValue
    : rowValue > filterValue;
}

export function matchesFilterRules(
  note: Note,
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
      rule?.logicalOperator === FilterLogicalOperator.OR
        ? matches || result
        : matches && result;
  }

  return matches;
}
