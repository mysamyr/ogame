import { NotFoundError, ValidationError } from '@ogame/shared/errors';
import { Note } from '@ogame/shared/types';
import {
  notePayload,
  noteParamsPayload,
  validateNoteBySchema,
  getNotesQueryPayload,
  type GetNotesQuery,
  type NoteParams,
  type NotePayload,
} from '@ogame/shared/validation';
import { Router } from 'express';

import { promisify } from '../middlewares/promisify.js';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../middlewares/validation.js';
import {
  addNote,
  deleteNote,
  getNoteById,
  getNotes,
  updateNote,
} from '../stores/note.js';
import { getSchemaById } from '../stores/schema.js';

import { uuid } from '../utils/uuid.js';

export default function createNoteRouter() {
  const router = Router();

  /**
   * GET /api/note
   * Optional query: limit, offset
   * Return list of all notes
   */
  router.get(
    '/',
    validateQuery(getNotesQueryPayload),
    promisify<unknown, Note[], unknown, GetNotesQuery>(async (req, res) => {
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const offset = req.query.offset ? Number(req.query.offset) : undefined;
      const notes = await getNotes(undefined, {
        ...(limit && { limit }),
        ...(offset && { offset }),
      });

      res.json(notes);
    })
  );

  /**
   * POST /api/note
   * Validate payload according to its type-specific schema.
   */
  router.post(
    '/',
    validateBody(notePayload),
    promisify<unknown, Note, NotePayload>(async (req, res) => {
      const schema = await getSchemaById(req.body.schema);
      if (!schema) {
        throw new NotFoundError('schema not found');
      }
      const result = validateNoteBySchema(req.body, schema.fields);
      if (!result.success) {
        throw new ValidationError(result.error);
      }

      const id = uuid();
      const note = { ...req.body, id };

      await addNote(note);

      res.status(201).json(note);
    })
  );

  /**
   * PUT /api/note/:id
   * Replace existing note; validate payload against target type.
   */
  router.put(
    '/:id',
    validateParams(noteParamsPayload),
    validateBody(notePayload),
    promisify<NoteParams, Note, NotePayload>(async (req, res) => {
      const existing = await getNoteById(req.params.id);
      if (!existing) {
        throw new NotFoundError('note not found');
      }
      const schema = await getSchemaById(req.body.schema);
      if (!schema) {
        throw new NotFoundError('schema not found');
      }
      const result = validateNoteBySchema(req.body, schema.fields);
      if (!result.success) {
        throw new ValidationError(result.error);
      }

      await updateNote(req.params.id, req.body);

      res.json({
        id: req.params.id,
        ...req.body,
      });
    })
  );

  /**
   * DELETE /api/note/:id
   * Delete an existing note by ID.
   */
  router.delete(
    '/:id',
    validateParams(noteParamsPayload),
    promisify<NoteParams>(async (req, res) => {
      const existing = await getNoteById(req.params.id);
      if (!existing) {
        throw new NotFoundError('note not found');
      }
      await deleteNote(req.params.id);

      res.sendStatus(204);
    })
  );

  return router;
}
