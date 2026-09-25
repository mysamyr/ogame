# SchemaNotes

A schema-driven notes application for managing typed records in a local SQLite database. The app lets you define custom
schemas with fields like string, number, boolean, date, and time, then create, filter, sort, import, and export notes
based on those schemas.

## Overview

SchemaNotes combines:

- a React + Vite client for the notes dashboard
- an Express API for schema and note operations
- SQLite-backed persistence for flexible, typed data storage
- shared validation logic across server and client
- import/export support for schema and note payloads

This is a single-user local application designed around structured note collections, where each schema defines the
expected shape of the data.

## Features

- Create, edit, and delete schemas
- Dynamic schema fields with typed validation
- Supported field types:
  - string
  - number
  - boolean
  - date
  - time
- Required fields, min/max constraints, regex validation
- Create, update, and delete notes
- Sort notes by configured schema field
- Filter notes with compound conditions
- Bulk delete selected rows
- Import schema + notes from exported JSON
- Export a schema and all associated notes
- Local SQLite storage with automatic table creation
- Server-side validation using Zod
- Docker support for simple production deployment

## Tech Stack

- Frontend: React 19, Vite, React Router 7, Zustand, React Hook Form, TanStack Table
- Backend: Node.js 24+, Express 5
- Database: SQLite 3
- Validation: Zod
- Shared contracts: TypeScript workspace packages
- Styling: CSS Modules
- Runtime tooling: npm workspaces, TypeScript, ESLint, Prettier

## Project Structure

```text
ogame/
├── apps/
│   ├── client/           # React frontend
│   │   └── src/
│   └── server/           # Express API
│       └── src/
├── packages/
│   └── shared/           # Shared constants, errors, validation, types
├── compose.yaml
├── Dockerfile
├── package.json
├── tsconfig.json
├── README.md
└── store.db             # Local database (default path)
```

## Getting Started

### Prerequisites

- Node.js 24 or newer
- npm 11 or newer

### Install dependencies

```bash
npm install
```

### Run in development mode

This starts both the API and frontend:

```bash
npm run dev
```

- Client: http://localhost:5173
- API: http://localhost:3000

The client dev server proxies `/api` requests to the backend.

### Build for production

```bash
npm run build
```

### Start production server

```bash
npm start
```

This serves the built frontend and runs the Express API.

## Docker

### Compose

```bash
docker compose up --build
```

The app is exposed on:

```text
http://localhost:3000
```

SQLite data is persisted in Docker volume:

```text
ogame-data
```

### Direct Docker build

```bash
docker build -t ogame .
```

## Environment Variables

The application supports:

- `PORT` — API server port, default `3000`
- `DB_PATH` — SQLite database location, default `./store.db`

Example:

```bash
PORT=4000 DB_PATH=./data/store.db npm run dev
```

## API

The backend exposes REST-style endpoints under `/api`.

### Schemas

- `GET /api/schema`
  - Lists all schema definitions
- `POST /api/schema`
  - Creates a new schema
- `PUT /api/schema/:id`
  - Updates an existing schema
- `DELETE /api/schema/:id`
  - Deletes a schema and all related notes
- `GET /api/schema/:id/export`
  - Exports a schema and its notes as JSON
- `POST /api/schema/import`
  - Imports a schema and notes payload

### Notes

- `GET /api/note/:id`
  - Gets notes for a schema, with optional filters, sorting, limit, and offset
- `POST /api/note`
  - Creates a note
- `PUT /api/note/:id`
  - Replaces an existing note
- `DELETE /api/note`
  - Deletes multiple notes by query param ids
- `DELETE /api/note/:id`
  - Deletes a single note

### Query features for notes

`GET /api/note/:id` supports:

- `limit`
- `offset`
- `sort`
- `direction`
- `filters` as a JSON-encoded array of filter rules

Example query with filters:

```text
/api/note/my_schema?sort=score&direction=desc&limit=50&offset=0&filters=[{"column":"priority","operator":"=","value":"high","logicalOperator":"AND"}]
```

## Data Model

The database is initialized in the server’s database service and uses SQLite tables:

- `schemas`
  - id
  - name
  - sort
  - direction

- `schema_fields`
  - id
  - schema_id
  - name
  - type
  - required
  - min
  - max
  - regexp
  - position

- `notes`
  - id
  - schema

- `note_values`
  - note_id
  - field_id
  - string
  - number
  - boolean
  - date
  - time

This model stores notes as a base record plus dynamically typed values in an EAV-style structure.

## Validation

Schema and note validation are centralized in the shared package, using Zod. Validation covers:

- schema field uniqueness
- required field rules
- numeric range checks
- regex constraints
- sort/direction consistency
- note values vs. expected schema types
- invalid filter operators for field types

## Client Behavior

The frontend is built around a dashboard layout:

- schema selector
- create/edit/delete schema actions
- note form for the active schema
- notes table with sorting, selection, validation warnings, filters, import/export actions

The dashboard uses Zustand stores for schemas and notes, and the query layer handles local state synchronization with
API results.

## Notes on Architecture

Some implementation details worth knowing:

- Shared validation and type contracts live in `packages/shared`
- API errors are standardized and surfaced from the client using a typed fetch wrapper
- The server uses query caching for schema and notes retrieval
- Database access is kept in store modules, with routers only validating and delegating work
- The client uses CSS Modules for component styling

## Scripts

From the repository root:

```bash
npm run dev
npm run build
npm run lint
npm run lint:fix
npm run typecheck
npm run format
```

Workspace-specific scripts are also available via npm workspaces:

```bash
npm -w @ogame/client run dev
npm -w @ogame/server run dev
npm -w @ogame/shared run build
```

## License

This project is currently unlicensed unless otherwise specified in repository metadata.

## Summary

SchemaNotes is a compact, schema-based note management system built for structured local data entry, filtering, and
export/import workflows. It is especially useful for tracking records whose fields are defined by a reusable schema
rather than a fixed database table.
