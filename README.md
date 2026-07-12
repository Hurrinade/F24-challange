# File Browser

File Browser is a small, unauthenticated Dropbox-style file system built with
React, TypeScript, Vite, Convex, Tailwind CSS, and shadcn UI.

PR 1 provides the desktop application shell. File and folder persistence,
browsing, deletion, and search will be added in later PRs.

## Current interface

- `/` renders the File Browser workspace.
- The left folder sidebar starts at 20% width and can be resized between 15% and
  35%.
- The main file area uses the remaining width.
- The existing light, dark, and system theme preferences remain available.
- There are no accounts, sessions, protected routes, or user-specific data.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from `.env.example` and set:

```dotenv
VITE_CONVEX_URL=https://your-deployment.convex.cloud
```

`CONVEX_DEPLOYMENT` is optional and is only used by Convex tooling.

3. Run the frontend in debug mode when developing locally:

```bash
npm run dev
```

## Quality commands

```bash
npm run lint
npm run lint:fix
npm run typecheck
npm run format
npm run format:check
npm run check
npm run build
```

`npm run check` is non-mutating. It runs ESLint, TypeScript, and Prettier in
check mode.

## Project structure

- Route pages live in `src/pages`; `/` remains `src/pages/Root.tsx`.
- Feature components live under matching folders in `src/components`.
- Shared hooks, stores, utilities, components, and types are exposed through
  their root barrel files when needed.
- Convex schema and server functions live in `convex`.
- Project imports use the `@/` alias.

## Current scope

This PR intentionally contains no database schema or file-system behavior. The
ignored local `plan.md` documents the later PR sequence for CRUD, navigation,
search, delivery documentation, and optional Docker support.
