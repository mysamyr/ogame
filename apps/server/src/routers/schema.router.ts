import { Router } from 'express';

import { promisify } from '../middlewares/promisify.js';
import { validateBody, validateParams } from '../middlewares/validation.js';
import {
  createSchema,
  deleteSchema,
  getAllSchemas,
  getSchemaById,
  updateSchema,
} from '../stores/schema.js';
import { SchemaInput } from '../types/index.js';
import { BadRequestError } from '../utils/errors.js';
import { paramsPayload, schemaPayload } from '../validation/index.js';

export default function createSchemasRouter() {
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

  /**
   * GET /api/schemas/:id
   * Return a specific schema by ID.
   */
  router.get(
    '/:id',
    validateParams(paramsPayload),
    promisify<{ id: string }>(async (req, res) => {
      const schema = await getSchemaById(req.params.id);
      if (!schema) throw new BadRequestError('schema not found');

      res.json(schema);
    })
  );

  /**
   * POST /api/schemas
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
   * PUT /api/schemas/:id
   * Update an existing schema by ID.
   */
  router.put(
    '/:id',
    validateParams(paramsPayload),
    validateBody(schemaPayload),
    promisify<{ id: string }, SchemaInput>(async (req, res) => {
      const updated = await updateSchema(req.params.id, req.body);
      if (!updated) throw new BadRequestError('schema not found');

      res.json(updated);
    })
  );

  /**
   * DELETE /api/schemas/:id
   * Delete an existing schema by ID.
   */
  router.delete(
    '/:id',
    validateParams(paramsPayload),
    promisify<{ id: string }>(async (req, res) => {
      const ok = await deleteSchema(req.params.id);
      if (!ok) throw new BadRequestError('schema not found');

      res.sendStatus(204);
    })
  );

  return router;
}
