import { Router } from 'express';
import { z } from 'zod';

import {
  identifierNameMessage,
  identifierNameRegex,
} from './constants/index.js';
import { promisify } from './middlewares/promisify.js';
import { addNote, deleteNote, getAllNotes, updateNote } from './stores/note.js';
import {
  createSchema,
  deleteSchema,
  getAllSchemas,
  getSchemaById,
  updateSchema,
} from './stores/schema.js';
import type { Note, SchemaInput } from './types/index.js';
import { BadRequestError } from './utils/errors.js';
import { validateSchema } from './utils/validateSchema.js';

const identifierName = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .regex(identifierNameRegex, identifierNameMessage);

const schemaFieldPayload = z.object({
  name: identifierName,
  type: z.string().min(1),
  required: z.boolean(),
});

const schemaPayload = z.object({
  name: identifierName,
  fields: z.array(schemaFieldPayload).min(1, 'At least one field is required'),
});

export function createSchemasRouter() {
  const router = Router();

  /**
   * GET /api/schemas
   * Return simplified schema descriptions for client-side dynamic form rendering.
   */
  router.get(
    '/',
    promisify(async (_req, res) => {
      const schemas = await getAllSchemas();
      res.json(schemas);
    })
  );

  router.get(
    '/:id',
    promisify<{ id: string }>(async (req, res) => {
      const id = req.params['id'];
      if (!id) throw new BadRequestError('missing id');
      const schema = await getSchemaById(id);
      if (!schema) throw new BadRequestError('schema not found');
      res.json(schema);
    })
  );

  router.post(
    '/',
    promisify<unknown, SchemaInput>(async (req, res) => {
      const payload = validateSchema(schemaPayload, req.body);
      const created = await createSchema(payload);
      res.status(201).json(created);
    })
  );

  router.put(
    '/:id',
    promisify<{ id: string }, SchemaInput>(async (req, res) => {
      const id = req.params['id'];
      if (!id) throw new BadRequestError('missing id');
      const payload = validateSchema(schemaPayload, req.body);
      const updated = await updateSchema(id, payload);
      if (!updated) throw new BadRequestError('schema not found');
      res.json(updated);
    })
  );

  router.delete(
    '/:id',
    promisify<{ id: string }>(async (req, res) => {
      const id = req.params['id'];
      if (!id) throw new BadRequestError('missing id');
      const ok = await deleteSchema(id);
      if (!ok) throw new BadRequestError('schema not found');
      res.sendStatus(204);
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
    promisify<{ id: string }, Note>(async (req, res) => {
      const id = req.params['id'];
      if (!id) throw new BadRequestError('missing id');
      const updated = await updateNote(id, req.body);
      if (!updated) {
        throw new BadRequestError('update failed');
      }

      res.sendStatus(204);
    })
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
