import path from 'path';

import express from 'express';

import {
  errorHandlerMiddleware,
  notFoundMiddleware,
} from './middlewares/error-handler.js';
import { loggerMiddleware } from './middlewares/logger.js';
import { createNoteRouter, createSchemaRouter } from './routers/index.js';
import { ensureStoreExists } from './services/db.js';

const app = express();
app.use(loggerMiddleware);

app.use(express.json());

app.use('/api/schema', createSchemaRouter());
app.use('/api/note', createNoteRouter());

app.use(
  express.static(path.join(import.meta.dirname, '..', '..', 'client', 'dist'))
);

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
