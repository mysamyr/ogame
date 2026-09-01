# Copilot Instructions

## Tech Stack & Structure

- **Monorepo (NPM Workspaces)**: `@ogame/client` (Vite, React 19, React Router 7, Zustand 5, React Hook Form 7, TanStack
  Table 9) & `@ogame/server` (Express 5, Node 24+, SQLite 3 via `sqlite3`, Zod 3).
- **Database**: SQLite3 (`store.db` at root) initialized inside `services/db.ts`.
- **Styling**: **CSS Modules** (`*.module.css`) and `/apps/client/public/style.css`. Utility CSS frameworks (e.g., Tailwind) and inline CSS are strictly
  prohibited.
- **Imports (ESM)**: Local imports **MUST** end in `.js` (e.g., `import x from './x.js'`) per
  `"moduleResolution": "NodeNext"`.

## API & Data Patterns

- **Client Calls**: Managed in `api/index.ts` via custom `Api` fetch client. Throws `Error` with server `message` on
  non-2xx responses.
- **Server Handlers**: Router functions **MUST** wrap async callbacks in `promisify` middleware to route uncaught
  rejections to the global error handler.
- **Validation**: POST/PUT routes **MUST** validate bodies with Zod schemas. On fail, throw `ValidationError` to be
  captured and serialized by `errorHandlerMiddleware`.
- **Data Access**: SQL execution is prohibited in routers. Queries belong strictly in `stores/` using promisified SQLite
  database wrappers `run()`, `list()`, or `get()`.

## Code Conventions & Constraints

### Import Ordering (ESLint Enforced)

Imports **MUST** be alphabetized (ascending, case-insensitive) and grouped in this exact order (with empty line breaks
between groups):

1. React / React DOM
2. `builtin` Node modules
3. `external` NPM packages
4. `internal` workspace paths
5. `parent` paths (`../`)
6. `sibling` paths (`./`)
7. `index` files (`./index.js`)

### Do's

- **Do**: Wrap Zustand store queries with `useShallow` to prevent redundant component re-renders.
- **Do**: Encapsulate raw Zustand stores inside domain-specific React hooks (e.g., `useNotes()`, `useSchemas()`).
- **Do**: Prefix unused function arguments with an underscore (e.g., `(_req, res)`).
- **Do**: Maintain isolated TypeScript typings (`apps/server/src/types/index.ts` and `apps/client/src/types/index.ts`).

### Don'ts

- **Don't**: Import `sqlite3` directly outside of `services/db.ts`.
- **Don't**: Use inline CSS styles or inject global class names.
- **Don't**: Omit the `.js` extension on local TypeScript relative imports.

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
