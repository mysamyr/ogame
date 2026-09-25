import path from 'path';

import sqlite3 from 'sqlite3';

const DB_PATH =
  process.env.DB_PATH ?? path.join(import.meta.dirname, '..', '..', 'store.db');
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
  await run('PRAGMA foreign_keys = ON');
  await run(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      schema TEXT NOT NULL
    )
  `);
  await run(`
    CREATE TABLE IF NOT EXISTS schemas (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      sort TEXT,
      direction TEXT
    )
  `);
  await run(`
    CREATE TABLE IF NOT EXISTS schema_fields (
      id TEXT NOT NULL,
      schema_id TEXT NOT NULL REFERENCES schemas(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      required INTEGER NOT NULL DEFAULT 1,
      min INTEGER,
      max INTEGER,
      \`regexp\` TEXT,
      position INTEGER NOT NULL,
      PRIMARY KEY (id, schema_id)
    )
  `);
  await run(`
    CREATE TABLE IF NOT EXISTS note_values (
      note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
      field_id TEXT NOT NULL,
      string TEXT,
      number REAL,
      boolean INTEGER,
      date TEXT,
      time TEXT,
      PRIMARY KEY (note_id, field_id)
    )
  `);
}
