# Verification tools

The shared catalog is `public/tool-catalog.json`. It contains the version, all tool definitions, categories, archive states, board order, sizes, spacing, and removals. Browser-local settings do not override the published catalog. Runtime input values and generated results are not saved to this file.

## Edit locally

1. Run `npm install`, then `npm run dev`.
2. Open the local address and choose **Manage tools**, or open `/create-tool`.
3. Create categories, edit tools, and arrange boards. **Save tool** and **Save changes** write the complete catalog to `public/tool-catalog.json`. Category creation saves immediately. Element deletions and board removals are included when you save their draft; Discard does not change the file.
4. Commit the JSON file with your app before publishing.

Existing browser data can be moved into an empty JSON catalog using **Import browser tools**. Open the same local origin (hostname and port) where you created the old tools. The import preserves IDs and layouts and leaves the old browser copy intact. It refuses to overwrite a nonempty catalog.

The development server provides a same-origin file API at `/__catalog`. Writes are serialized, replace the file atomically, and use revision checks. A stale tab receives an error instead of overwriting newer changes. Keep the local development server private; it is an authoring tool, not a production backend.

## Publish to GitHub Pages

Run `npm run build` and deploy the contents of `dist/`, including `dist/tool-catalog.json`, using your Pages deployment process. Relative asset paths support a repository subdirectory. Production navigation uses hash routes, for example `/verification-tools/#/tools`, so refreshes work without server rewrites.

The published app is read-only for tool definitions and layouts; visitors can still use the tools. Authoring routes redirect to the tools page. Every fresh page load fetches the deployed JSON without using a local-storage catalog. To publish an update, save locally, rebuild, and redeploy. Already-open pages show the new catalog after refresh. There is no production write endpoint and no live cross-device editing.

## Verification

- `npm test`: unit and file API tests, including failures, conflicts, and migration.
- `npm run build`: TypeScript and production build.
- `npm run lint`: lint checks.
- Browser suites: `npm run test:browser`, `npm run test:manage-browser`, and `npm run test:tools-browser`. Run sequentially against a local dev server on port 5173 and an isolated Chromium profile with debugging port 9223. These temporarily seed `public/tool-catalog.json` and restore it afterward; do not edit the catalog concurrently.
