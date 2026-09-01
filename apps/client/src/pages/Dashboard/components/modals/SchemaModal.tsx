import type { ReactElement } from 'react';

import {
  SchemaCreatePayload,
  SchemaDescriptor,
} from '../../../../types/index.js';
import SchemaForm from '../SchemaForm.js';

import styles from './SchemaModal.module.css';

type Props = {
  title: string;
  submitText: string;
  initialSchema?: SchemaDescriptor;
  onSubmit: (payload: SchemaCreatePayload) => void;
  onCancel: () => void;
};

export default function SchemaModal({
  title,
  submitText,
  initialSchema,
  onSubmit,
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
          onCancel={onCancel}
        />
      </div>
    </div>
  );
}
