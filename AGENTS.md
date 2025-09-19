# Repository Guidelines

## Project Structure & Module Organization
The Next.js app lives in `src/app`, split into route groups such as `(admin)` and feature folders like `tickets`. Shared UI primitives sit in `src/components`, with design tokens under `src/components/ui`. Reusable logic and integrations belong in `src/lib`, while TypeScript contracts go in `src/types`. Static assets (fonts, media, icons) stay in `public/`. Update `next.config.ts` or `components.json` when you introduce new build-time or design system settings.

## Build, Test, and Development Commands
Use `pnpm dev` for the local dev server with Turbopack reloading. Ship-ready bundles come from `pnpm build`, and `pnpm start` serves the compiled output. Run `pnpm lint` to execute Biome static analysis, and `pnpm format` to apply repository formatting rules before opening a pull request.

## Coding Style & Naming Conventions
Write features in TypeScript (`.tsx` or `.ts`) with module path aliases (`@/`) defined in `tsconfig.json`. Follow 2-space indentation, camelCase for variables/functions, PascalCase for components, and kebab-case for files under `app/` that map to routes. Prefer functional components and keep client/server boundaries explicit via the Next.js `"use client"` directive. Let Biome manage imports and spacing—avoid manual overrides unless justified.

## Testing Guidelines
An automated test suite is not yet configured. When adding tests, colocate them beside the implementation (e.g., `component.test.tsx`) or propose a shared `src/__tests__` directory in your PR. Document manual verification steps in the PR description and aim for coverage on critical flows such as authentication, ticket purchase, and navigation transitions.

## Commit & Pull Request Guidelines
Follow the existing short, imperative commit style (e.g., `fix navbar mobile`). Group related changes together, reference issue IDs in the body, and avoid mixing refactors with feature work. Pull requests should outline the motivation, the key changes, screenshots or recordings for UI updates, and any follow-up tasks. Confirm linting has passed, list testing evidence, and flag required environment variables (e.g., Clerk or Midtrans keys) so reviewers can validate locally.

## Environment & Configuration Tips
Secrets belong in `.env.local`; never commit them. Provision and share `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` when enabling Cloudflare Turnstile, plus Clerk and Midtrans credentials. Update `.env.example` with placeholders for every new variable. Document any migrations or third-party webhooks in your PR to keep reviewers aware of external steps.
