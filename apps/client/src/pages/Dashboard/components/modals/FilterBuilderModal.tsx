import {
  type DragEvent,
  useRef,
  useState,
} from 'react';

import { FieldKind } from '@ogame/shared/constants';
import { useFieldArray, useForm } from 'react-hook-form';

import { DeleteIcon, DragHandleIcon } from '../../../../components/icons/index.js';
import { Button, Dropdown, Input } from '../../../../components/index.js';
import {
  ButtonVariant,
  FilterLogicalOperator,
  FilterOperator,
} from '../../../../constants/index.js';
import type { FilterColumn, FilterRule } from '../../../../types/index.js';
import { classNames } from '../../../../utils/index.js';

import styles from './FilterBuilderModal.module.css';

type Props = {
  columns: FilterColumn[];
  initialRules: FilterRule[];
  onApply: (rules: FilterRule[]) => void;
  onCancel: () => void;
};

type FilterFormValues = {
  rules: FilterRule[];
};

const OPERATOR_OPTIONS: { label: string; value: FilterOperator }[] = [
  { label: FilterOperator.EQUALS, value: FilterOperator.EQUALS },
  { label: FilterOperator.NOT_EQUALS, value: FilterOperator.NOT_EQUALS },
  { label: FilterOperator.LESS_THAN, value: FilterOperator.LESS_THAN },
  { label: FilterOperator.GREATER_THAN, value: FilterOperator.GREATER_THAN },
];

const STRING_OPERATOR_OPTIONS: { label: string; value: FilterOperator }[] = [
  { label: FilterOperator.CONTAINS, value: FilterOperator.CONTAINS },
  {
    label: FilterOperator.NOT_CONTAINS,
    value: FilterOperator.NOT_CONTAINS,
  },
  { label: FilterOperator.EQUALS, value: FilterOperator.EQUALS },
  { label: FilterOperator.NOT_EQUALS, value: FilterOperator.NOT_EQUALS },
];

const LOGICAL_OPERATOR_OPTIONS = [
  { label: FilterLogicalOperator.AND, value: FilterLogicalOperator.AND },
  { label: FilterLogicalOperator.OR, value: FilterLogicalOperator.OR },
];

const BOOLEAN_OPTIONS = [
  { label: 'True', value: 'true' },
  { label: 'False', value: 'false' },
];

function createRule(columns: FilterColumn[]): FilterRule {
  const firstCol = columns[0];
  return {
    column: firstCol?.id ?? '',
    operator: FilterOperator.EQUALS,
    value: firstCol?.type === FieldKind.BOOLEAN ? 'true' : '',
    logicalOperator: FilterLogicalOperator.AND,
  };
}

function getInputType(type: FieldKind): 'date' | 'number' | 'text' | 'time' {
  if (type === FieldKind.DATE) return 'date';
  if (type === FieldKind.NUMBER) return 'number';
  if (type === FieldKind.TIME) return 'time';
  return 'text';
}

export default function FilterBuilderModal({
  columns,
  initialRules,
  onApply,
  onCancel,
}: Props) {
  const { control, handleSubmit, register, setValue, watch } =
    useForm<FilterFormValues>({
      defaultValues: {
        rules: initialRules.length > 0 ? initialRules : [createRule(columns)],
      },
    });
  const { fields, append, move, remove, replace } = useFieldArray({
    control,
    name: 'rules',
  });
  const rules = watch('rules');
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const dragFromIndexRef = useRef<number | null>(null);
  const ruleRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleDragStart = (index: number, event: DragEvent<HTMLButtonElement>) => {
    dragFromIndexRef.current = index;
    setDraggingIndex(index);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(index));
    const ruleElement = ruleRefs.current[index];
    if (ruleElement) {
      event.dataTransfer.setDragImage(ruleElement, 16, 16);
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
    move(fromIndex, toIndex);
    setDraggingIndex(null);
    dragFromIndexRef.current = null;
  };

  const handleDragEnd = () => {
    setDraggingIndex(null);
    dragFromIndexRef.current = null;
  };

  return (
    <form
      className={styles.container}
      onSubmit={event => {
        void handleSubmit(values => {
          onApply(values.rules);
          onCancel();
        })(event);
      }}
    >
      <div className={styles.header}>
        <h3>Filters</h3>
        <Button
          type="button"
          variant={ButtonVariant.TEXT}
          onClick={() => replace([])}
          disabled={fields.length === 0}
        >
          Clear all
        </Button>
      </div>

      <div className={styles.rules}>
        {fields.map((field, index) => {
          const rule = rules[index];
          const column = columns.find(item => item.id === rule?.column);
          const fieldType = column?.type ?? FieldKind.STRING;

          return (
            <div key={field.id}>
              {index > 0 ? (
                <Dropdown
                  className={styles.logicalOperator}
                  options={LOGICAL_OPERATOR_OPTIONS}
                  {...register(`rules.${index}.logicalOperator`)}
                />
              ) : null}
              <div
                ref={element => {
                  ruleRefs.current[index] = element;
                }}
                className={classNames(
                  styles.rule,
                  draggingIndex === index && styles.dragging
                )}
                onDragOver={handleDragOver}
                onDrop={event => handleDrop(index, event)}
              >
                <button
                  type="button"
                  className={styles.dragHandle}
                  draggable
                  aria-label="Reorder filter"
                  title="Reorder filter"
                  onDragStart={event => handleDragStart(index, event)}
                  onDragEnd={handleDragEnd}
                >
                  <DragHandleIcon />
                </button>
                <Dropdown
                  options={columns.map(columnOption => ({
                    label: columnOption.label,
                    value: columnOption.id,
                  }))}
                  {...register(`rules.${index}.column`)}
                  onChange={event => {
                    const selectedColumn = columns.find(
                      item => item.id === event.target.value
                    );
                    setValue(`rules.${index}.column`, event.target.value, {
                      shouldDirty: true,
                    });
                    if (selectedColumn?.type === FieldKind.BOOLEAN) {
                      setValue(
                        `rules.${index}.operator`,
                        FilterOperator.EQUALS,
                        {
                          shouldDirty: true,
                        }
                      );
                      setValue(`rules.${index}.value`, 'true', {
                        shouldDirty: true,
                      });
                    } else {
                      setValue(`rules.${index}.value`, '', {
                        shouldDirty: true,
                      });
                    }
                  }}
                />
                {fieldType == FieldKind.BOOLEAN ? null : fieldType ==
                  FieldKind.STRING ? (
                  <Dropdown
                    options={STRING_OPERATOR_OPTIONS}
                    {...register(`rules.${index}.operator`)}
                  />
                ) : (
                  <Dropdown
                    options={OPERATOR_OPTIONS}
                    {...register(`rules.${index}.operator`)}
                  />
                )}
                {fieldType === FieldKind.BOOLEAN ? (
                  <Dropdown
                    className={styles.value}
                    options={BOOLEAN_OPTIONS}
                    {...register(`rules.${index}.value`)}
                  />
                ) : (
                  <Input
                    className={styles.value}
                    type={getInputType(fieldType)}
                    {...register(`rules.${index}.value`)}
                  />
                )}
                <Button
                  variant={ButtonVariant.ICON}
                  onClick={() => remove(index)}
                  aria-label="Remove filter"
                  title="Remove filter"
                >
                  <DeleteIcon />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.actions}>
        <Button
          type="button"
          variant={ButtonVariant.SECONDARY}
          onClick={() => append(createRule(columns))}
        >
          Add filter
        </Button>
        <div className={styles.submitActions}>
          <Button
            type="button"
            variant={ButtonVariant.SECONDARY}
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button type="submit">Apply filters</Button>
        </div>
      </div>
    </form>
  );
}
