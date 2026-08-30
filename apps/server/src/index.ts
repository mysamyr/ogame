import path from 'path';

import express from 'express';

import { ensureStoreExists } from './db.js';
import {
  errorHandlerMiddleware,
  notFoundMiddleware,
} from './middleware/error-handler.js';
import { loggerMiddleware } from './middleware/logger.js';
import { createNotesRouter, createSchemasRouter } from './router.js';

const app = express();
app.use(loggerMiddleware);

app.use(express.json());

app.use(express.static(path.join(import.meta.dirname, '..', 'public')));

app.use('/api/schemas', createSchemasRouter());
app.use('/api/notes', createNotesRouter());

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const PORT = 3000;

void ensureStoreExists()
  .catch(err => {
    console.error('Failed to ensure store.json exists:', err);
    process.exit(1);
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  });
