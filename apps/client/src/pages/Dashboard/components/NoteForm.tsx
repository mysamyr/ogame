import { useEffect } from 'react';

import { FieldKind } from '@ogame/shared/constants';
import { Note } from '@ogame/shared/types';
import { FormProvider, useForm } from 'react-hook-form';

import { useSearchParams } from 'react-router-dom';

import { saveNote, updateNote } from '../../../api/notes.js';
import { Button } from '../../../components/index.js';
import { ButtonVariant } from '../../../constants/index.js';
import { useNotes, useSchemas, useSnackbar } from '../../../hooks/index.js';
import { nowTime, todayDate } from '../../../utils/date.js';

import FieldInput from './FieldInput.js';
import styles from './NoteForm.module.css';

type FormValues = Record<string, string | number | boolean>;

export default function NoteForm() {
  const { getActiveSchema } = useSchemas();
  const { showSnackbar } = useSnackbar();
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
    const defaults: FormValues = {};

    activeSchema?.fields.forEach(field => {
      const val = activeNote?.[field.id];
      if (field.type === FieldKind.BOOLEAN) {
        defaults[field.id] = typeof val === 'boolean' ? val : false;
      } else if (field.type === FieldKind.NUMBER) {
        defaults[field.id] = typeof val === 'number' ? val : '';
      } else if (field.type === FieldKind.TIME) {
        defaults[field.id] =
          typeof val === 'string' ? val : field.required ? nowTime() : '';
      } else if (field.type === FieldKind.DATE) {
        defaults[field.id] =
          typeof val === 'string' ? val : field.required ? todayDate() : '';
      } else {
        defaults[field.id] = typeof val === 'string' ? val : '';
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

    const payload: Note = {
      ...(data as Note),
      schema: selectedType,
    };

    // Remove optional fields that are empty/falsy
    activeSchema?.fields.forEach(field => {
      if (!field.required) {
        const val = payload[field.id];
        if (val === '' || val === undefined) {
          delete payload[field.id];
        }
      }
    });

    try {
      if (activeNote) {
        await updateNote(activeNote.id, payload);
        updateStateNote(activeNote.id, payload);
        showSnackbar('Note updated successfully');
      } else {
        const newNote = await saveNote(payload);
        addNote(newNote);
        showSnackbar('Note created successfully');
      }
      resetForm();
    } catch (error) {
      const err = error instanceof Error ? { message: error.message } : {};
      console.log(`Update failed: ${err.message}`);
      showSnackbar(`Update failed: ${err.message}`);
    }
  };

  return (
    <>
      {activeSchema ? (
        <>
          <h2>{activeNote ? 'Edit Note' : 'Create Note'}</h2>

          <FormProvider {...methods}>
            <form
              className={styles.form}
              onSubmit={event => void handleSubmit(onSubmit)(event)}
            >
              <div className={styles.fields}>
                {activeSchema?.fields.map(field => (
                  <FieldInput key={field.name} field={field} />
                ))}
              </div>

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
