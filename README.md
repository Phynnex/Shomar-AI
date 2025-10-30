# Shomar Security Frontend

Production-ready Next.js scaffold for the Shomar application security platform. The project is wired for a dark-first experience, with a marketing landing page, auth forms, and an initial dashboard view.

## Getting Started

```bash
npm install
npm run dev
```

The app runs at `http://localhost:3000`.

## Tech Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 via the `@import 'tailwindcss';` entry in `app/globals.css`
- Data utilities staged for later wiring: React Query, Axios, Zustand, Recharts, Zod

## Project Structure

- `app/(marketing)` - Landing page and future marketing routes
- `app/(auth)` - Sign-in/sign-up flow wrappers and forms
- `app/(dashboard)` - Authenticated application shell and dashboard overview
- `components/ui` - Reusable UI building blocks (`Button` etc.)
- `lib/utils.ts` - Shared utilities such as `cn`

## Theming

Brand colors and typography tokens live in `app/globals.css`. Dark mode overrides apply when the `dark` class is present on `<html>` (set in `app/layout.tsx`). Update these tokens to evolve the brand system.

## Next Steps

1. Integrate your authentication provider and guard dashboard routes.
2. Connect real API responses for findings/metrics and add charts (Recharts is already listed).
3. Expand the component library (tabs, alerts, tables) for dashboard workflows.
4. Configure CI (lint, type-check, tests) and tailor deployment for your target environment.
