import { Router } from 'express';

import { promisify } from '../middlewares/promisify.js';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../middlewares/validation.js';
import { addNote, deleteNote, getNotes, updateNote } from '../stores/note.js';
import type { GetNotesQuery, Note } from '../types/index.js';
import { BadRequestError } from '../utils/errors.js';
import {
  notePayload,
  noteParamsPayload,
  getNotesQueryPayload,
} from '../validation/index.js';

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
    promisify<unknown, unknown, GetNotesQuery>(async (req, res) => {
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
    promisify<unknown, Note>(async (req, res) => {
      const created = await addNote(req.body);

      res.status(201).json(created);
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
    promisify<{ id: string }, Note>(async (req, res) => {
      const updated = await updateNote(req.params.id, req.body);
      if (!updated) {
        throw new BadRequestError('update failed');
      }

      res.sendStatus(204);
    })
  );

  /**
   * DELETE /api/note/:id
   * Delete an existing note by ID.
   */
  router.delete(
    '/:id',
    validateParams(noteParamsPayload),
    promisify<{ id: string }>(async (req, res) => {
      const deleted = await deleteNote(req.params.id);
      if (!deleted) {
        throw new BadRequestError('delete failed');
      }

      res.sendStatus(204);
    })
  );

  return router;
}
