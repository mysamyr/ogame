# Architecture

npm workspaces: `@ogame/client` (Vite, React 19) and `@ogame/server` (Express 5, SQLite). `npm run dev` runs both; Vite proxies `/api` to `localhost:3000`. Types are duplicated per app, not shared.

Users define **schemas** (named field sets) and create **notes** whose extra columns come from the selected schema. Active schema is `?type=<schemaId>`.

## Layout

- `apps/server/src` — `index.ts` (app), `router.ts` (HTTP), `services/db.ts`, `stores/`, `middlewares/`, `scripts/migrate-schemas.ts`
- `apps/client/src` — `api/`, `store/`, `hooks/`, `pages/Dashboard/`, `components/`

## Domain

**Schema:** `{ id, name, fields: [{ id, name, type, required }] }`. `type` is `string | number | boolean | date | time`. `planet` and `date` are always on notes, not in the schema.

**Note:** `{ id, planet, date, type, ...dynamic }`. `type` is the schema id. Dynamic fields live in SQLite as JSON `payload` and are flattened on read. Planet format (client): `^\d:\d{1,3}:(?:[1-9]|1[0-6])$`.

## Server

Listens on **3000**. Logger → JSON → static `public/` → `/api/schemas`, `/api/notes` → 404 → error handler. Handlers use `promisify`. Ids: `` `${Date.now()}-${random}` ``.

**SQLite** `apps/server/store.db`: `notes(id, planet, date, type, payload)`, `schemas(id, name)`, `schema_fields(id, schema_id, name, type, required)`. Schema field updates replace the whole field set.

| Method         | Path               | Notes                                            |
| -------------- | ------------------ | ------------------------------------------------ |
| GET/POST       | `/api/schemas`     | Zod on POST body `{ name, fields[] }`            |
| GET/PUT/DELETE | `/api/schemas/:id` | PUT replaces name + fields                       |
| GET/POST       | `/api/notes`       | GET optional `?date=&planet=` (unused by client) |
| PUT/DELETE     | `/api/notes/:id`   | PUT → 204. Notes are not schema-validated        |

Seed: `npm -w @ogame/server run seed:schemas`.

Zod `ValidationError` → 400 `{ message, fieldErrors }`. Other errors (including `BadRequestError`) typically 500.

## Client

Single `Dashboard` in `BrowserRouter`. Overlays: Zustand snackbar + `<dialog>` modal.

Zustand: snackbar, modal, schemas, notes (`activeNote` = row being edited). Hooks are shallow selectors. Load once on mount; mutations update the store locally.

- **Header** — schema dropdown; New/Edit (`SchemaModal` / `SchemaForm`), Delete (`ConfirmModal`)
- **ActiveForm** — RHF; `planet` + `date` + schema `FieldInput`s; POST/PUT notes
- **NotesBoard / NotesTable** — notes for current `type`; TanStack Table; copy / edit / delete

## Gaps

- Server does not validate notes against schemas or constrain field `type` to `FieldKind`
- Schema delete does not touch notes
- `BadRequestError` status is not applied by the error middleware
- No auth; server does not serve the Vite build
