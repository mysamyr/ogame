import { useState, type ChangeEvent, type ReactElement } from 'react';

import { NAME_REGEX } from '@ogame/shared/constants';
import {
  SchemaImportPayload,
  schemaImportPayload,
} from '@ogame/shared/validation';

import { Button, Input } from '../../../../components/index.js';
import { ButtonVariant } from '../../../../constants/index.js';

import styles from './ImportSchemaModal.module.css';

type Props = {
  onImport: (payload: SchemaImportPayload) => void;
  onError: (message: string) => void;
  onCancel: () => void;
};

export default function ImportSchemaModal({
  onImport,
  onError,
  onCancel,
}: Props): ReactElement {
  const [payload, setPayload] = useState<SchemaImportPayload | null>(null);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setPayload(null);
    setName('');
    setNameError(null);

    if (!file) return;

    void (async () => {
      try {
        const text = await file.text();
        const json = JSON.parse(text) as unknown;
        const result = schemaImportPayload.safeParse(json);

        if (!result.success) {
          console.error(result.error.issues);
          onError(result.error.issues[0]?.message ?? 'Invalid schema file');
          return;
        }

        setPayload(result.data);
        setName(result.data.name);
      } catch {
        onError('File is not a valid JSON file');
      }
    })();
  };

  const handleImport = () => {
    if (!payload) return;

    const trimmedName = name.trim();
    if (trimmedName.length === 0 || !NAME_REGEX.test(trimmedName)) {
      setNameError('Invalid name format');
      return;
    }

    onImport({
      ...payload,
      name: trimmedName,
    });
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
          onChange={handleFileChange}
        />
        {payload && (
          <label className={styles.nameField}>
            Schema name
            <Input
              type="text"
              value={name}
              onChange={event => {
                setName(event.target.value);
                setNameError(null);
              }}
            />
            {nameError && <p className={styles.error}>{nameError}</p>}
          </label>
        )}
      </div>
      <div className={styles.actions}>
        <Button variant={ButtonVariant.SECONDARY} onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleImport} disabled={!payload}>
          Import
        </Button>
      </div>
    </div>
  );
}
