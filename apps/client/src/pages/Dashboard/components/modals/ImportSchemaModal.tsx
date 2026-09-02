import { useState } from 'react';

import type { ReactElement } from 'react';

import { Button } from '../../../../components/index.js';
import { ButtonVariant } from '../../../../constants/index.js';
import { schemaImportPayload } from '../../../../validation/index.js';

import styles from './ImportSchemaModal.module.css';

type Props = {
  onImport: (payload: unknown) => void;
  onError: (message: string) => void;
  onCancel: () => void;
};

export default function ImportSchemaModal({
  onImport,
  onError,
  onCancel,
}: Props): ReactElement {
  const [file, setFile] = useState<File | null>(null);

  const handleImport = () => {
    if (!file) return;

    void (async () => {
      try {
        const text = await file.text();
        const json = JSON.parse(text) as unknown;
        const result = schemaImportPayload.safeParse(json);

        if (!result.success) {
          onError(result.error.issues[0]?.message ?? 'Invalid schema file');
          return;
        }

        onImport(result.data);
      } catch {
        onError('File is not a valid JSON file');
      }
    })();
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Import schema</h3>
      <div className={styles.body}>
        <div>
          <p>
            Import a schema file to restore your saved structure and settings in
            this dashboard.
          </p>
          <p>
            This lets you reuse or share the same schema across devices or
            projects.
          </p>
        </div>
        <input
          type="file"
          accept="application/json,.json"
          onChange={event => {
            setFile(event.target.files?.[0] ?? null);
          }}
        />
      </div>
      <div className={styles.actions}>
        <Button variant={ButtonVariant.SECONDARY} onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleImport} disabled={!file}>
          Import
        </Button>
      </div>
    </div>
  );
}
