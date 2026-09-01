import path from 'path';

import express from 'express';

import {
  errorHandlerMiddleware,
  notFoundMiddleware,
} from './middlewares/error-handler.js';
import { loggerMiddleware } from './middlewares/logger.js';
import { createNotesRouter, createSchemasRouter } from './router.js';
import { ensureStoreExists } from './services/db.js';

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
    console.error('Failed to ensure SQLite store exists:', err);
    process.exit(1);
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  });
