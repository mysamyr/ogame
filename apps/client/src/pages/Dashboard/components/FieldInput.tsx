import { FieldKind } from '@ogame/shared/constants';
import { SchemaField } from '@ogame/shared/types';
import { toCapital } from '@ogame/shared/utils';
import { RegisterOptions, useFormContext } from 'react-hook-form';

import { Checkbox, Input, RequiredMarker } from '../../../components/index.js';
import {
  parseBooleanValue,
  validateRecordAgainstSchema,
} from '../../../utils/index.js';

import styles from './FieldInput.module.css';

type Props = {
  field: SchemaField;
  placeholder?: string;
  rules?: RegisterOptions;
  /**
   * Surfaces validation before the user interacts with the field, used when
   * editing a record that already violates the current schema.
   */
  showErrors?: boolean;
};

export default function FieldInput({
  field,
  placeholder,
  rules,
  showErrors = false,
}: Props) {
  const {
    register,
    setValue,
    watch,
    formState: { errors, isSubmitted, touchedFields },
  } = useFormContext<Record<string, unknown>>();

  const kindToInputType: Partial<Record<string, string>> = {
    [FieldKind.NUMBER]: 'number',
    [FieldKind.DATE]: 'date',
    [FieldKind.TIME]: 'time',
  };

  const value = watch(field.id);
  const isErrorVisible =
    showErrors || isSubmitted || Boolean(touchedFields[field.id]);
  const parserError = isErrorVisible
    ? validateRecordAgainstSchema({ [field.id]: value }, [field]).errors[
        field.id
      ]
    : undefined;
  const fieldError = isErrorVisible ? errors[field.id] : undefined;
  const errorMessage =
    parserError ??
    (typeof fieldError?.message === 'string' && fieldError.message.length > 0
      ? fieldError.message
      : fieldError
        ? `${toCapital(field.name)} is required`
        : null);

  if (field.type === FieldKind.BOOLEAN) {
    const parsed = parseBooleanValue(value);

    return (
      <div className={styles.fieldRowWrap}>
        <label className={styles.fieldRow}>
          <span className={styles.fieldLabel}>{toCapital(field.name)}</span>
          <Checkbox
            className={styles.fieldCheckbox}
            name={field.id}
            checked={parsed.ok && parsed.value}
            onChange={event => {
              setValue(field.id, event.target.checked, {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
              });
            }}
          />
        </label>
        {errorMessage ? (
          <span className={styles.errorText}>{errorMessage}</span>
        ) : null}
      </div>
    );
  }

  const inputType = kindToInputType[field.type] ?? 'text';

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
