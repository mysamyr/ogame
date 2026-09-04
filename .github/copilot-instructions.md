# Copilot Instructions

## Tech Stack & Structure

- **Monorepo (NPM Workspaces)**: `@ogame/client` (Vite, React 19, React Router 7, Zustand 5, React Hook Form 7, TanStack
  Table 9) & `@ogame/server` (Express 5, Node 24+, SQLite 3 via `sqlite3`, Zod 4).
- **Database**: SQLite3 (`store.db` at root) initialized inside `services/db.ts`.
- **Styling**: **CSS Modules** (`*.module.css`) and `/apps/client/public/style.css`. Utility CSS frameworks (e.g.,
  Tailwind) and inline CSS are strictly prohibited.
- **Imports (ESM)**: Local imports **MUST** end in `.js` (e.g., `import x from './x.js'`) per
  `"moduleResolution": "NodeNext"`.

## API & Data Patterns

- Managed in `api/index.ts` via custom `Api` fetch client. Serializes non-2xx responses via `hydrateApiError`, throwing strongly-typed `AppError` subclasses (e.g., `NotFoundError`, `ValidationError`).
- Standardized error handling contracts live in `@ogame/shared/errors` (`ErrorCode`, `ApiErrorPayload`, `AppError`, domain subclasses, `isApiError`, and `hydrateApiError`).
- Router functions **MUST** wrap async callbacks in `promisify` middleware to route uncaught rejections to the global
  error handler.
- POST/PUT routes **MUST** validate bodies with Zod schemas. On fail, throw `ValidationError` to be captured and
  serialized into standard `ApiErrorPayload` by `errorHandlerMiddleware`.
- SQL execution is prohibited in routers. Queries belong strictly in `stores/` using promisified SQLite database
  wrappers `run()`, `list()`, or `get()`.

## Code Conventions & Constraints

### Import Ordering (ESLint Enforced)

Imports **MUST** be alphabetized (ascending, case-insensitive) and grouped in this exact order (with empty line breaks
between groups). Run `npm run lint:fix` to group and sort imports.

### Do's

- Wrap Zustand store queries with `useShallow` to prevent redundant component re-renders.
- Encapsulate raw Zustand stores inside domain-specific React hooks (e.g., `useNotes()`, `useSchemas()`).
- Prefix unused function arguments with an underscore (e.g., `(_req, res)`).
- Maintain isolated TypeScript typings (`apps/server/src/types/index.ts` and `apps/client/src/types/index.ts`).
- Verify work with `npm run typecheck` and `npm run lint`.

### Don'ts

- Import `sqlite3` directly outside of `services/db.ts`.
- Use inline CSS styles or inject global class names.
- Omit the `.js` extension on local TypeScript relative imports.
- Try to run tests as they are absent.
- Use git.

## Self-Maintenance Rule

**CRITICAL RULE FOR ALL AI AGENTS:**
Whenever you make or assist with global/architectural changes in this repository—such as:

- Creating, modifying, or refactoring shared packages/modules
- Changing API communication protocols, endpoints, or client wrappers
- Updating state management, database schemas, or global contracts
- Adding new global styling libraries or design tokens
- Modifying folder structures or architectural conventions

You **MUST** automatically update this `.github/copilot-instructions.md` file as part of your task to reflect the
updated architecture.
