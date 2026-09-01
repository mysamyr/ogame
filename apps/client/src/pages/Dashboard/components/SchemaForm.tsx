import { useEffect } from 'react';

import { useFieldArray, useForm } from 'react-hook-form';

import { DeleteIcon } from '../../../components/icons/index.js';
import {
  Button,
  Checkbox,
  Dropdown,
  RequiredMarker,
} from '../../../components/index.js';
import {
  ButtonVariant,
  FieldKind,
  IDENTIFIER_NAME_HINT,
  IDENTIFIER_NAME_REGEX,
} from '../../../constants/index.js';
import {
  SchemaCreatePayload,
  SchemaDescriptor,
  SchemaFieldPayload,
} from '../../../types/index.js';

import styles from './SchemaForm.module.css';

type Props = {
  initialSchema?: SchemaDescriptor;
  submitText: string;
  onSubmit: (payload: SchemaCreatePayload) => void;
  onCancel: () => void;
};

const FIELD_KIND_OPTIONS = Object.values(FieldKind).map(kind => ({
  value: kind,
  label: kind,
}));

const EMPTY_FIELD: SchemaFieldPayload = {
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
  const methods = useForm<SchemaCreatePayload>({
    mode: 'onChange',
    defaultValues: {
      name: initialSchema?.name ?? '',
      fields: initialSchema?.fields.map(field => ({
        name: field.name,
        type: field.type,
        required: field.required,
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
        required: field.required,
      })) ?? [{ ...EMPTY_FIELD }],
    });
  }, [initialSchema, reset]);

  const submit = (values: SchemaCreatePayload) => {
    const normalizedName = values.name.trim();
    const normalizedFields = values.fields
      .map(field => ({
        ...field,
        name: field.name.trim(),
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
        <input
          {...register('name', {
            validate: value => {
              const trimmed = value.trim();
              if (!trimmed) return 'Schema name is required';
              return IDENTIFIER_NAME_REGEX.test(trimmed)
                ? true
                : IDENTIFIER_NAME_HINT;
            },
          })}
        />
      </div>

      <div className={styles.fieldsHeader}>
        <strong>Fields</strong>
        <Button
          variant={ButtonVariant.SECONDARY}
          onClick={() => append({ ...EMPTY_FIELD })}
        >
          Add field
        </Button>
      </div>

      {fields.map((field, index) => (
        <div className={styles.fieldRow} key={field.id}>
          <input
            placeholder="name"
            {...register(`fields.${index}.name`, {
              validate: value => {
                const trimmed = value.trim();
                if (!trimmed) return 'Field name is required';
                return IDENTIFIER_NAME_REGEX.test(trimmed)
                  ? true
                  : IDENTIFIER_NAME_HINT;
              },
            })}
          />
          <Dropdown
            options={FIELD_KIND_OPTIONS}
            value={watchedFields?.[index]?.type ?? FieldKind.STRING}
            onChange={event => {
              methods.setValue(
                `fields.${index}.type`,
                event.target.value as FieldKind,
                { shouldValidate: true, shouldDirty: true }
              );
            }}
          />
          <label>
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
      ))}

      {errors.name?.message ? (
        <p className={styles.error}>{errors.name.message}</p>
      ) : null}
      {errors.fields?.message ? (
        <p className={styles.error}>{errors.fields.message}</p>
      ) : null}
      {hasFieldNameError ? (
        <p className={styles.error}>Every field must have a name</p>
      ) : null}

      <div className={styles.fieldsHeader}>
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
  );
}
