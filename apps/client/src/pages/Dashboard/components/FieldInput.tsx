import React from 'react';

import { RegisterOptions, useFormContext } from 'react-hook-form';

import { Checkbox, RequiredMarker } from '../../../components/index.js';
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
      <label className={styles.fieldRow} data-field={field.name}>
        <span className={styles.fieldLabel}>{toCapital(field.name)}</span>
        <Checkbox
          className={styles.fieldCheckbox}
          data-kind={field.type}
          {...register(field.name)}
        />
      </label>
    );
  }

  const inputType = kindToInputType[field.type] ?? 'text';
  const fieldError = errors[field.name];
  const errorMessage =
    typeof fieldError?.message === 'string' ? fieldError.message : null;

  return (
    <label>
      {toCapital(field.name)}
      {field.required ? <RequiredMarker /> : ''}
      <input
        data-kind={field.type}
        type={inputType}
        placeholder={placeholder}
        {...register(field.name, {
          required: field.required,
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
