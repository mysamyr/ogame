import { Router } from 'express';

import { promisify } from '../middlewares/promisify.js';
import { validateBody, validateParams } from '../middlewares/validation.js';
import {
  addNote,
  deleteNote,
  getAllNotes,
  updateNote,
} from '../stores/note.js';
import type { Note } from '../types/index.js';
import { BadRequestError } from '../utils/errors.js';
import { notePayload, paramsPayload } from '../validation/index.js';

export default function createNotesRouter() {
  const router = Router();

  /**
   * GET /api/notes
   * Optional query: date, planet
   * Return list of all notes
   */
  router.get(
    '/',
    promisify<
      unknown,
      unknown,
      {
        date?: string;
        planet?: string;
      }
    >(async (req, res) => {
      const notes = await getAllNotes();
      const { date, planet } = req.query;
      const filtered = notes.filter(n => {
        if (date && String(n.date) !== date) return false;
        if (planet && String(n.planet) !== planet) return false;
        return true;
      });

      res.json(filtered);
    })
  );

  /**
   * POST /api/notes
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
   * PUT /api/notes/:id
   * Replace existing note; validate payload against target type.
   */
  router.put(
    '/:id',
    validateParams(paramsPayload),
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
   * DELETE /api/notes/:id
   * Delete an existing note by ID.
   */
  router.delete(
    '/:id',
    validateParams(paramsPayload),
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
