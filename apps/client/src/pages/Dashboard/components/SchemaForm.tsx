import { useEffect } from 'react';

import { FieldKind, NAME_REGEX } from '@ogame/shared/constants';
import type { Schema, SchemaField } from '@ogame/shared/types';
import type { SchemaPayload } from '@ogame/shared/validation';
import { useFieldArray, useForm } from 'react-hook-form';

import { DeleteIcon } from '../../../components/icons/index.js';
import {
  Button,
  Checkbox,
  Dropdown,
  Input,
  RequiredMarker,
} from '../../../components/index.js';
import {
  ButtonVariant,
  IDENTIFIER_NAME_HINT,
} from '../../../constants/index.js';

import styles from './SchemaForm.module.css';

type Props = {
  initialSchema?: Schema;
  submitText: string;
  onSubmit: (payload: SchemaPayload) => void;
  onCancel: () => void;
};

const FIELD_KIND_OPTIONS = Object.values(FieldKind).map(kind => ({
  value: kind,
  label: kind,
}));

const EMPTY_FIELD: Omit<SchemaField, 'id'> = {
  name: '',
  type: FieldKind.STRING,
  required: false,
};

export default function SchemaForm({
  initialSchema,
  submitText,
  onSubmit,
  onCancel,
}: Props) {
  const methods = useForm<SchemaPayload>({
    mode: 'onChange',
    defaultValues: {
      name: initialSchema?.name ?? '',
      fields: initialSchema?.fields.map(field => ({
        name: field.name,
        type: field.type,
        required: field.type === FieldKind.BOOLEAN ? false : field.required,
      })) ?? [{ ...EMPTY_FIELD }],
    },
  });
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = methods;
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'fields',
  });
  const watchedFields = watch('fields');
  const hasFieldNameError = fields.some((_, index) =>
    Boolean(errors.fields?.[index]?.name?.message)
  );

  useEffect(() => {
    reset({
      name: initialSchema?.name ?? '',
      fields: initialSchema?.fields.map(field => ({
        name: field.name,
        type: field.type,
        required: field.type === FieldKind.BOOLEAN ? false : field.required,
      })) ?? [{ ...EMPTY_FIELD }],
    });
  }, [initialSchema, reset]);

  const submit = (values: SchemaPayload) => {
    const normalizedName = values.name.trim();
    const normalizedFields = values.fields
      .map(field => ({
        ...field,
        name: field.name.trim(),
        required: field.type === FieldKind.BOOLEAN ? false : field.required,
      }))
      .filter(field => Boolean(field.name));
    onSubmit({ name: normalizedName, fields: normalizedFields });
  };

  return (
    <div>
      <div className={styles.row}>
        <label className={styles.label}>
          Schema name
          <RequiredMarker />
        </label>
        <Input
          {...register('name', {
            validate: value => {
              const trimmed = value.trim();
              if (!trimmed) return 'Schema name is required';
              return NAME_REGEX.test(trimmed) ? true : IDENTIFIER_NAME_HINT;
            },
          })}
        />
      </div>

      <div className={styles.fieldsHeader}>
        <strong>Fields</strong>
      </div>

      {fields.map((field, index) => {
        const fieldType = watchedFields?.[index]?.type ?? FieldKind.STRING;

        return (
          <div className={styles.fieldRow} key={field.id}>
            <Input
              placeholder="name"
              {...register(`fields.${index}.name`, {
                validate: value => {
                  const trimmed = value.trim();
                  if (!trimmed) return 'Field name is required';
                  return NAME_REGEX.test(trimmed) ? true : IDENTIFIER_NAME_HINT;
                },
              })}
            />
            <Dropdown
              options={FIELD_KIND_OPTIONS}
              value={fieldType}
              onChange={event => {
                const nextType = event.target.value as FieldKind;
                methods.setValue(`fields.${index}.type`, nextType, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
                if (nextType === FieldKind.BOOLEAN) {
                  methods.setValue(`fields.${index}.required`, false, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }
              }}
            />
            {fieldType !== FieldKind.BOOLEAN ? (
              <label className={styles.checkboxLabel}>
                <Checkbox
                  checked={Boolean(watchedFields?.[index]?.required)}
                  onChange={event => {
                    methods.setValue(
                      `fields.${index}.required`,
                      event.target.checked,
                      { shouldValidate: true, shouldDirty: true }
                    );
                  }}
                />
                Required
              </label>
            ) : (
              <div />
            )}
            <Button
              variant={ButtonVariant.ICON}
              onClick={() => remove(index)}
              disabled={fields.length === 1}
              aria-label="Remove field"
              title="Remove field"
            >
              <DeleteIcon />
            </Button>
          </div>
        );
      })}

      {errors.name?.message ? (
        <p className={styles.error}>{errors.name.message}</p>
      ) : null}
      {errors.fields?.message ? (
        <p className={styles.error}>{errors.fields.message}</p>
      ) : null}
      {hasFieldNameError ? (
        <p className={styles.error}>Every field must have a name</p>
      ) : null}

      <div className={styles.actions}>
        <Button
          variant={ButtonVariant.SECONDARY}
          onClick={() => append({ ...EMPTY_FIELD })}
        >
          Add field
        </Button>
        <div className={styles.submitActions}>
          <Button variant={ButtonVariant.SECONDARY} onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={event => {
              void handleSubmit(submit)(event);
            }}
          >
            {submitText}
          </Button>
        </div>
      </div>
    </div>
  );
}
