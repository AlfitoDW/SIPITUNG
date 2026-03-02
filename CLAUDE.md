# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Tech Stack

**Backend:** Laravel 12, PHP 8.2+, Eloquent ORM, Laravel Fortify (auth)
**Frontend:** React 19, TypeScript (strict), Vite 7
**Bridge:** Inertia.js (server-side routing with client-side reactivity — no REST API calls from frontend)
**UI:** shadcn/ui (New York style), Radix UI, Tailwind CSS 4
**Database:** SQLite (dev) / MySQL (prod)
**Path alias:** `@/*` → `resources/js/*`

## Development Commands

### Backend
```bash
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve                # localhost:8000
```

### Frontend
```bash
npm install
npm run dev                      # Vite dev server, localhost:5173
npm run build                    # Production build
npm run build:ssr                # Build with SSR support
npm run lint                     # ESLint with auto-fix
npm run format                   # Prettier formatting
npm run types                    # TypeScript type-check only
```

### Run everything concurrently
```bash
composer run dev                 # Laravel + Vite + queue + pail log viewer
composer run dev:ssr             # Same with SSR support
```

### Testing
```bash
composer test                    # PHPUnit/Pest + lint
php artisan test                 # Tests only
php artisan test --filter=TestName  # Single test
composer lint                    # PHP linting (Pint)
```

## Architecture

### Inertia.js Data Flow
There is no client-side API layer. All data comes from Laravel controllers as Inertia responses. Forms submit to Laravel controllers via `useForm()` from `@inertiajs/react`. Shared data (auth user, flash messages) is passed via `HandleInertiaRequests` middleware.

### Role-Based Access
Four user roles with separate route prefixes and nav configs:
- `super_admin` → `/super-admin/` routes
- `ketua_tim_kerja` → `/ketua-tim/` routes (data scoped to `tim_kerja_id`)
- `pimpinan` → `/pimpinan/` routes (sub-types: `kabag_umum`, `ppk`)
- `bendahara` → `/bendahara/` routes

Role check helpers on `User` model: `isSuperAdmin()`, `isKetuaTimKerja()`, `isPimpinan()`, `isBendahara()`.

### Navigation System
Navigation is configured per-role in `resources/js/config/navigation/` (e.g., `super-admin.ts`, `ketua-tim.ts`). `AppSidebar` reads `auth.user.role` from Inertia shared props and selects the appropriate nav config dynamically.

### Routing
Routes are defined in `/routes/` per role. Wayfinder generates TypeScript route helpers from PHP routes into `resources/js/routes/index.ts` (auto-generated, do not edit manually).

### Layout Structure
- `AuthLayout` — login/auth pages
- `AppLayout` — authenticated pages with sidebar + header + breadcrumbs

Component tree: `AppShell` → `AppHeader` + `AppSidebar` + `AppContent`

### Authentication (Fortify)
Login authenticates by **username** (not email). Users must have `is_active = true`. 2FA is supported. See `app/Actions/Fortify/` for custom auth actions and `FortifyServiceProvider` for config.

## Key File Locations

| Concern | Path |
|---|---|
| Inertia shared data | `app/Http/Middleware/HandleInertiaRequests.php` |
| Role-based nav configs | `resources/js/config/navigation/` |
| Page components | `resources/js/pages/` |
| Reusable UI components | `resources/js/components/` |
| shadcn/ui components | `resources/js/components/ui/` |
| Laravel routes | `routes/` (web.php + role-based files) |
| Controllers | `app/Http/Controllers/` |
| Models | `app/Models/` |
| Fortify actions | `app/Actions/Fortify/` |
| DB migrations | `database/migrations/` |

## Docker
```bash
docker compose up --build       # Runs migrations, seeds, serves on :8000
```
Do not bind `node_modules` or `vendor` volumes.