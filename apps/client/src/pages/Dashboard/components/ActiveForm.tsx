import { SubmitEvent } from 'react';

import { useSearchParams } from 'react-router-dom';

import { saveNote, updateNote } from '../../../api/notes.js';
import { useNotes, useSchemas } from '../../../hooks/index.js';
import { NoteRecord } from '../../../types/index.js';
import { todayDate } from '../../../utils/date.js';

import FieldInput from './FieldInput.js';

export default function ActiveForm() {
  const { schemas, getActiveSchema } = useSchemas();
  const {
    activeNote,
    setActiveNote,
    updateNote: updateStateNote,
    addNote,
  } = useNotes();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedType = searchParams.get('type') ?? schemas[0]?.type ?? '';

  const activeSchema = getActiveSchema(selectedType);

  const buildPayload = (form: HTMLFormElement): NoteRecord => {
    const planetEl = form.elements.namedItem(
      'planet'
    ) as HTMLInputElement | null;
    const dateEl = form.elements.namedItem('date') as HTMLInputElement | null;

    const payload: Record<string, string | number | boolean> = {
      planet: planetEl?.value ?? '',
      date: dateEl?.value ?? '',
      type: selectedType,
    };

    activeSchema?.fields.forEach(field => {
      const el = form.elements.namedItem(field.name) as HTMLInputElement | null;
      let value: string | number | boolean | undefined = el?.value;

      if (field.kind === 'boolean') {
        value =
          el instanceof HTMLInputElement && el.type === 'checkbox'
            ? el.checked
            : Boolean(value);
      }

      if (
        field.optional &&
        (value === undefined || value === '' || value === false)
      ) {
        return;
      }

      if (field.kind === 'number') {
        payload[field.name] = Number(value) || 0;
      } else if (field.kind === 'boolean') {
        payload[field.name] = Boolean(value);
      } else {
        payload[field.name] = value === undefined ? '' : String(value);
      }
    });

    return payload as NoteRecord;
  };

  const resetForm = () => {
    const form = document.querySelector('form');
    if (form) {
      form.reset();
    }
    setActiveNote(null);
  };

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = buildPayload(event.target);

    try {
      if (activeNote) {
        await updateNote(activeNote.id!, payload);
        updateStateNote(activeNote.id!, payload);
      } else {
        const newNote = await saveNote(payload);
        addNote(newNote);
      }
      resetForm();
    } catch (error) {
      const err = error instanceof Error ? { message: error.message } : {};
      console.log(`Update failed: ${err.message}`);
    }
  };

  return (
    <form
      onSubmit={(event: SubmitEvent<HTMLFormElement>) =>
        void handleSubmit(event)
      }
    >
      <input type="hidden" value={activeNote?.id ?? ''} readOnly />
      <label>
        Planet
        <input
          name="planet"
          placeholder="1:123:12"
          defaultValue={activeNote?.planet ?? ''}
          required
        />
      </label>

      <label>
        Type
        <select
          name="type"
          value={selectedType}
          onChange={event => {
            setSearchParams({ type: event.target.value });
          }}
          required
        >
          {schemas.length === 0 ? (
            <option value="">No types available</option>
          ) : null}
          {schemas.map(schema => (
            <option key={schema.type} value={schema.type}>
              {schema.type}
            </option>
          ))}
        </select>
      </label>

      <label>
        Date
        <input name="date" type="date" defaultValue={todayDate()} required />
      </label>

      <div>
        {activeSchema?.fields.map(field => {
          const fieldValue = activeNote ? activeNote[field.name] : undefined;
          const normalizedValue =
            typeof fieldValue === 'string' ||
            typeof fieldValue === 'number' ||
            typeof fieldValue === 'boolean'
              ? fieldValue
              : undefined;

          return (
            <FieldInput
              key={field.name}
              field={field}
              value={normalizedValue}
            />
          );
        })}
      </div>

      <div className="buttons">
        <button type="submit" id="save-btn">
          {activeNote ? 'Update' : 'Save'}
        </button>
        {activeNote ? (
          <button type="button" className="secondary" onClick={resetForm}>
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
