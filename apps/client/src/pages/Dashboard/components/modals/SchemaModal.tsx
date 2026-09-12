import {
  type ChangeEvent,
  type DragEvent,
  type MouseEvent,
  useEffect,
  useRef,
  useState,
} from 'react';

import { FieldKind, SortDirection } from '@ogame/shared/constants';
import type { Schema, SchemaField } from '@ogame/shared/types';
import { toSnake } from '@ogame/shared/utils';
import { schemaPayload, type SchemaPayload } from '@ogame/shared/validation';
import {
  type FieldErrors,
  type Path,
  useFieldArray,
  useForm,
} from 'react-hook-form';

import {
  DeleteIcon,
  DragHandleIcon,
  GearIcon,
  SortAscIcon,
  SortDescIcon,
  SortNeutralIcon,
} from '../../../../components/icons/index.js';
import {
  Button,
  Checkbox,
  Dropdown,
  Input,
  RequiredMarker,
} from '../../../../components/index.js';
import { ButtonVariant } from '../../../../constants/index.js';
import { classNames } from '../../../../utils/index.js';

import styles from './SchemaModal.module.css';

type Props = {
  title: string;
  submitText: string;
  initialSchema?: Schema;
  onSubmit: (payload: SchemaPayload) => void;
  onCancel: () => void;
};

/**
 * `useFieldArray` regenerates its `id`s on every `reset`, so the default sort
 * is tracked by the `fields[]` array index and remapped on reorder/remove.
 */
type DefaultSortState = {
  fieldIndex: number;
  direction: SortDirection;
} | null;

const FIELD_KIND_OPTIONS = Object.values(FieldKind).map(kind => ({
  value: kind,
  label: kind,
}));

const EMPTY_FIELD: Omit<SchemaField, 'id'> = {
  name: '',
  type: FieldKind.STRING,
  required: true,
  min: null,
  max: null,
  regexp: null,
};

const getDefaultSortState = (schema?: Schema): DefaultSortState => {
  if (!schema?.sort || !schema.direction) return null;
  const fieldIndex = schema.fields.findIndex(field => field.id === schema.sort);
  return fieldIndex === -1 ? null : { fieldIndex, direction: schema.direction };
};

const remapIndexAfterMove = (index: number, from: number, to: number) => {
  if (index === from) return to;
  if (from < index && index <= to) return index - 1;
  if (to <= index && index < from) return index + 1;
  return index;
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

const getFirstErrorMessage = (
  errors: FieldErrors<SchemaPayload>,
  fieldsCount: number
): string | null => {
  if (errors.name?.message) {
    return errors.name.message;
  }

  const fieldsErrors = errors.fields;
  if (fieldsErrors) {
    for (let i = 0; i < fieldsCount; i++) {
      const fieldError = (
        fieldsErrors as Record<
          number,
          | {
              name?: { message?: string };
              min?: { message?: string };
              max?: { message?: string };
              regexp?: { message?: string };
              root?: { message?: string };
            }
          | undefined
        >
      )[i];
      if (!fieldError) continue;
      if (fieldError.name?.message) return fieldError.name.message;
      if (fieldError.min?.message) return fieldError.min.message;
      if (fieldError.max?.message) return fieldError.max.message;
      if (fieldError.regexp?.message) return fieldError.regexp.message;
      if (fieldError.root?.message) return fieldError.root.message;
    }

    if (typeof fieldsErrors.message === 'string') {
      return fieldsErrors.message;
    }
    if (
      'root' in fieldsErrors &&
      fieldsErrors.root &&
      typeof fieldsErrors.root.message === 'string'
    ) {
      return fieldsErrors.root.message;
    }
  }

  if (errors.sort?.message) {
    return errors.sort.message;
  }

  if (errors.direction?.message) {
    return errors.direction.message;
  }

  if (errors.root?.message) {
    return errors.root.message;
  }

  return null;
};

export default function SchemaModal({
  title,
  submitText,
  initialSchema,
  onSubmit,
  onCancel,
}: Props) {
  const methods = useForm<SchemaPayload>({
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
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
    setError,
    clearErrors,
    setFocus,
  } = methods;
  const { fields, append, move, remove } = useFieldArray({
    control,
    name: 'fields',
  });
  const watchedFields = watch('fields');

  const [defaultSort, setDefaultSort] = useState<DefaultSortState>(() =>
    getDefaultSortState(initialSchema)
  );
  const [openValidationRows, setOpenValidationRows] = useState<Set<string>>(
    new Set()
  );
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const dragFromIndexRef = useRef<number | null>(null);
  const fieldGroupRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const subscription = watch(() => {
      clearErrors();
    });
    return () => subscription.unsubscribe();
  }, [watch, clearErrors]);

  const handleDragStart = (
    index: number,
    event: DragEvent<HTMLButtonElement>
  ) => {
    dragFromIndexRef.current = index;
    setDraggingIndex(index);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(index));
    const fieldGroupElement = fieldGroupRefs.current[index];
    if (fieldGroupElement) {
      event.dataTransfer.setDragImage(fieldGroupElement, 16, 16);
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (toIndex: number, event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const fromIndex = dragFromIndexRef.current;
    if (fromIndex == null || fromIndex === toIndex) {
      setDraggingIndex(null);
      dragFromIndexRef.current = null;
      return;
    }
    clearErrors();
    move(fromIndex, toIndex);
    setDefaultSort(current =>
      current
        ? {
            ...current,
            fieldIndex: remapIndexAfterMove(
              current.fieldIndex,
              fromIndex,
              toIndex
            ),
          }
        : current
    );
    setDraggingIndex(null);
    dragFromIndexRef.current = null;
  };

  const handleDragEnd = () => {
    setDraggingIndex(null);
    dragFromIndexRef.current = null;
  };

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

    setDefaultSort(getDefaultSortState(initialSchema));
  }, [initialSchema, reset]);

  const handleToggleSort = (fieldIndex: number) => {
    clearErrors();
    setDefaultSort(current => {
      if (!current || current.fieldIndex !== fieldIndex) {
        return { fieldIndex, direction: SortDirection.ASC };
      }
      if (current.direction === SortDirection.ASC) {
        return { fieldIndex, direction: SortDirection.DESC };
      }
      return null;
    });
  };

  const handleRemoveField = (index: number) => {
    clearErrors();
    const targetField = fields[index];
    setDefaultSort(current => {
      if (!current) return current;
      if (current.fieldIndex === index) return null;
      return current.fieldIndex > index
        ? { ...current, fieldIndex: current.fieldIndex - 1 }
        : current;
    });
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
    clearErrors();
    const targetField = fields[index];
    methods.setValue(`fields.${index}.type`, nextType, {
      shouldValidate: false,
      shouldDirty: true,
    });
    methods.setValue(`fields.${index}.min`, null, {
      shouldValidate: false,
      shouldDirty: true,
    });
    methods.setValue(`fields.${index}.max`, null, {
      shouldValidate: false,
      shouldDirty: true,
    });
    methods.setValue(`fields.${index}.regexp`, null, {
      shouldValidate: false,
      shouldDirty: true,
    });
    if (nextType === FieldKind.BOOLEAN) {
      methods.setValue(`fields.${index}.required`, false, {
        shouldValidate: false,
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
    clearErrors();

    const payload = {
      name: values.name.trim(),
      sort: null,
      direction: null,
      fields: (values.fields ?? []).map(field => ({
        ...field,
        name: field.name.trim(),
        required: field.type === FieldKind.BOOLEAN ? false : field.required,
      })),
    } as SchemaPayload;

    if (defaultSort && values.fields?.[defaultSort.fieldIndex]) {
      const sortedFieldName =
        values.fields[defaultSort.fieldIndex]?.name?.trim();
      const validField = payload.fields.find(
        field => field.name === sortedFieldName
      );
      if (validField) {
        payload.sort = toSnake(validField.name);
        payload.direction = defaultSort.direction;
      }
    }

    const result = schemaPayload.safeParse(payload);

    if (!result.success) {
      let firstErrorField: Path<SchemaPayload> | null = null;

      result.error.issues.forEach(issue => {
        const path = issue.path;
        if (path[0] === 'name') {
          setError('name', {
            type: 'manual',
            message: issue.message,
          });
          if (!firstErrorField) {
            firstErrorField = 'name';
          }
        } else if (path[0] === 'fields') {
          if (typeof path[1] === 'number') {
            const index = path[1];
            const subField = path[2];
            if (subField === 'name') {
              setError(`fields.${index}.name`, {
                type: 'manual',
                message: issue.message,
              });
              if (!firstErrorField) {
                firstErrorField = `fields.${index}.name`;
              }
            } else if (
              subField === 'min' ||
              subField === 'max' ||
              subField === 'regexp'
            ) {
              setError(`fields.${index}.${subField}`, {
                type: 'manual',
                message: issue.message,
              });
              const targetField = fields[index];
              if (targetField) {
                setOpenValidationRows(current =>
                  new Set(current).add(targetField.id)
                );
              }
              if (!firstErrorField) {
                firstErrorField = `fields.${index}.${subField}` as Path<SchemaPayload>;
              }
            } else {
              setError(`fields.${index}.name`, {
                type: 'manual',
                message: issue.message,
              });
              if (!firstErrorField) {
                firstErrorField = `fields.${index}.name`;
              }
            }
          } else {
            setError('fields', {
              type: 'manual',
              message: issue.message,
            });
          }
        } else if (path.length === 0) {
          if (issue.message.includes('unique')) {
            const seen = new Set<string>();
            let duplicateIndex = -1;
            for (let i = 0; i < payload.fields.length; i++) {
              const currentField = payload.fields[i];
              if (!currentField) continue;
              const key = `${currentField.name}-${currentField.type}`;
              if (seen.has(key)) {
                duplicateIndex = i;
                break;
              }
              seen.add(key);
            }
            if (duplicateIndex !== -1) {
              setError(`fields.${duplicateIndex}.name`, {
                type: 'manual',
                message: issue.message,
              });
              if (!firstErrorField) {
                firstErrorField = `fields.${duplicateIndex}.name`;
              }
            }
          }
          setError('fields', {
            type: 'manual',
            message: issue.message,
          });
        } else if (path[0] === 'sort' || path[0] === 'direction') {
          setError('sort', {
            type: 'manual',
            message: issue.message,
          });
        }
      });

      if (firstErrorField) {
        setFocus(firstErrorField);
      }
      return;
    }

    onSubmit(payload);
  };

  const firstErrorMessage = getFirstErrorMessage(errors, fields.length);

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.body}>
        <div className={styles.row}>
          <label className={styles.label}>
            Schema name
            <RequiredMarker />
          </label>
          <Input
            className={classNames(errors.name && styles.inputError)}
            {...register('name')}
          />
        </div>

        <div className={styles.fieldsHeader}>
          <strong>Fields</strong>
        </div>

        {fields.map((field, index) => {
          const fieldType = watchedFields?.[index]?.type ?? FieldKind.STRING;
          const isSorted = defaultSort?.fieldIndex === index;
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
            currentMin !== null ||
            currentMax !== null ||
            currentRegexp !== null;
          const isValidationOpen = openValidationRows.has(field.id);
          const validationAriaLabel = isValidationOpen
            ? `Hide validation rules for ${fieldName}`
            : `Show validation rules for ${fieldName}`;

          const setMin = (value: number | null) => {
            clearErrors();
            methods.setValue(`fields.${index}.min`, value, {
              shouldValidate: false,
              shouldDirty: true,
            });
          };
          const setMax = (value: number | null) => {
            clearErrors();
            methods.setValue(`fields.${index}.max`, value, {
              shouldValidate: false,
              shouldDirty: true,
            });
          };
          const setRegexp = (value: string | null) => {
            clearErrors();
            methods.setValue(`fields.${index}.regexp`, value, {
              shouldValidate: false,
              shouldDirty: true,
            });
          };

          return (
            <div
              className={classNames(
                styles.fieldGroup,
                draggingIndex === index && styles.dragging
              )}
              key={field.id}
              ref={element => {
                fieldGroupRefs.current[index] = element;
              }}
              onDragOver={handleDragOver}
              onDrop={event => handleDrop(index, event)}
            >
              <div className={styles.fieldRow}>
                <button
                  type="button"
                  className={styles.dragHandle}
                  draggable
                  aria-label="Reorder field"
                  title="Reorder field"
                  onDragStart={event => handleDragStart(index, event)}
                  onDragEnd={handleDragEnd}
                >
                  <DragHandleIcon />
                </button>
                <Input
                  placeholder="name"
                  className={classNames(
                    errors.fields?.[index]?.name && styles.inputError
                  )}
                  {...register(`fields.${index}.name`)}
                />
                <Dropdown
                  options={FIELD_KIND_OPTIONS}
                  value={fieldType}
                  onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                    handleFieldTypeChange(
                      index,
                      event.target.value as FieldKind
                    )
                  }
                />
                {fieldType !== FieldKind.BOOLEAN ? (
                  <label className={styles.checkboxLabel}>
                    <Checkbox
                      checked={Boolean(watchedFields?.[index]?.required)}
                      onChange={(event: ChangeEvent<HTMLInputElement>) => {
                        clearErrors();
                        methods.setValue(
                          `fields.${index}.required`,
                          event.target.checked,
                          { shouldValidate: false, shouldDirty: true }
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
                  onClick={() => handleToggleSort(index)}
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
                    <GearIcon />
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
                              className={classNames(
                                errors.fields?.[index]?.min && styles.inputError
                              )}
                              value={currentMin ?? ''}
                              onChange={(
                                event: ChangeEvent<HTMLInputElement>
                              ) => {
                                const raw = event.target.value;
                                setMin(raw === '' ? null : Number(raw));
                              }}
                            />
                          </label>
                          <label className={styles.validationField}>
                            Max length
                            <Input
                              type="number"
                              className={classNames(
                                errors.fields?.[index]?.max && styles.inputError
                              )}
                              value={currentMax ?? ''}
                              onChange={(
                                event: ChangeEvent<HTMLInputElement>
                              ) => {
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
                              className={classNames(
                                errors.fields?.[index]?.regexp &&
                                  styles.inputError
                              )}
                              value={currentRegexp ?? ''}
                              onChange={(
                                event: ChangeEvent<HTMLInputElement>
                              ) => {
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
                              className={classNames(
                                errors.fields?.[index]?.min && styles.inputError
                              )}
                              value={currentMin ?? ''}
                              onChange={(
                                event: ChangeEvent<HTMLInputElement>
                              ) => {
                                const raw = event.target.value;
                                setMin(raw === '' ? null : Number(raw));
                              }}
                            />
                          </label>
                          <label className={styles.validationField}>
                            Max value
                            <Input
                              type="number"
                              className={classNames(
                                errors.fields?.[index]?.max && styles.inputError
                              )}
                              value={currentMax ?? ''}
                              onChange={(
                                event: ChangeEvent<HTMLInputElement>
                              ) => {
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
                              type={
                                fieldType === FieldKind.DATE ? 'date' : 'time'
                              }
                              className={classNames(
                                errors.fields?.[index]?.min && styles.inputError
                              )}
                              value={
                                fieldType === FieldKind.DATE
                                  ? numberToDateInputValue(currentMin)
                                  : numberToTimeInputValue(currentMin)
                              }
                              onChange={(
                                event: ChangeEvent<HTMLInputElement>
                              ) => {
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
                              type={
                                fieldType === FieldKind.DATE ? 'date' : 'time'
                              }
                              className={classNames(
                                errors.fields?.[index]?.max && styles.inputError
                              )}
                              value={
                                fieldType === FieldKind.DATE
                                  ? numberToDateInputValue(currentMax)
                                  : numberToTimeInputValue(currentMax)
                              }
                              onChange={(
                                event: ChangeEvent<HTMLInputElement>
                              ) => {
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

        {firstErrorMessage ? (
          <p className={styles.error}>{firstErrorMessage}</p>
        ) : null}

        <div className={styles.actions}>
          <Button
            variant={ButtonVariant.SECONDARY}
            onClick={() => {
              clearErrors();
              append({ ...EMPTY_FIELD });
            }}
          >
            Add field
          </Button>
          <div className={styles.submitActions}>
            <Button variant={ButtonVariant.SECONDARY} onClick={onCancel}>
              Cancel
            </Button>
            <Button
              onClick={(event: MouseEvent<HTMLElement>) => {
                void handleSubmit(submit)(event);
              }}
            >
              {submitText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
