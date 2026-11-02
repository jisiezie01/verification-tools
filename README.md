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

Every push to `master` automatically publishes the app through [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml). The workflow uses Node.js 24, installs the locked dependencies with `npm ci`, runs lint and tests, builds the app, and deploys `dist/` (including `tool-catalog.json`) to GitHub Pages. Failed checks stop deployment.

In [repository Settings → Pages](https://github.com/jisiezie01/verification-tools/settings/pages), the **Build and deployment → Source** must be **GitHub Actions**. The `github-pages` environment must allow deployments from `master`. The workflow uses GitHub's built-in token; no deployment secret is needed. See [GitHub's custom workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

Commit your changes and push to `master`, then follow **Deploy to GitHub Pages** in the repository's [Actions tab](https://github.com/jisiezie01/verification-tools/actions). Once the workflow is on GitHub, you can also choose **Run workflow** on `master` to redeploy manually. The existing `npm run deploy` script writes to the legacy `gh-pages` branch and is not used by this workflow.

Vite automatically uses `/verification-tools/` for production builds and `/` for local development. The static landing page is at https://jisiezie01.github.io/verification-tools/ and the React workspace at `/verification-tools/tools/`. The build emits real HTML entry files for the workspace, every catalog tool URL, and authoring screens, so direct links and refreshes work on GitHub Pages without server rewrites. Legacy `#/tools` links redirect to the new URLs. After adding tools, commit the updated catalog and push to `master` to publish it.

The published app includes a temporary demo of Manage tools and the visual editor. Visitors can create categories and tools, edit existing tools, arrange boards, and use their results. Save applies validated changes only to the current page's in-memory catalog, with no server writes or browser storage. Navigation within the app keeps the demo changes; refreshing, closing the tab, or leaving the app restores the published catalog on the next load. A notice and save messages explain this behavior. Every fresh page load fetches the deployed JSON. To publish an update, save locally, commit, and push to `master`. Already-open pages show the new catalog after refresh. There is no production write endpoint and no live cross-device editing.

## Verification

- `npm test`: unit and file API tests, including failures, conflicts, and migration.
- `npm run build`: TypeScript and production build.
- `npm run lint`: lint checks.
- Browser suites: `npm run test:browser`, `npm run test:manage-browser`, and `npm run test:tools-browser`. Run sequentially against a local dev server on port 5173 and an isolated Chromium profile with debugging port 9223. These temporarily seed `public/tool-catalog.json` and restore it afterward; do not edit the catalog concurrently.

## GA4 tool usage

The Google tags in `index.html` and `tools/index.html` initialize property `G-E0HDVB3SYT`. `src/analytics.ts` reuses that tag for custom events in production builds. Workspace tools and individual tool pages report these events:

| Event | When it fires |
| --- | --- |
| `tool_use` | First changed input, successful Generate, or successful Copy in a use cycle. Further typing and actions do not repeat this event until Reset or the tool is reopened. |
| `tool_generate` | Once per successful Generate action, including buttons that generate multiple outputs. Invalid inputs or broken links do not count. |
| `tool_copy` | After a successful clipboard write, including input copy buttons. Failed copies do not count. |
| `tool_reset` | Each Reset action. The next interaction starts a new use cycle. |

Each event includes `tool_id`, `tool_name`, `tool_category_id`, `tool_category`, and `tool_source` (`workspace` or `tool_page`). These identify the tool and its category; they never include entered values, generated notes, copied text, or templates. Metadata strings are limited to 100 characters. IDs remain stable when tools are renamed. `tool_use` counts starts of use cycles, not completed tasks or unique visitors.

Loading a board, editing tool definitions, and using Manage tools previews do not send these custom events. `npm run dev` also disables custom usage events; the existing HTML Google tags still control their own automatic events. Custom events run in production builds, including `npm run preview`. The tools continue working if analytics is unavailable.

### View which tools are used

1. Commit the updated code and push to `master`; wait for the GitHub Pages workflow to finish.
2. In GA4, select the property for `G-E0HDVB3SYT`, then open **Admin → Data display → Custom definitions → Create custom dimensions**. Create the following dimensions with **Scope = Event**. Enter the parameter names exactly:

   | Dimension name | Event parameter |
   | --- | --- |
   | Tool name | `tool_name` |
   | Tool category | `tool_category` |
   | Tool ID | `tool_id` |
   | Tool category ID | `tool_category_id` |
   | Tool source | `tool_source` |

3. Open **Explore → Free form**. Import **Tool name**, **Tool category**, and **Event name** as dimensions, plus **Event count** and **Total users** as metrics. Put Tool name in Rows, the metrics in Values, and filter **Event name exactly matches `tool_use`**. Sort Event count descending to see the most-used tools. Use Tool ID to group across name changes, or filter `tool_generate` / `tool_copy` to compare completed actions.
4. New custom dimensions can take 24–48 hours to become available in reports. To verify immediately, use a tool on the deployed site and check **Reports → Realtime** for `tool_use`, `tool_generate`, and `tool_copy`. For parameter inspection, connect the deployed URL through [Google Tag Assistant](https://tagassistant.google.com/) and open **Admin → Data display → DebugView**.

These custom definitions must be created in GA4; deploying the code does not create them. See Google's [custom event setup](https://developers.google.com/analytics/devguides/collection/ga4/events), [event-scoped dimension instructions](https://support.google.com/analytics/answer/14239696), and [DebugView guide](https://support.google.com/analytics/answer/7201382).

For automated verification, run `npm run build`, start an isolated Chromium browser with debugging port 9223, then run `npm run test:analytics-browser`. The suite serves the production build on port 4176 with an in-memory fixture, blocks Google Analytics network requests, and checks the real `gtag` queue without changing the catalog or sending test data to GA4.

## Landing page and search

`index.html` contains the complete static landing page, styled by `src/landing.css`, using the screenshots in `public/assets`. It works without JavaScript and without loading the catalog. `tools/index.html` loads the React application. The landing page includes a canonical URL, description, Open Graph/Twitter preview metadata, and WebSite/SoftwareApplication structured data. Workspace pages are marked noindex; the landing page is the search entry point.

`npm run build` generates `dist/sitemap.xml`, `.nojekyll`, and static app route entries with `scripts/build-pages.mjs`. Submit `https://jisiezie01.github.io/verification-tools/sitemap.xml` in Search Console after deployment. If the repository owner or name changes, update the canonical/social/structured-data URLs, build base, sitemap URL, and custom 404 links. A project-level robots.txt cannot control the domain's crawlers, so none is added.

`node tests/landing.browser.mjs` checks the production output with a strict static server under `/verification-tools/`, including desktop/mobile layouts, no-JavaScript content, images, FAQ interactions, workspace links, direct tool URLs, and legacy links. It uses the isolated browser on debugging port 9223 and does not modify the catalog.
