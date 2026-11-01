# Verification tools

The shared catalog is `public/tool-catalog.json`. It contains the version, all tool definitions, categories, archive states, board order, sizes, spacing, and removals. Browser-local settings do not override the published catalog. Runtime input values and generated results are not saved to this file.

## Edit locally

1. Run `npm install`, then `npm run dev`.
2. Open `/tools/` and choose **Manage tools**, or open `/create-tool`. The root `/` is the public landing page.
3. Create categories, edit tools, and arrange boards. **Save tool** and **Save changes** write the complete catalog to `public/tool-catalog.json`. Category creation saves immediately. Element deletions and board removals are included when you save their draft; Discard does not change the file.
4. Commit the JSON file with your app before publishing.

Existing browser data can be moved into an empty JSON catalog using **Import browser tools**. Open the same local origin (hostname and port) where you created the old tools. The import preserves IDs and layouts and leaves the old browser copy intact. It refuses to overwrite a nonempty catalog.

The development server provides a same-origin file API at `/__catalog`. Writes are serialized, replace the file atomically, and use revision checks. A stale tab receives an error instead of overwriting newer changes. Keep the local development server private; it is an authoring tool, not a production backend.

## Publish to GitHub Pages

Run `npm install`, then `npm run deploy`. The `predeploy` script builds the app automatically, and `gh-pages` publishes the contents of `dist/`, including `tool-catalog.json`, to the `gh-pages` branch of `origin`. Your Git credentials must have write access to the repository.

In [repository Settings → Pages](https://github.com/jisiezie01/verification-tools/settings/pages), select **Deploy from a branch**, choose **gh-pages** and **/ (root)**, then click **Save**. After GitHub finishes deployment, open https://jisiezie01.github.io/verification-tools/.

Vite automatically uses `/verification-tools/` for production builds and `/` for local development. The static landing page is at `/verification-tools/` and the React workspace at `/verification-tools/tools/`. The build emits real HTML entry files for the workspace, every catalog tool URL, and authoring redirects, so direct links and refreshes work on GitHub Pages without server rewrites. Legacy `#/tools` links redirect to the new URLs. Rebuild and redeploy after adding tools. To publish later updates, run `npm run deploy` again.

The published app is read-only for tool definitions and layouts; visitors can still use the tools. Authoring routes redirect to the tools page. Every fresh page load fetches the deployed JSON without using a local-storage catalog. To publish an update, save locally, rebuild, and redeploy. Already-open pages show the new catalog after refresh. There is no production write endpoint and no live cross-device editing.

## Verification

- `npm test`: unit and file API tests, including failures, conflicts, and migration.
- `npm run build`: TypeScript and production build.
- `npm run lint`: lint checks.
- Browser suites: `npm run test:browser`, `npm run test:manage-browser`, and `npm run test:tools-browser`. Run sequentially against a local dev server on port 5173 and an isolated Chromium profile with debugging port 9223. These temporarily seed `public/tool-catalog.json` and restore it afterward; do not edit the catalog concurrently.

## Landing page and search

`index.html` contains the complete static landing page, styled by `src/landing.css`, using the screenshots in `public/assets`. It works without JavaScript and without loading the catalog. `tools/index.html` loads the React application. The landing page includes a canonical URL, description, Open Graph/Twitter preview metadata, and WebSite/SoftwareApplication structured data. Workspace pages are marked noindex; the landing page is the search entry point.

`npm run build` generates `dist/sitemap.xml`, `.nojekyll`, and static app route entries with `scripts/build-pages.mjs`. Submit `https://jisiezie01.github.io/verification-tools/sitemap.xml` in Search Console after deployment. If the repository owner or name changes, update the canonical/social/structured-data URLs, build base, sitemap URL, and custom 404 links. A project-level robots.txt cannot control the domain's crawlers, so none is added.

`node tests/landing.browser.mjs` checks the production output with a strict static server under `/verification-tools/`, including desktop/mobile layouts, no-JavaScript content, images, FAQ interactions, workspace links, direct tool URLs, and legacy links. It uses the isolated browser on debugging port 9223 and does not modify the catalog.
