import { memo } from 'react';

import { FieldKind } from '@ogame/shared/constants';
import { SchemaField } from '@ogame/shared/types';
import { toCapital } from '@ogame/shared/utils';
import {
  type Control,
  type RegisterOptions,
  type UseFormRegister,
  type UseFormSetValue,
  useFormState,
  useWatch,
} from 'react-hook-form';

import { Checkbox, Input, RequiredMarker } from '../../../components/index.js';
import {
  getInputType,
  parseBooleanValue,
  validateRecordAgainstSchema,
} from '../../../utils/index.js';

import styles from './FieldInput.module.css';

export type NoteFormValues = Record<string, string | number | boolean>;

type Props = {
  control: Control<NoteFormValues>;
  field: SchemaField;
  placeholder?: string;
  register: UseFormRegister<NoteFormValues>;
  rules?: RegisterOptions<NoteFormValues>;
  setValue: UseFormSetValue<NoteFormValues>;
};

function FieldInput({
  control,
  field,
  placeholder,
  register,
  rules,
  setValue,
}: Props) {
  const value = useWatch({ control, name: field.id });
  const { errors, touchedFields } = useFormState({
    control,
    name: field.id,
  });
  const isErrorVisible = Boolean(touchedFields[field.id]);
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

  return (
    <label className={styles.label}>
      {toCapital(field.name)}
      {field.required ? <RequiredMarker /> : ''}
      <Input
        className={styles.input}
        type={getInputType(field.type)}
        placeholder={placeholder}
        {...register(field.id, {
          required: field.required
            ? `${toCapital(field.name)} is required`
            : false,
          valueAsNumber: field.type === FieldKind.NUMBER || undefined,
          ...rules,
        } as RegisterOptions<NoteFormValues>)}
      />
      {errorMessage ? (
        <span className={styles.errorText}>{errorMessage}</span>
      ) : null}
    </label>
  );
}

export default memo(FieldInput);
