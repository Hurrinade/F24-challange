# File Browser

File Browser is a small unauthenticated Dropbox-style file browser built with
React, TypeScript, Vite, Convex, Tailwind CSS, and shadcn UI.

Users can create nested folders, create files by uploading real PDF or
plain-text files, browse folders, delete files or folder trees permanently,
search files by exact filename, and get filename-prefix suggestions while
typing.

## Prerequisites

- Node.js 20 or newer.
- npm.
- Docker, only if you want to run the development container.
- A static frontend host for production, such as Vercel, Netlify, Cloudflare
  Pages, or any static server with SPA fallback support.

Reviewers do not need Convex account access for the default setup. The app uses
the shared deployed Convex backend configured in `.env.example` and the
Dockerfile.

Install dependencies:

```bash
npm install
```

## Environment setup

Create `.env.local` from `.env.example`:

```dotenv
VITE_CONVEX_URL=https://enduring-cardinal-769.eu-west-1.convex.cloud
```

`VITE_CONVEX_URL` is required by the browser app and points to the shared Convex
deployment used for this interview project.

If you want to run against your own Convex project instead of the shared
interview backend, create a Convex project, deploy the functions in `convex/`,
and replace `VITE_CONVEX_URL` with your own Convex client URL.

## Debug-mode development

Run Vite in another terminal:

```bash
npm run dev
```

The application routes are:

- `/` for the virtual root folder.
- `/folders/:folderId` for a selected folder.
- `?selectedFile=<entryId>` is used only to highlight a file after search
  navigation.

## Quality checks and build

```bash
npm run lint
npm run typecheck
npm run format:check
npm run check
npm run build
```

`npm run check` is non-mutating and runs lint, typecheck, and Prettier check.
No automated test files are currently included.

## VS Code debugging

The repository includes `.vscode/launch.json` with a Chrome launch profile named
`Debug Vite app`.

Start the debug tools first:

```bash
npm run dev
```

Then run the VS Code `Debug Vite app` profile. It opens
`http://localhost:5173` and maps browser source files to `src`.

## Optional development Docker

Docker is optional and development-only in this project. Convex is not
containerized; the Docker setup runs the Vite development server with the shared
interview Convex deployment at
`https://enduring-cardinal-769.eu-west-1.convex.cloud`.

Build and run directly:

```bash
docker build -t file-browser .
docker run --rm -p 5173:5173 -v "$PWD:/app" -v /app/node_modules file-browser
```

Or run with Docker Compose:

```bash
docker compose up --build
```

Open the containerized app at `http://localhost:5173`.

The Dockerfile includes the shared interview Convex URL by default. The Compose
service mounts the project into the container so local source edits are visible
to Vite without rebuilding the image. Vite file watching is configured in
`vite.config.ts` with polling so hot reload works reliably through the Docker
bind mount.

## Convex data model

Convex is the only persistence layer. Files use Convex File Storage for content
and the `entries` table for metadata.

`entries` stores:

- `name` and `normalizedName`
- `kind: "folder" | "file"`
- `parentId`, where `null` means the virtual root
- optional file upload metadata: `storageId`, `mimeType`, and `size`

Sibling names are unique case-insensitively across files and folders. Root is
virtual and is never stored as an entry.

## File behavior

- Folder creation validates names and rejects invalid or duplicate siblings.
- File creation is handled through real uploads. Upload accepts only
  `application/pdf` and `text/plain`.
- Uploaded files must be 5 MB or smaller.
- Empty folders show a visible drop zone.
- Non-empty folders still accept drag-and-drop across the workspace.
- Deleting a folder deletes its descendants.
- Deleting a file also deletes its Convex storage object through the entry
  trigger.

## Sample upload files

The repository includes `sample-upload-files/` with 15 small `.txt` files for
manual upload and search testing.

To test uploads:

1. Start the app with `npm run dev` or `docker compose up --build`.
2. Open `http://localhost:5173`.
3. Create or open a folder.
4. Drag files from `sample-upload-files/` into the folder drop zone, or use the
   upload button and select the sample `.txt` files.
5. Type prefixes such as `file-0`, `file-1`, or `file-` to verify top-10
   suggestions.
6. Submit an exact file name such as `file-01.txt` to verify exact-name search.

## Search behavior

Search targets file names only. Folder-name search is out of scope.

- Suggestions search by filename prefix and return up to 10 files.
- Submitted search returns files with the exact submitted filename.
- Scope can be the current folder or all files.
- Current-folder scope searches direct files only, not descendants.
- Suggestions are debounced and skipped while the popover is closed or the input
  is empty.

## Production deployment

Build the frontend:

```bash
npm run build
```

Deploy the generated `dist` directory to a static host.

The production frontend environment must include:

```dotenv
VITE_CONVEX_URL=https://enduring-cardinal-769.eu-west-1.convex.cloud
```

Configure the host with SPA fallback so unknown routes serve `index.html`. This
is required for `/folders/:folderId` to work on refresh.

## Known exclusions

This challenge-scale app intentionally does not include authentication, users,
ownership, permissions, sessions, sharing, quotas, trash/restore, rename, move,
file versioning, mobile-specific layout work, or enterprise-scale background
deletion jobs.
