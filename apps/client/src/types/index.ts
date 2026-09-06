import type { FieldKind } from '@ogame/shared/constants';

export type FilterColumn = {
  id: string;
  label: string;
  type: FieldKind;
};
