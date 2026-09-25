import { useShallow } from 'zustand/react/shallow';

import { useSchemasStore } from '../store/index.js';

type SchemasState = ReturnType<typeof useSchemasStore.getState>;

export function useSchemas<T>(selector: (state: SchemasState) => T) {
  return useSchemasStore(useShallow(selector));
}
