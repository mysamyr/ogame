import React from 'react';

import { RequiredMarker } from '../../../components/index.js';
import type { SchemaField } from '../../../types/index.js';
import { nowTime, todayDate } from '../../../utils/date.js';

type Props = {
  field: SchemaField;
  value?: string | number | boolean;
};

export default function FieldInput({ field, value }: Props) {
  if (field.kind === 'boolean') {
    return (
      <label key={field.name} className="field-row" data-field={field.name}>
        <span className="field-label">{field.name}</span>
        <input
          className="field-checkbox"
          name={field.name}
          data-kind={field.kind}
          type="checkbox"
          defaultChecked={Boolean(value)}
        />
      </label>
    );
  }

  const kindToInputType = {
    number: 'number',
    date: 'date',
    time: 'time',
  } as const;
  const inputType =
    kindToInputType[field.kind as keyof typeof kindToInputType] || 'text';
  const requiredAttr = field.optional ? undefined : true;

  const defaultValue =
    field.kind === 'date'
      ? todayDate()
      : field.kind === 'time'
        ? nowTime()
        : undefined;

  return (
    <label key={field.name}>
      {field.name}
      {field.optional ? '' : <RequiredMarker />}
      <input
        name={field.name}
        data-kind={field.kind}
        type={inputType}
        defaultValue={
          value ? String(value) : field.optional ? undefined : defaultValue
        }
        required={requiredAttr}
      />
    </label>
  );
}
