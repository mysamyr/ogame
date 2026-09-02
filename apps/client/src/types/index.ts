import type { FieldKind } from '@ogame/shared/constants';

import type {
  FilterLogicalOperator,
  FilterOperator,
} from '../constants/index.js';

export type FilterColumn = {
  id: string;
  label: string;
  type: FieldKind;
};

export type FilterRule = {
  column: string;
  operator: FilterOperator;
  value: string;
  logicalOperator: FilterLogicalOperator;
};
