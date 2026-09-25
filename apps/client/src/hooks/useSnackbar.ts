import { useShallow } from 'zustand/react/shallow';

import { useSnackbarStore } from '../store/index.js';

type SnackbarState = ReturnType<typeof useSnackbarStore.getState>;

export function useSnackbar<T>(selector: (state: SnackbarState) => T) {
  return useSnackbarStore(useShallow(selector));
}
