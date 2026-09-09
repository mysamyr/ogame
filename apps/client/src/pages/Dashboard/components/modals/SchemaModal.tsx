import type { ReactElement } from 'react';

import { Schema } from '@ogame/shared/types';
import { SchemaPayload } from '@ogame/shared/validation';

import SchemaForm from '../SchemaForm.js';

import styles from './SchemaModal.module.css';

type Props = {
  title: string;
  submitText: string;
  initialSchema?: Schema;
  onSubmit: (payload: SchemaPayload) => void;
  onError: (error: string) => void;
  onCancel: () => void;
};

export default function SchemaModal({
  title,
  submitText,
  initialSchema,
  onSubmit,
  onError,
  onCancel,
}: Props): ReactElement {
  return (
    <div className={styles.container}>
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.body}>
        <SchemaForm
          initialSchema={initialSchema}
          submitText={submitText}
          onSubmit={onSubmit}
          onError={onError}
          onCancel={onCancel}
        />
      </div>
    </div>
  );
}
