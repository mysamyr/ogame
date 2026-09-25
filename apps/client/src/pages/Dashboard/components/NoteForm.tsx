import { useEffect } from 'react';

import { FieldKind } from '@ogame/shared/constants';
import type { Note, Schema } from '@ogame/shared/types';
import { validateNoteBySchema } from '@ogame/shared/validation/index.js';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';

import { fetchNotes, saveNote, updateNote } from '../../../api/notes.js';
import { Button } from '../../../components/index.js';
import { ButtonVariant, NOTES_PAGE_SIZE } from '../../../constants/index.js';
import { useNotes, useSchemas, useSnackbar } from '../../../hooks/index.js';
import {
  coerceRecordToSchema,
  formatUnknownValue,
  nowTime,
  todayDate,
  validateRecordAgainstSchema,
} from '../../../utils/index.js';

import FieldInput, { type NoteFormValues } from './FieldInput.js';
import styles from './NoteForm.module.css';

function toFormValue(value: unknown): NoteFormValues[string] {
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }
  if (value === null || value === undefined) {
    return '';
  }
  return formatUnknownValue(value);
}

function createDefaultValues(
  schema: Schema | null,
  note: Note | null
): NoteFormValues {
  const defaults: NoteFormValues = {};

  schema?.fields.forEach(field => {
    const value = note?.[field.id];
    const hasStoredValue = value !== undefined && value !== null;

    if (field.type === FieldKind.BOOLEAN) {
      defaults[field.id] = hasStoredValue ? toFormValue(value) : false;
      return;
    }

    if (hasStoredValue) {
      defaults[field.id] = toFormValue(value);
      return;
    }

    if (field.type === FieldKind.TIME) {
      defaults[field.id] = field.required ? nowTime() : '';
    } else if (field.type === FieldKind.DATE) {
      defaults[field.id] = field.required ? todayDate() : '';
    } else {
      defaults[field.id] = '';
    }
  });

  return defaults;
}

export default function NoteForm() {
  const [searchParams] = useSearchParams();
  const selectedType = searchParams.get('type')?.trim() ?? '';
  const activeSchema = useSchemas(
    state => state.schemas.find(schema => schema.id === selectedType) ?? null
  );
  const showSnackbar = useSnackbar(state => state.showSnackbar);
  const {
    activeNote,
    loadedNotesCount,
    setActiveNote,
    setNotes,
    updateNote: updateStateNote,
  } = useNotes(state => ({
    activeNote: state.activeNote,
    loadedNotesCount: state.notes.length,
    setActiveNote: state.setActiveNote,
    setNotes: state.setNotes,
    updateNote: state.updateNote,
  }));
  const methods = useForm<NoteFormValues>({
    defaultValues: createDefaultValues(activeSchema, activeNote),
    mode: 'onBlur',
  });
  const {
    clearErrors,
    control,
    handleSubmit,
    register,
    reset,
    setError,
    setFocus,
    setValue,
    watch,
  } = methods;
  const values = watch();
  const recordValidation = validateRecordAgainstSchema(
    values,
    activeSchema?.fields ?? []
  );

  useEffect(() => {
    reset(createDefaultValues(activeSchema, activeNote));
  }, [activeNote, selectedType, activeSchema]);

  const resetForm = () => {
    reset(createDefaultValues(activeSchema, activeNote));
    setActiveNote(null);
  };

  const onSubmit = async (data: NoteFormValues) => {
    if (!activeSchema) return;

    const coerced = coerceRecordToSchema(data, activeSchema.fields);
    const parsed = validateRecordAgainstSchema(coerced, activeSchema.fields);
    if (!parsed.isValid) {
      clearErrors();
      Object.entries(parsed.errors).forEach(([fieldName, message]) => {
        setError(fieldName, { type: 'manual', message });
      });
      const fieldToFocus =
        activeSchema.fields.find(field => parsed.errors[field.id])?.id ??
        Object.keys(parsed.errors)[0] ??
        activeSchema.fields[0]?.id;
      if (fieldToFocus) {
        setFocus(fieldToFocus);
      }
      showSnackbar(`Update failed`);
      return;
    }

    const payload: Note = {
      ...(coerced as Note),
      schema: activeSchema.id,
    };

    // Remove optional fields that are empty/falsy
    activeSchema.fields.forEach(field => {
      if (!field.required) {
        const val = payload[field.id];
        if (val === '' || val === undefined) {
          delete payload[field.id];
        }
      }
    });

    const { error, success } = validateNoteBySchema(
      payload,
      activeSchema.fields
    );
    if (!success) {
      clearErrors();

      error.issues.forEach(issue => {
        const fieldName = issue.path[0];
        if (typeof fieldName === 'string') {
          setError(fieldName, {
            type: 'manual',
            message: issue.message,
          });
        }
      });

      const fieldToFocus =
        activeSchema.fields.find(field =>
          error.issues.some(issue => issue.path[0] === field.id)
        )?.id ??
        (typeof error.issues[0]?.path[0] === 'string'
          ? error.issues[0].path[0]
          : null) ??
        activeSchema.fields[0]?.id;

      if (fieldToFocus) {
        setFocus(fieldToFocus);
      }
      showSnackbar(`Update failed`);
      return;
    }

    try {
      if (activeNote) {
        await updateNote(activeNote.id, payload);
        updateStateNote(activeNote.id, payload);
        showSnackbar('Note updated successfully');
      } else {
        await saveNote(payload);
        const page = await fetchNotes(activeSchema.id, {
          limit: Math.max(loadedNotesCount + 1, NOTES_PAGE_SIZE),
          offset: 0,
          ...(activeSchema.sort && activeSchema.direction
            ? {
                sort: activeSchema.sort,
                direction: activeSchema.direction,
              }
            : {}),
        });
        setNotes(page.items);
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

          <form
            className={styles.form}
            onSubmit={event => void handleSubmit(onSubmit)(event)}
          >
            <div className={styles.fields}>
              {activeSchema.fields.map(field => (
                <FieldInput
                  key={field.id}
                  control={control}
                  field={field}
                  register={register}
                  setValue={setValue}
                />
              ))}
            </div>

            <div className={styles.buttons}>
              <Button
                type="submit"
                id="save-btn"
                disabled={!recordValidation.isValid}
              >
                {activeNote ? 'Update' : 'Save'}
              </Button>
              {activeNote ? (
                <Button variant={ButtonVariant.SECONDARY} onClick={resetForm}>
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        </>
      ) : (
        <p className={styles.placeholder}>No schema available</p>
      )}
    </>
  );
}
