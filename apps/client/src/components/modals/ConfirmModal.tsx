import type { ReactElement } from 'react';

import { ButtonVariant } from '../../constants/index.js';
import Button from '../Button.js';

import styles from './ConfirmModal.module.css';

type ConfirmModalProps = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: ButtonVariant;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({
  title = 'Confirm',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = ButtonVariant.PRIMARY,
  onConfirm,
  onCancel,
}: ConfirmModalProps): ReactElement {
  return (
    <div className={styles.container}>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.message}>{message}</p>
      <div className={styles.actions}>
        <Button variant={ButtonVariant.SECONDARY} onClick={onCancel}>
          {cancelText}
        </Button>
        <Button variant={confirmVariant} onClick={onConfirm}>
          {confirmText}
        </Button>
      </div>
    </div>
  );
}
