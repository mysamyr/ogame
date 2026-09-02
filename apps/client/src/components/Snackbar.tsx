import { type ReactElement, useEffect, useRef } from 'react';

import styles from './Snackbar.module.css';

type SnackbarProps = {
  message: string;
  onClose: () => void;
};

export function Snackbar({ message, onClose }: SnackbarProps): ReactElement {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof el.showPopover === 'function') {
      try {
        el.showPopover();
      } catch {
        // Popover might already be open
      }
    }
  }, []);

  return (
    <div ref={ref} popover="manual" className={styles.container}>
      <div className={styles.label}>{message}</div>
      <div className={styles.dismiss} onClick={onClose}>
        ×
      </div>
    </div>
  );
}
