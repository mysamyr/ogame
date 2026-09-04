import { useEffect, useState } from 'react';

import { FieldKind, NAME_REGEX, SortDirection } from '@ogame/shared/constants';
import type { Schema, SchemaField } from '@ogame/shared/types';
import { toSnake } from '@ogame/shared/utils';
import type { SchemaPayload } from '@ogame/shared/validation';
import { useFieldArray, useForm } from 'react-hook-form';

import {
  DeleteIcon,
  FilterIcon,
  SortAscIcon,
  SortDescIcon,
  SortNeutralIcon,
} from '../../../components/icons/index.js';
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
import { classNames } from '../../../utils/index.js';

import styles from './SchemaForm.module.css';

type Props = {
  initialSchema?: Schema;
  submitText: string;
  onSubmit: (payload: SchemaPayload) => void;
  onCancel: () => void;
};

type DefaultSortState = {
  fieldId: string;
  direction: SortDirection;
} | null;

const FIELD_KIND_OPTIONS = Object.values(FieldKind).map(kind => ({
  value: kind,
  label: kind,
}));

const EMPTY_FIELD: Omit<SchemaField, 'id'> = {
  name: '',
  type: FieldKind.STRING,
  required: false,
  min: null,
  max: null,
  regexp: null,
};

/**
 * `min`/`max` are stored as numbers on the field, so date/time values are
 * converted to/from their epoch-based numeric representation for storage
 * while still rendering native `date`/`time` inputs in the UI.
 */
const numberToDateInputValue = (value: number | null): string => {
  if (value === null) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
};

const dateInputValueToNumber = (value: string): number | null => {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
};

const numberToTimeInputValue = (value: number | null): string => {
  if (value === null) return '';
  const totalMinutes = ((value % 1440) + 1440) % 1440;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const timeInputValueToNumber = (value: string): number | null => {
  if (!value) return null;
  const [hoursStr, minutesStr] = value.split(':');
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
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
      sort: initialSchema?.sort ?? null,
      direction: initialSchema?.direction ?? null,
      fields: initialSchema?.fields.map(field => ({
        name: field.name,
        type: field.type,
        required: field.type === FieldKind.BOOLEAN ? false : field.required,
        min: field.min,
        max: field.max,
        regexp: field.regexp,
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

  const [defaultSort, setDefaultSort] = useState<DefaultSortState>(null);
  const [openValidationRows, setOpenValidationRows] = useState<Set<string>>(
    new Set()
  );

  const hasFieldNameError = fields.some((_, index) =>
    Boolean(errors.fields?.[index]?.name?.message)
  );

  useEffect(() => {
    reset({
      name: initialSchema?.name ?? '',
      sort: initialSchema?.sort ?? null,
      direction: initialSchema?.direction ?? null,
      fields: initialSchema?.fields.map(field => ({
        name: field.name,
        type: field.type,
        required: field.type === FieldKind.BOOLEAN ? false : field.required,
        min: field.min,
        max: field.max,
        regexp: field.regexp,
      })) ?? [{ ...EMPTY_FIELD }],
    });

    if (initialSchema?.sort && initialSchema?.direction) {
      const initialSortIndex = initialSchema.fields.findIndex(
        field => field.id === initialSchema.sort
      );
      if (initialSortIndex !== -1 && fields[initialSortIndex]) {
        setDefaultSort({
          fieldId: fields[initialSortIndex].id,
          direction: initialSchema.direction,
        });
        return;
      }
    }

    setDefaultSort(null);
  }, [initialSchema, reset]);

  const handleToggleSort = (fieldId: string) => {
    setDefaultSort(current => {
      if (!current || current.fieldId !== fieldId) {
        return { fieldId, direction: SortDirection.ASC };
      }
      if (current.direction === SortDirection.ASC) {
        return { fieldId, direction: SortDirection.DESC };
      }
      return null;
    });
  };

  const handleRemoveField = (index: number) => {
    const targetField = fields[index];
    if (targetField && defaultSort?.fieldId === targetField.id) {
      setDefaultSort(null);
    }
    if (targetField) {
      setOpenValidationRows(current => {
        if (!current.has(targetField.id)) return current;
        const next = new Set(current);
        next.delete(targetField.id);
        return next;
      });
    }
    remove(index);
  };

  const handleToggleValidation = (fieldId: string) => {
    setOpenValidationRows(current => {
      const next = new Set(current);
      if (next.has(fieldId)) {
        next.delete(fieldId);
      } else {
        next.add(fieldId);
      }
      return next;
    });
  };

  const handleFieldTypeChange = (index: number, nextType: FieldKind) => {
    const targetField = fields[index];
    methods.setValue(`fields.${index}.type`, nextType, {
      shouldValidate: true,
      shouldDirty: true,
    });
    // Auto-cleanup: purge validation rules whenever the type changes to
    // avoid carrying over constraints that no longer make sense.
    methods.setValue(`fields.${index}.min`, null, {
      shouldValidate: true,
      shouldDirty: true,
    });
    methods.setValue(`fields.${index}.max`, null, {
      shouldValidate: true,
      shouldDirty: true,
    });
    methods.setValue(`fields.${index}.regexp`, null, {
      shouldValidate: true,
      shouldDirty: true,
    });
    if (nextType === FieldKind.BOOLEAN) {
      methods.setValue(`fields.${index}.required`, false, {
        shouldValidate: true,
        shouldDirty: true,
      });
      if (targetField) {
        setOpenValidationRows(current => {
          if (!current.has(targetField.id)) return current;
          const next = new Set(current);
          next.delete(targetField.id);
          return next;
        });
      }
    }
  };

  const submit = (values: SchemaPayload) => {
    const normalizedName = values.name.trim();
    const normalizedFields = values.fields
      .map(field => ({
        ...field,
        name: field.name.trim(),
        required: field.type === FieldKind.BOOLEAN ? false : field.required,
      }))
      .filter(field => Boolean(field.name));

    let sort: string | null = null;
    let direction: SortDirection | null = null;

    if (defaultSort) {
      const sortedIndex = fields.findIndex(f => f.id === defaultSort.fieldId);
      if (sortedIndex !== -1) {
        const sortedFieldName = values.fields[sortedIndex]?.name?.trim();
        const validField = normalizedFields.find(
          field => field.name === sortedFieldName
        );
        if (validField) {
          sort = toSnake(validField.name);
          direction = defaultSort.direction;
        }
      }
    }

    onSubmit({
      name: normalizedName,
      fields: normalizedFields,
      sort,
      direction,
    });
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
        const isSorted = defaultSort?.fieldId === field.id;
        const sortDirection = isSorted ? defaultSort.direction : null;
        const fieldName = watchedFields?.[index]?.name?.trim() || 'field';

        let sortTooltip = 'Set default sort: Ascending';
        let sortAriaLabel = `Set default sort ascending for ${fieldName}`;
        let SortIconComponent = SortNeutralIcon;

        if (sortDirection === SortDirection.ASC) {
          sortTooltip = 'Set default sort: Descending';
          sortAriaLabel = `Set default sort descending for ${fieldName}`;
          SortIconComponent = SortAscIcon;
        } else if (sortDirection === SortDirection.DESC) {
          sortTooltip = 'Clear default sort';
          sortAriaLabel = `Clear default sort for ${fieldName}`;
          SortIconComponent = SortDescIcon;
        }

        const currentMin = watchedFields?.[index]?.min ?? null;
        const currentMax = watchedFields?.[index]?.max ?? null;
        const currentRegexp = watchedFields?.[index]?.regexp ?? null;
        const hasValidationRules =
          currentMin !== null || currentMax !== null || currentRegexp !== null;
        const isValidationOpen = openValidationRows.has(field.id);
        const validationAriaLabel = isValidationOpen
          ? `Hide validation rules for ${fieldName}`
          : `Show validation rules for ${fieldName}`;

        const setMin = (value: number | null) =>
          methods.setValue(`fields.${index}.min`, value, {
            shouldValidate: true,
            shouldDirty: true,
          });
        const setMax = (value: number | null) =>
          methods.setValue(`fields.${index}.max`, value, {
            shouldValidate: true,
            shouldDirty: true,
          });
        const setRegexp = (value: string | null) =>
          methods.setValue(`fields.${index}.regexp`, value, {
            shouldValidate: true,
            shouldDirty: true,
          });

        return (
          <div className={styles.fieldGroup} key={field.id}>
            <div className={styles.fieldRow}>
              <Input
                placeholder="name"
                {...register(`fields.${index}.name`, {
                  validate: value => {
                    const trimmed = value.trim();
                    if (!trimmed) return 'Field name is required';
                    return NAME_REGEX.test(trimmed)
                      ? true
                      : IDENTIFIER_NAME_HINT;
                  },
                })}
              />
              <Dropdown
                options={FIELD_KIND_OPTIONS}
                value={fieldType}
                onChange={event =>
                  handleFieldTypeChange(index, event.target.value as FieldKind)
                }
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
                className={classNames(
                  styles.sortButton,
                  isSorted && styles.sortButtonActive
                )}
                onClick={() => handleToggleSort(field.id)}
                aria-label={sortAriaLabel}
                title={sortTooltip}
              >
                <SortIconComponent />
              </Button>
              {fieldType !== FieldKind.BOOLEAN ? (
                <Button
                  variant={ButtonVariant.ICON}
                  className={classNames(
                    styles.validationButton,
                    hasValidationRules && styles.validationButtonActive
                  )}
                  onClick={() => handleToggleValidation(field.id)}
                  aria-label={validationAriaLabel}
                  aria-expanded={isValidationOpen}
                  title="Validation rules"
                >
                  <FilterIcon />
                  Rules
                </Button>
              ) : (
                <div />
              )}
              <Button
                variant={ButtonVariant.ICON}
                className={styles.removeButton}
                onClick={() => handleRemoveField(index)}
                disabled={fields.length === 1}
                aria-label="Remove field"
                title="Remove field"
              >
                <DeleteIcon />
              </Button>
            </div>

            {fieldType !== FieldKind.BOOLEAN ? (
              <div
                className={classNames(
                  styles.validationAccordion,
                  isValidationOpen && styles.validationAccordionOpen
                )}
              >
                <div className={styles.validationInner}>
                  <div className={styles.validationRow}>
                    {fieldType === FieldKind.STRING && (
                      <>
                        <label className={styles.validationField}>
                          Min length
                          <Input
                            type="number"
                            value={currentMin ?? ''}
                            onChange={event => {
                              const raw = event.target.value;
                              setMin(raw === '' ? null : Number(raw));
                            }}
                          />
                        </label>
                        <label className={styles.validationField}>
                          Max length
                          <Input
                            type="number"
                            value={currentMax ?? ''}
                            onChange={event => {
                              const raw = event.target.value;
                              setMax(raw === '' ? null : Number(raw));
                            }}
                          />
                        </label>
                        <label className={styles.validationField}>
                          Regex pattern
                          <Input
                            type="text"
                            placeholder="e.g. ^[A-Z]+$"
                            value={currentRegexp ?? ''}
                            onChange={event => {
                              const raw = event.target.value;
                              setRegexp(raw === '' ? null : raw);
                            }}
                          />
                        </label>
                      </>
                    )}

                    {fieldType === FieldKind.NUMBER && (
                      <>
                        <label className={styles.validationField}>
                          Min value
                          <Input
                            type="number"
                            value={currentMin ?? ''}
                            onChange={event => {
                              const raw = event.target.value;
                              setMin(raw === '' ? null : Number(raw));
                            }}
                          />
                        </label>
                        <label className={styles.validationField}>
                          Max value
                          <Input
                            type="number"
                            value={currentMax ?? ''}
                            onChange={event => {
                              const raw = event.target.value;
                              setMax(raw === '' ? null : Number(raw));
                            }}
                          />
                        </label>
                      </>
                    )}

                    {(fieldType === FieldKind.DATE ||
                      fieldType === FieldKind.TIME) && (
                      <>
                        <label className={styles.validationField}>
                          Min
                          <Input
                            type={fieldType === FieldKind.DATE ? 'date' : 'time'}
                            value={
                              fieldType === FieldKind.DATE
                                ? numberToDateInputValue(currentMin)
                                : numberToTimeInputValue(currentMin)
                            }
                            onChange={event => {
                              const raw = event.target.value;
                              setMin(
                                fieldType === FieldKind.DATE
                                  ? dateInputValueToNumber(raw)
                                  : timeInputValueToNumber(raw)
                              );
                            }}
                          />
                        </label>
                        <label className={styles.validationField}>
                          Max
                          <Input
                            type={fieldType === FieldKind.DATE ? 'date' : 'time'}
                            value={
                              fieldType === FieldKind.DATE
                                ? numberToDateInputValue(currentMax)
                                : numberToTimeInputValue(currentMax)
                            }
                            onChange={event => {
                              const raw = event.target.value;
                              setMax(
                                fieldType === FieldKind.DATE
                                  ? dateInputValueToNumber(raw)
                                  : timeInputValueToNumber(raw)
                              );
                            }}
                          />
                        </label>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
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
