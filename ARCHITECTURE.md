# Architecture

## Overview

This project is a workspace-based TypeScript app with a separate API and UI:

- `apps/server`: Express API and local JSON persistence
- `apps/client`: Vite + React frontend for viewing and editing notes

The root `package.json` manages the workspace scripts and runs both apps together with `npm run dev`.

## Workspace layout

```text
.
├── apps/
│   ├── client/
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   └── src/
│   │       ├── api/
│   │       │   ├── index.ts         # shared fetch wrapper
│   │       │   ├── notes.ts         # note CRUD helpers
│   │       │   └── schemas.ts       # schema metadata fetches
│   │       ├── components/
│   │       │   ├── Modal.tsx
│   │       │   ├── Snackbar.tsx
│   │       │   └── index.ts
│   │       ├── hooks/
│   │       │   ├── index.ts
│   │       │   ├── useModal.ts
│   │       │   ├── useNotes.ts
│   │       │   ├── useQueryParam.ts
│   │       │   ├── useSchemas.ts
│   │       │   └── useSnackbar.ts
│   │       ├── pages/
│   │       │   └── Dashboard/
│   │       │       ├── Dashboard.tsx
│   │       │       ├── components/
│   │       │       └── ...
│   │       ├── store/
│   │       │   └── index.ts         # Zustand slices for notes, schemas, modal, snackbar
│   │       ├── types/
│   │       │   └── index.ts
│   │       ├── utils/
│   │       ├── App.tsx
│   │       ├── main.tsx
│   │       └── vite-env.d.ts
│   └── server/
│       ├── package.json
│       ├── tsconfig.json
│       ├── store.json
│       └── src/
│           ├── config/
│           │   ├── base-schemas.ts
│           │   ├── schemas.ts
│           │   ├── i-planets-gang.ts
│           │   └── test.ts
│           ├── middleware/
│           │   ├── error-handler.ts
│           │   ├── logger.ts
│           │   ├── promisify.ts
│           │   └── validation.ts
│           ├── utils/
│           │   ├── errors.ts
│           │   └── validateSchema.ts
│           ├── constants.ts
│           ├── db.ts
│           ├── index.ts
│           ├── router.ts
│           └── ...
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── tsconfig.react.json
├── README.md
├── ARCHITECTURE.md
├── eslint.config.js
├── .gitignore
└── package-lock.json
```

## Server runtime model

The API entrypoint is `apps/server/src/index.ts`.

- `express.json()` parses request bodies.
- `loggerMiddleware` logs incoming requests.
- `createSchemasRouter()` mounts at `/api/schemas`.
- `createNotesRouter()` mounts at `/api/notes`.
- `notFoundMiddleware` and `errorHandlerMiddleware` handle unmatched routes and failures.
- `ensureStoreExists()` initializes `apps/server/store.json` before listening.

Key server files:

- `apps/server/src/index.ts`: app bootstrap and server startup
- `apps/server/src/router.ts`: route definitions for notes and schema metadata
- `apps/server/src/db.ts`: read/write operations for the backing JSON store
- `apps/server/src/config/schemas.ts`: schema registry for note types
- `apps/server/src/middleware/validation.ts`: request-body validation
- `apps/server/src/utils/validateSchema.ts`: runtime schema validation
- `apps/server/src/utils/errors.ts`: shared HTTP error helpers
- `apps/server/src/constants.ts`: note-type constants and shared values

## Client runtime model

The frontend entrypoint is `apps/client/src/main.tsx` and the app shell is `apps/client/src/App.tsx`.

- `Dashboard` is the primary feature screen.
- `useSchemas()` and `useNotes()` load data from the server into Zustand state.
- `useModal()` and `useSnackbar()` manage shared UI interactions.
- `src/api/*.ts` centralize fetch calls and JSON handling.
- `src/store/index.ts` stores modal, snackbar, schema, and note state.

Key client files:

- `apps/client/src/App.tsx`: app shell and global modal/snackbar UI
- `apps/client/src/pages/Dashboard/Dashboard.tsx`: dashboard bootstrap and note loading
- `apps/client/src/api/index.ts`: reusable `fetch` wrapper with default headers/error handling
- `apps/client/src/api/notes.ts`: CRUD helpers for `/api/notes`
- `apps/client/src/api/schemas.ts`: schema metadata fetch helper
- `apps/client/src/store/index.ts`: application state containers
- `apps/client/src/types/index.ts`: shared TypeScript interfaces (e.g. `NoteRecord`, `SchemaDescriptor`)

## Request flow

1. The client loads schema metadata and notes from the API.
2. `apps/client/src/api/index.ts` issues requests with `fetch` and consistent JSON parsing.
3. `apps/server/src/router.ts` validates and routes requests by path and method.
4. `createNotesRouter()` validates note payloads using Zod-based schema definitions.
5. `apps/server/src/db.ts` reads or writes `apps/server/store.json`.
6. Results are returned as JSON with standard HTTP status codes.

## Data model

Notes are stored as structured JSON objects with at least:

- `id`
- `planet`
- `date`
- `type`
- additional dynamic fields that vary by note kind

Schemas are also exposed by the API so the UI can render fields dynamically instead of hardcoding every note type.

## Validation and schema system

The server validates incoming data using Zod and per-note schemas:

- `apps/server/src/config/base-schemas.ts`: reusable primitive and shared field definitions
- `apps/server/src/config/schemas.ts`: note-specific schema registry and descriptor generation
- `apps/server/src/middleware/validation.ts`: middleware that checks payload shape before route logic runs
- `apps/server/src/utils/validateSchema.ts`: helper to parse and validate a request body against a schema

This allows the client to request schema metadata from `/api/schemas` while keeping backend validation strict.

## Conventions

- TypeScript is used across both apps.
- The repo is organized as a monorepo with separate package manifests per app.
- State management is centralized in client-side Zustand stores.
- The API uses file-backed persistence instead of a database.
- The client is organized by feature and responsibility (`api`, `hooks`, `pages`, `components`, `store`, `types`).

## Commands

From the repo root:

- `npm run dev` — start the API and client together
- `npm run build` — build both apps
- `npm run typecheck` — run TypeScript checks for both apps
- `npm run lint` — lint the workspace
- `npm run format` — format files with Prettier

## Notes

This is intentionally a small MVP structure. It favors clarity and explicit file ownership over broad abstraction, while keeping the API and UI neatly separated by package and by responsibility.
