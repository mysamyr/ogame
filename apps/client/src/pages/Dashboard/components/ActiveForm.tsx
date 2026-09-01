import { useEffect } from 'react';

import { FormProvider, useForm } from 'react-hook-form';

import { useSearchParams } from 'react-router-dom';

import { saveNote, updateNote } from '../../../api/notes.js';
import { Button } from '../../../components/index.js';
import {
  ButtonVariant,
  FieldKind,
  PLANET_COORDINATES_REGEX,
} from '../../../constants/index.js';
import { useNotes, useSchemas } from '../../../hooks/index.js';
import { NoteRecord } from '../../../types/index.js';
import { nowTime, todayDate } from '../../../utils/date.js';

import styles from './ActiveForm.module.css';

import FieldInput from './FieldInput.js';

type FormValues = Record<string, string | number | boolean>;

export default function ActiveForm() {
  const { getActiveSchema } = useSchemas();
  const {
    activeNote,
    setActiveNote,
    updateNote: updateStateNote,
    addNote,
  } = useNotes();
  const [searchParams] = useSearchParams();

  const selectedType = searchParams.get('type')?.trim() ?? '';
  const activeSchema = getActiveSchema(selectedType);

  const getDefaultValues = (): FormValues => {
    const defaults: FormValues = {
      planet: activeNote?.planet ?? '',
      date: activeNote?.date ?? todayDate(),
    };

    activeSchema?.fields.forEach(field => {
      const val = activeNote?.[field.name];
      if (field.type === FieldKind.BOOLEAN) {
        defaults[field.name] = typeof val === 'boolean' ? val : false;
      } else if (field.type === FieldKind.NUMBER) {
        defaults[field.name] = typeof val === 'number' ? val : '';
      } else if (field.type === FieldKind.TIME) {
        defaults[field.name] =
          typeof val === 'string' ? val : field.required ? nowTime() : '';
      } else if (field.type === FieldKind.DATE) {
        defaults[field.name] =
          typeof val === 'string' ? val : field.required ? todayDate() : '';
      } else {
        defaults[field.name] = typeof val === 'string' ? val : '';
      }
    });

    return defaults;
  };

  const methods = useForm<FormValues>({
    defaultValues: getDefaultValues(),
    mode: 'onChange',
  });
  const { handleSubmit, reset } = methods;

  useEffect(() => {
    reset(getDefaultValues());
  }, [activeNote, selectedType, activeSchema]);

  const resetForm = () => {
    reset(getDefaultValues());
    setActiveNote(null);
  };

  const onSubmit = async (data: FormValues) => {
    if (!selectedType) return;

    const payload: NoteRecord = { ...(data as NoteRecord), type: selectedType };

    // Remove optional fields that are empty/falsy
    activeSchema?.fields.forEach(field => {
      if (!field.required) {
        const val = payload[field.name];
        if (val === '' || val === false || val === 0 || val === undefined) {
          delete payload[field.name];
        }
      }
    });

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
    <>
      {selectedType ? (
        <>
          <h2>{activeNote ? 'Edit Note' : 'Create Note'}</h2>

          <FormProvider {...methods}>
            <form
              className={styles.form}
              onSubmit={event => void handleSubmit(onSubmit)(event)}
            >
              <input type="hidden" value={activeNote?.id ?? ''} readOnly />

              <FieldInput
                field={{
                  name: 'planet',
                  type: FieldKind.STRING,
                  required: true,
                  id: 0,
                }}
                placeholder="1:123:12"
                rules={{
                  pattern: {
                    value: PLANET_COORDINATES_REGEX,
                    message: 'Planet must be in format x:xxx:xx',
                  },
                }}
              />

              <FieldInput
                field={{
                  name: 'date',
                  type: FieldKind.DATE,
                  required: true,
                  id: 0,
                }}
              />

              {activeSchema?.fields.map(field => (
                <FieldInput key={field.name} field={field} />
              ))}

              <div className={styles.buttons}>
                <Button type="submit" id="save-btn">
                  {activeNote ? 'Update' : 'Save'}
                </Button>
                {activeNote ? (
                  <Button variant={ButtonVariant.SECONDARY} onClick={resetForm}>
                    Cancel
                  </Button>
                ) : null}
              </div>
            </form>
          </FormProvider>
        </>
      ) : (
        <p className={styles.placeholder}>No schema available</p>
      )}
    </>
  );
}
