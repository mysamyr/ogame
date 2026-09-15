import {
  ConflictError,
  InternalServerError,
  NotFoundError,
} from '@ogame/shared/errors';
import { Schema } from '@ogame/shared/types';
import { toSnake } from '@ogame/shared/utils';
import {
  schemaParamsPayload,
  schemaPayload,
  SchemaParams,
  SchemaPayload,
  SchemaImportPayload,
  schemaImportPayload,
} from '@ogame/shared/validation';
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
} from '../stores/schema.js';

export default function createSchemaRouter() {
  const router = Router();

  /**
   * GET /api/schema
   * Return simplified schema descriptions for client-side dynamic form rendering.
   */
  router.get(
    '/',
    promisify<unknown, Schema[]>(async (_req, res) => {
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
    promisify<SchemaParams, SchemaImportPayload>(async (req, res) => {
      const schema = await getSchemaById(req.params.id);
      if (!schema) throw new NotFoundError('schema not found');

      const notesPage = await getNotes(schema.id);

      res.json({
        ...schema,
        notes: notesPage.items,
      });
    })
  );

  /**
   * POST /api/schema
   * Create a new schema.
   */
  router.post(
    '/',
    validateBody(schemaPayload),
    promisify<unknown, Schema, SchemaPayload>(async (req, res) => {
      const id = toSnake(req.body.name);

      const schema = await getSchemaById(id);
      if (schema) throw new ConflictError('schema already exists');

      const payload = {
        id,
        name: req.body.name,
        fields: req.body.fields.map(f => ({
          id: toSnake(f.name),
          name: f.name,
          type: f.type,
          required: f.required,
          min: f.min,
          max: f.max,
          regexp: f.regexp,
        })),
        sort: req.body.sort,
        direction: req.body.direction,
      };

      await createSchema(payload);

      res.status(201).json(payload);
    })
  );

  /**
   * POST /api/schema/import
   * Import a schema and its notes from an exported payload.
   */
  router.post(
    '/import',
    validateBody(schemaImportPayload),
    promisify<unknown, void, SchemaImportPayload>(async (req, res) => {
      const { id, name, fields, notes, sort, direction } = req.body;

      await upsertSchema({
        id,
        name,
        fields,
        sort,
        direction,
      });
      for (const note of notes) {
        await upsertNote(note);
      }

      const schema = await getSchemaById(id);
      if (!schema) throw new InternalServerError('failed to import schema');

      res.sendStatus(204);
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
    promisify<SchemaParams, Schema, SchemaPayload>(async (req, res) => {
      const { id } = req.params;
      const { name, fields, sort, direction } = req.body;
      const schema = await getSchemaById(id);
      if (!schema) throw new NotFoundError('schema not found');

      const payload = {
        id,
        name,
        fields: fields.map(f => ({
          id: toSnake(f.name),
          name: f.name,
          type: f.type,
          required: f.required,
          min: f.min,
          max: f.max,
          regexp: f.regexp,
        })),
        sort,
        direction,
      };

      await upsertSchema(payload);

      res.json(payload);
    })
  );

  /**
   * DELETE /api/schema/:id
   * Delete an existing schema by ID.
   */
  router.delete(
    '/:id',
    validateParams(schemaParamsPayload),
    promisify<SchemaParams>(async (req, res) => {
      const schema = await getSchemaById(req.params.id);
      if (!schema) throw new NotFoundError('schema not found');

      await deleteSchema(req.params.id);

      res.sendStatus(204);
    })
  );

  return router;
}
