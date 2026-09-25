import { useShallow } from 'zustand/react/shallow';

import { useModalStore } from '../store/index.js';

type ModalState = ReturnType<typeof useModalStore.getState>;

export function useModal<T>(selector: (state: ModalState) => T) {
  return useModalStore(useShallow(selector));
}
