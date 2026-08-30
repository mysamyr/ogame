import { useShallow } from 'zustand/react/shallow';

import { useSchemasStore } from '../store/index.js';

export function useSchemas() {
  return useSchemasStore(
    useShallow(s => ({
      schemas: s.schemas,
      setSchemas: s.setSchemas,
      getActiveSchema: s.getActiveSchema,
    }))
  );
}
