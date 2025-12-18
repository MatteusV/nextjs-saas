# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router routes and layouts (e.g., `app/login/page.tsx`, `app/layout.tsx`).
- `components/`: Reusable UI and feature components.
  - `components/ui/`: shadcn/ui + Radix primitives (generated components).
- `hooks/`: Shared React hooks (e.g., `hooks/use-toast.ts`).
- `lib/`: Small utilities and API helpers (see `lib/utils.ts`, `lib/api.ts`).
- `public/`: Static assets (icons, placeholders).
- `styles/` and `app/globals.css`: Global styling (Tailwind).

Use the path alias `@/*` (configured in `tsconfig.json`) for imports, e.g. `import { cn } from "@/lib/utils"`.

## Build, Test, and Development Commands
This repo uses Next.js + TypeScript and is typically run with pnpm (see `pnpm-lock.yaml`).
- `pnpm dev`: Start local dev server.
- `pnpm build`: Production build.
- `pnpm start`: Run the production server after `build`.
- `pnpm lint`: Run ESLint across the workspace.

## Coding Style & Naming Conventions
- Language: TypeScript + React (`.ts`/`.tsx`). Prefer functional components and hooks.
- Indentation: 2 spaces in TS/TSX/JSON.
- Naming: `PascalCase` for components, `camelCase` for functions/vars, `kebab-case` for route folders under `app/`.
- Keep UI primitives in `components/ui/` consistent with shadcn patterns; prefer composing existing primitives over introducing new one-off styles.

## Testing Guidelines
No test runner is configured yet (no `__tests__/` or test scripts). If you add tests, keep them close to the feature (e.g., `components/<name>.test.tsx`) and add a `test` script to `package.json`.

## Commit & Pull Request Guidelines
- Git history currently contains an initial bootstrap commit from v0 (“Initialized repository for chat …”).
- For new commits, use a simple Conventional Commits style: `feat:`, `fix:`, `chore:`, `refactor:`.
- PRs: include a short description, link relevant issues, and add screenshots/GIFs for UI changes. Note that v0.app deployments may sync changes into this repo; avoid force-pushing shared branches.

## Security & Configuration Tips
- Do not commit secrets. Use `.env` for local configuration and document required variables in PR descriptions when introducing new ones.
