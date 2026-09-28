import path from 'path';

const SERVER_ROOT = path.join(import.meta.dirname, '..', '..');

try {
  process.loadEnvFile(path.join(SERVER_ROOT, '.env'));
} catch (err) {
  if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
}

export const PORT = Number(process.env.PORT || 3000);
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const DB_PATH =
  process.env.DB_PATH || path.join(SERVER_ROOT, 'store.db');
