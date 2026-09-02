import React from 'react';

import { RegisterOptions, useFormContext } from 'react-hook-form';

import { Checkbox, Input, RequiredMarker } from '../../../components/index.js';
import { FieldKind } from '../../../constants/index.js';
import type { SchemaField } from '../../../types/index.js';
import { toCapital } from '../../../utils/string.js';

import styles from './FieldInput.module.css';

type Props = {
  field: SchemaField;
  placeholder?: string;
  rules?: RegisterOptions;
};

export default function FieldInput({ field, placeholder, rules }: Props) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const kindToInputType: Partial<Record<string, string>> = {
    [FieldKind.NUMBER]: 'number',
    [FieldKind.DATE]: 'date',
    [FieldKind.TIME]: 'time',
  };

  if (field.type === FieldKind.BOOLEAN) {
    return (
      <label className={styles.fieldRow}>
        <span className={styles.fieldLabel}>{toCapital(field.name)}</span>
        <Checkbox className={styles.fieldCheckbox} {...register(field.id)} />
      </label>
    );
  }

  const inputType = kindToInputType[field.type] ?? 'text';
  const fieldError = errors[field.id];
  const errorMessage =
    typeof fieldError?.message === 'string' && fieldError.message.length > 0
      ? fieldError.message
      : fieldError
        ? `${toCapital(field.name)} is required`
        : null;

  return (
    <label className={styles.label}>
      {toCapital(field.name)}
      {field.required ? <RequiredMarker /> : ''}
      <Input
        className={styles.input}
        type={inputType}
        placeholder={placeholder}
        {...register(field.id, {
          required: field.required
            ? `${toCapital(field.name)} is required`
            : false,
          valueAsNumber: field.type === FieldKind.NUMBER || undefined,
          ...rules,
        } as RegisterOptions)}
      />
      {errorMessage ? (
        <span className={styles.errorText}>{errorMessage}</span>
      ) : null}
    </label>
  );
}
