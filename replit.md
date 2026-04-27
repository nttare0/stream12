# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Showtime App

Movie, anime, and TV show discovery web app.

- **Frontend**: `artifacts/showtime/` — React + Vite, dark cinematic theme, wouter routing
- **Pages**: Home (featured hero, trending, category rows), Browse (search/filter), Show Detail, Admin dashboard
- **Backend**: `artifacts/api-server/src/routes/shows.ts` + `genres.ts`
- **DB Schema**: `lib/db/src/schema/shows.ts` — `showsTable` with `show_type` and `show_status` enums
- **Seed**: 25 shows fetched from real OMDB API (`OMDB_API_KEY` env var) via `pnpm --filter @workspace/api-server run seed`. Use `-- --force` to re-seed.
- **OMDB Service**: `artifacts/api-server/src/services/omdb.ts` — fetch by IMDb ID/title, search, and map to our schema. Anime is auto-detected via known IMDb IDs or Japanese animation country/genre.
- **API Hooks**: Generated from OpenAPI in `lib/api-client-react/src/generated/api.ts`
