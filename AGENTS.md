# AGENTS.md — ProjectKuliah-API

## Monorepo structure

```
backend/   AdonisJS v6 + TypeScript + PostgreSQL + Lucid ORM (ESM)
frontend/  React 19 + Vite 7 + Tailwind v4 + React Router v7 (JSX, no TS)
```

Both packages are independent (no workspace orchestration). Run commands from each directory.

## Backend commands (run from `backend/`)

| Command | Purpose |
|---|---|
| `npm run dev` | `node ace serve --hmr` — starts at `http://localhost:3333` |
| `npm run build` | `node ace build` — compiles TS to `build/` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (AdonisJS preset) |
| `npm run format` | Prettier |
| `npm run test` | `node ace test` — Japa runner |
| `node ace migration:run` | Run pending Lucid migrations |
| `node ace migration:rollback` | Rollback last batch |
| `node ace seed:admin` | Create/update admin user (admin@example.com / admin12345) |
| `node ace generate:key` | Generate `APP_KEY` |

**Required setup order:** `.env` → `node ace generate:key` → `node ace migration:run` → `node ace seed:admin` → `npm run dev`

Env file must include `FRONTEND_URL` (missing from `.env.example` but required for password reset link).  
Backend expects PostgreSQL; default DB name is `db_Project_Kuliah`.

## Frontend commands (run from `frontend/`)

| Command | Purpose |
|---|---|
| `npm run dev` | Vite dev server at `http://localhost:5173/ProjectKuliah-API/` |
| `npm run build` | `vite build` |
| `npm run lint` | ESLint (JSX rules) |
| `npm run preview` | `vite preview` |

**Vite base path is `/ProjectKuliah-API/`** — all assets and routes are served under this prefix. The `BrowserRouter` uses `basename={import.meta.env.BASE_URL}`.

There is **no TypeScript or typecheck** for frontend — all source files are `.jsx`.

## Testing

Backend tests use **Japa** with plugins `@japa/assert`, `@japa/api-client`, `@japa/plugin-adonisjs`.
- Unit tests: `tests/unit/**/*.spec(.ts|.js)` — timeout 2s
- Functional tests: `tests/functional/**/*.spec(.ts|.js)` — timeout 30s
- Test suites auto-start the HTTP server via `testUtils.httpServer().start()`
- Currently **no test files exist** (only `tests/bootstrap.ts`)

## Backend architecture

### Subpath imports
All internal modules use `#` aliases defined in `package.json` `imports`:
`#controllers/*`, `#models/*`, `#middleware/*`, `#validators/*`, `#services/*`, `#config/*`, `#start/*`, `#tests/*`, `#exceptions/*`, `#database/*`, `#listeners/*`, `#events/*`, `#mails/*`, `#providers/*`, `#policies/*`, `#abilities/*`.

### Route layout (`start/routes.ts`)
- Public: `POST /register`, `POST /login`, `POST /forgot-password`, `POST /reset-password`
- Public (deliberately no auth): `GET /api/files/:id/open`, `GET /api/files/:id/download` (accessed directly by browser), `GET /api/holidays/:year`
- **Auth-protected group** (`prefix: /api`): projects, clients, materials, tasks, progress logs, calendar events, files, reports, activity logs
- Static route ordering matters: `/projects/options` and `/projects/critical` must be declared **before** `/projects/:id`

### Middleware stack (in order)
1. `static_middleware`
2. `container_bindings_middleware`
3. `force_json_response_middleware`
4. `cors_middleware`
5. `bodyparser_middleware` (router-level)

Named middleware: `auth`, `admin`, `can`, `optionalAuth`.  
Permission-based access uses `middleware.can(['action', 'resource'])` where action is `read`/`write`/`delete` and resource is e.g. `projects`, `materials`, `clients`, `files`, `calendar-events`, `reports`.

### Hot-reload boundaries
Only `app/controllers/**/*.ts` and `app/middleware/*.ts` trigger HMR (configured in `package.json` `hotHook.boundaries`).

### Key quirks
- **Password hashing is automatic** via User model hook — controllers must not hash manually.
- **Reset password** creates a 64-char token stored in `password_resets` table (30 min expiry). The `resetUrl` is returned in the API response (no email sending).
- File open/download routes sit **outside** the auth group because browsers fetch them directly (auth headers would be blocked by ad blockers).
- Holidays endpoint is intentionally public (only fetches public holiday data).
- `APP_KEY` is required by AdonisJS core; `JWT_SECRET` is used by the custom JWT implementation (not `@adonisjs/auth`).

## Frontend architecture

### Route structure
- **Public routes** (wrapped in `<PublicRoute>`): `/login`, `/register`, `/forgot-password`, `/reset-password`
- **Protected routes** (wrapped in `<ProtectedRoute>` with `allowedRoles`): all `/admin/*` routes
- Root `/` redirects to `/login`; catch-all `*` also redirects to `/login`
- Auth guards: `PublicRoute` redirects authenticated users to `/admin`; `ProtectedRoute` redirects unauthenticated users to `/login?redirect=<original_path>`

### Admin routes under `<AdminLayout />`
| Path | Component | Exported from |
|---|---|---|
| `/admin` | `AdminDashboard` | `pages/AdminDashboard.jsx` |
| `/admin/projects` | `AdminProject` | `pages/AdminProject.jsx` |
| `/admin/materials` | `StokMaterial` | `pages/StokMaterial.jsx` |
| `/admin/calendar` | `Calendar` | `pages/Calendar.jsx` |
| `/admin/clients` | `ClientManagement` | `pages/ClientManagement.jsx` |
| `/admin/documentation` | `FieldFileUpload` | `pages/FieldFileUpload.jsx` |
| `/admin/laporan` | `Laporan` | `pages/Laporan.jsx` |
| `/admin/users` | `UserManagement` | `pages/UserManagement.jsx` |
| `/admin/notifications` | `Notifications` | `components/Notifications.jsx` |
| `/admin/settings` | `ProfileSettings` | `pages/ProfileSettings.jsx` |

### API layer
Frontend uses **Fetch API** (auth endpoints) and **axios** (other endpoints).  
Base URL from `VITE_API_BASE_URL` env var, defaulting to `http://localhost:3333`.

### Roles
`admin` | `project_manager` | `finance` — enforced both frontend (`ProtectedRoute`) and backend (`can` middleware).

### Deployment
`npm run predeploy` builds and copies `index.html` → `404.html` (for SPA routing on static hosts).  
`npm run deploy` uses `gh-pages`.
