READ ~/Projects/agent-scripts/AGENTS.MD BEFORE ANYTHING (skip if missing).

# Repository Guidelines

## Project Structure & Module Organization
The Vite + React + TypeScript client lives in `src/`. Feature screens sit in `src/pages` and `src/presentation`, reusable UI in `src/components`, and domain/data layers in `src/domain`, `src/services`, and `src/repositories`. Shared state belongs in `src/contexts`, `src/stores`, and `src/hooks`. Styling assets live in `src/styles` and `src/assets`, with Tailwind tokens defined in `tailwind.config.ts`. Tests reuse helpers under `src/test`. Automations stay in `scripts/` and `worker/`, Appwrite tooling in `appwrite-migration/`, and Supabase schema files in `supabase/`. Deep dives and onboarding notes reside in `docs/`—start with `docs/architecture.md` and `docs/dev-guides/`.

## Build, Test, and Development Commands
- `npm run dev` — start the Vite dev server.
- `npm run build` / `npm run preview` — create and serve the production bundle in `dist/`.
- `npm run lint` — apply the ESLint + TypeScript ruleset.
- `npm run test`, `npm run test:watch`, `npm run test:coverage` — run Vitest suites once, in watch mode, or with coverage output.
- `npm run generate` — scaffold feature assets with `scripts/dev.js`.
- `npm run db:migrate` — update Appwrite collections; mirror any SQL in `supabase/migrations`.

## Coding Style & Naming Conventions
Use two-space indentation and ES module syntax. Components, contexts, and stores use PascalCase filenames (`TournamentDashboard.tsx`); hooks follow `useThing.ts`. Utilities keep lowercase hyphenated folder names for consistency. Styling leans on Tailwind classes; extend tokens in `tailwind.config.ts` rather than inline hex values. Prefer the `@/` alias from `tsconfig.json` for cross-feature imports.

## Testing Guidelines
Vitest with Testing Library covers unit and integration tests. Co-locate specs as `<Component>.test.tsx` or group larger scenarios in feature-level `__tests__`. Load the shared setup from `src/test/setup.ts` and `src/test/utils.ts`. Mock external calls to Appwrite, Supabase, and network APIs so results stay deterministic. Run `npm run test:coverage` before PRs that touch critical flows, and mention any skipped areas.

## Commit & Pull Request Guidelines
Follow the prevailing Conventional Commit style (`feat:`, `fix:`, `chore:`) with subjects under 72 characters and contextual body text. PRs should link issues, outline testing performed, attach UI screenshots when relevant, and call out migrations or scripts reviewers must run (`npm run db:migrate`, Supabase SQL). Capture follow-up work as tasks or linked tickets rather than burying it in review threads.

## Documentation & Knowledge Base
The `docs/` folder hosts product and technical references. `docs/CourtMaster_PRD_Updated.md` maps requirements, `docs/architecture.md` explains data flow, and `docs/dev-guides/` houses deployment and integration playbooks. Update these alongside feature changes so newcomers can trust the documentation.
