import { useFieldArray, useForm } from 'react-hook-form';

import { DeleteIcon } from '../../../../components/icons/index.js';
import { Button, Dropdown } from '../../../../components/index.js';
import { ButtonVariant, FieldKind } from '../../../../constants/index.js';
import type {
  FilterColumn,
  FilterOperator,
  FilterRule,
} from '../../../../types/index.js';

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

const OPERATOR_OPTIONS: { label: FilterOperator; value: FilterOperator }[] = [
  { label: '=', value: '=' },
  { label: '!=', value: '!=' },
  { label: '<', value: '<' },
  { label: '>', value: '>' },
];

const LOGICAL_OPERATOR_OPTIONS = [
  { label: 'AND', value: 'AND' },
  { label: 'OR', value: 'OR' },
];

const BOOLEAN_OPTIONS = [
  { label: 'True', value: 'true' },
  { label: 'False', value: 'false' },
];

function createRule(columns: FilterColumn[]): FilterRule {
  return {
    column: columns[0]?.id ?? '',
    operator: '=',
    value: '',
    logicalOperator: 'AND',
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
      defaultValues: { rules: initialRules },
    });
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'rules',
  });
  const rules = watch('rules');

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
              <div className={styles.rule}>
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
                      setValue(`rules.${index}.operator`, '=', {
                        shouldDirty: true,
                      });
                    }
                    setValue(`rules.${index}.value`, '', { shouldDirty: true });
                  }}
                />
                {fieldType !== FieldKind.BOOLEAN ? (
                  <Dropdown
                    options={OPERATOR_OPTIONS}
                    {...register(`rules.${index}.operator`)}
                  />
                ) : null}
                {fieldType === FieldKind.BOOLEAN ? (
                  <Dropdown
                    options={BOOLEAN_OPTIONS}
                    {...register(`rules.${index}.value`)}
                  />
                ) : (
                  <input
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
