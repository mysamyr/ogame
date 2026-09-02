import { Router } from 'express';

import { promisify } from '../middlewares/promisify.js';
import { validateBody, validateParams } from '../middlewares/validation.js';
import { getNotes, upsertNote } from '../stores/note.js';
import {
  createSchema,
  deleteSchema,
  getAllSchemas,
  getSchemaById,
  upsertSchema,
  updateSchema,
} from '../stores/schema.js';
import type { SchemaExportInput, SchemaInput } from '../types/index.js';
import { BadRequestError } from '../utils/errors.js';
import {
  schemaParamsPayload,
  schemaImportPayload,
  schemaPayload,
} from '../validation/index.js';

export default function createSchemaRouter() {
  const router = Router();

  /**
   * GET /api/schema
   * Return simplified schema descriptions for client-side dynamic form rendering.
   */
  router.get(
    '/',
    promisify(async (_req, res) => {
      const schemas = await getAllSchemas();

      res.json(schemas);
    })
  );

  /**
   * GET /api/schema/:id/export
   * Return a json with the schema and all its associated notes.
   */
  router.get(
    '/:id/export',
    validateParams(schemaParamsPayload),
    promisify<{ id: string }>(async (req, res) => {
      const schema = await getSchemaById(req.params.id);
      if (!schema) throw new BadRequestError('schema not found');

      const notes = await getNotes(schema.id);

      res.json({
        ...schema,
        notes,
      });
    })
  );

  /**
   * GET /api/schema/:id
   * Return a specific schema by ID.
   */
  router.get(
    '/:id',
    validateParams(schemaParamsPayload),
    promisify<{ id: string }>(async (req, res) => {
      const schema = await getSchemaById(req.params.id);
      if (!schema) throw new BadRequestError('schema not found');

      res.json(schema);
    })
  );

  /**
   * POST /api/schema
   * Create a new schema.
   */
  router.post(
    '/',
    validateBody(schemaPayload),
    promisify<unknown, SchemaInput>(async (req, res) => {
      const created = await createSchema(req.body);

      res.status(201).json(created);
    })
  );

  /**
   * POST /api/schema/import
   * Import a schema and its notes from an exported payload.
   */
  router.post(
    '/import',
    validateBody(schemaImportPayload),
    promisify<unknown, SchemaExportInput>(async (req, res) => {
      const { id, name, fields, notes } = req.body;

      await upsertSchema({ id, name, fields });
      for (const note of notes) {
        await upsertNote(note);
      }

      const schema = await getSchemaById(id);
      if (!schema) throw new Error('failed to import schema');

      res.json({
        ...schema,
        notesImported: notes.length,
      });
    })
  );

  /**
   * PUT /api/schema/:id
   * Update an existing schema by ID.
   */
  router.put(
    '/:id',
    validateParams(schemaParamsPayload),
    validateBody(schemaPayload),
    promisify<{ id: string }, SchemaInput>(async (req, res) => {
      const updated = await updateSchema(req.params.id, req.body);
      if (!updated) throw new BadRequestError('schema not found');

      res.json(updated);
    })
  );

  /**
   * DELETE /api/schema/:id
   * Delete an existing schema by ID.
   */
  router.delete(
    '/:id',
    validateParams(schemaParamsPayload),
    promisify<{ id: string }>(async (req, res) => {
      const ok = await deleteSchema(req.params.id);
      if (!ok) throw new BadRequestError('schema not found');

      res.sendStatus(204);
    })
  );

  return router;
}
