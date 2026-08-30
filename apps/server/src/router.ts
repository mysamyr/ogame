import { Router } from 'express';

import {
  getNoteSchemaForType,
  getSchemaDescriptors,
} from './config/schemas.js';
import { NoteType } from './constants.js';
import { addNote, deleteNote, getAllNotes, updateNote } from './db.js';
import { promisify } from './middleware/promisify.js';
import { noteTypeBodySchema, validateBody } from './middleware/validation.js';
import { BadRequestError } from './utils/errors.js';
import { validateSchema } from './utils/validateSchema.js';

export function createSchemasRouter() {
  const router = Router();

  /**
   * GET /api/schemas
   * Return simplified schema descriptions for client-side dynamic form rendering.
   */
  router.get(
    '/',
    promisify((_req, res) => {
      res.json(getSchemaDescriptors());
    })
  );

  return router;
}

export function createNotesRouter() {
  const router = Router();

  /**
   * GET /api/notes
   * Optional query: date, planet
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
    validateBody(noteTypeBodySchema),
    promisify<unknown, { type: NoteType; [key: string]: unknown }>(
      async (req, res) => {
        const validator = getNoteSchemaForType(req.body.type);
        const parsed = validateSchema(validator, req.body);

        const created = await addNote(parsed);

        res.status(201).json(created);
      }
    )
  );

  /**
   * PUT /api/notes/:id
   * Replace existing note; validate payload against target type.
   */
  router.put(
    '/:id',
    validateBody(noteTypeBodySchema),
    promisify<{ id: string }, { type: NoteType; [key: string]: unknown }>(
      async (req, res) => {
        const validator = getNoteSchemaForType(req.body.type);
        const parsed = validateSchema(validator, req.body);

        const id = req.params['id'];
        if (!id) throw new BadRequestError('missing id');
        const updated = await updateNote(id, parsed);
        if (!updated) {
          throw new BadRequestError('update failed');
        }

        res.sendStatus(204);
      }
    )
  );

  /**
   * DELETE /api/notes/:id
   */
  router.delete(
    '/:id',
    promisify<{ id: string }>(async (req, res) => {
      const id = req.params['id'];
      if (!id) throw new BadRequestError('missing id');
      const ok = await deleteNote(id);
      if (!ok) {
        throw new BadRequestError('delete failed');
      }

      res.sendStatus(204);
    })
  );

  return router;
}
