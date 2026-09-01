import path from 'path';

import sqlite3 from 'sqlite3';

const DB_PATH = path.join(import.meta.dirname, '..', '..', 'store.db');
const db = new sqlite3.Database(DB_PATH);

export function run(sql: string, params: unknown[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, err => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export function list<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows as T[]);
    });
  });
}

export function get<T>(
  sql: string,
  params: unknown[] = []
): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row as T | undefined);
    });
  });
}

export async function ensureStoreExists(): Promise<void> {
  await run(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      planet TEXT NOT NULL,
      date TEXT NOT NULL,
      schema TEXT NOT NULL,
      payload TEXT NOT NULL
    )
  `);
  await run(`
    CREATE TABLE IF NOT EXISTS schemas (
      id TEXT PRIMARY KEY,
      name TEXT
    )
  `);
  await run(`
    CREATE TABLE IF NOT EXISTS schema_fields (
      id TEXT PRIMARY KEY,
      schema_id TEXT NOT NULL REFERENCES schemas(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      required INTEGER NOT NULL DEFAULT 1
    )
  `);
}
