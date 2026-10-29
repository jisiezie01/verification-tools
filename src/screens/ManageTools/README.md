# Manage tools

`/manage-tools` loads the categories and tools saved by `/create-tool`. It saves to the shared `public/tool-catalog.json` file through the local development API and does not seed example data. The added fields in `src/types/index.ts` are optional, so previously saved tools and categories can be imported from browser storage into an empty catalog using the import button.

## Board and category data

`ToolCategoryType` now optionally carries `archived` and `board`. `ToolType` optionally carries `archived`. An absent archive flag means active.

`ToolCategoryBoardType` stores:

- `direction`: `row`, `column`, `row-reverse`, or `column-reverse`.
- `wrap`: `wrap`, `nowrap`, or `wrap-reverse`.
- `gap`: spacing in pixels.
- `placements`: ordered `ToolBoardPlacementType` records with a tool ID and optional pixel width/height.
- `removedToolIds`: tools explicitly removed from the board.

Existing active tools are placed automatically in a wrapping row. Saved order and sizes are restored. Newly created active tools appear automatically; explicitly removed tools stay in the sidebar. Removed or moved-to-another-category tool IDs are filtered from the current board.

The board uses flex flow rather than absolute coordinates. Drag a tool's grip to change its order, or use its earlier/later buttons. Drop onto either half of a card to insert before or after it. Sidebar tools can be dragged onto a card or onto board whitespace, or added with a button.

Resizing uses pointer capture and supports arrow keys. Rendered content is measured with ResizeObserver and an inert DOM probe. Cards cannot shrink below the intrinsic width of their controls or the height of their current contents. Generated outputs and validation messages can expand these minimums. Default widths adapt to a small viewport; intentionally wider cards scroll within the board. “Fit content” clears the requested size. Using a tool does not mark the board as edited.

The sidebar lists only tools that are off the board, in active and archived groups. Removing a tool does not archive or delete it. Archiving removes it from the board; restoring with “Restore & add” or a drag makes it active and places it back on the board. Category archiving is reversible, and archived categories remain accessible through muted navigation buttons.

Category changes and tool archive changes stay in the draft until saved. `saveCategoryDraft` validates and persists them while preserving unrelated categories and tool definitions. If a storage write fails, the previous values are restored where possible and the draft remains available. Input values and generated output are never saved into the layout or tool definition.

## Navigation and unsaved changes

Category selection is reflected in `/manage-tools?category=<id>`. View opens `/tools/<toolId>`. Edit opens the existing editor at `/create-tool?toolId=<id>`, preserving the tool ID and its archive status. Create opens `/create-tool?categoryId=<id>` with the category selected. The editor includes a Manage tools button and its own unsaved-change protection.

Use tools opens `/tools?category=<id>` with the saved layout and is protected by the same unsaved-change prompt. That screen hides archived categories and tools and omits board editing controls.

`ContainerUnsavedChanges` uses the data router's navigation blocker for category switches, View/Edit/Create links, and browser history navigation. It offers Save and continue, Discard changes, and Stay. A failed or invalid save keeps the prompt open and does not navigate.

While a draft is dirty, `beforeunload` also protects closing, refreshing, and leaving the origin. Browsers control this dialog: it offers their native leave/stay choices, not an application-defined Save button. Stay on the page and use Save changes to persist the draft. Browser restrictions can suppress this prompt without prior interaction or during mobile process termination. See the [browser beforeunload documentation](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event).

## Tool renderer

Use `<ToolRenderer tool={tool} className="..." />` to render a saved `ToolType`. Each instance owns its inputs, output snapshots, validation, and visibility. Reordering or resizing does not reset these values. A different tool definition resets the instance. Nested containers and all existing element discriminants are supported.

The board also wraps placed tools in `ContainerCategoryRuntime`, allowing tools marked Global in the editor to publish inputs to other tools in this category. Removing or archiving a source makes its variables unavailable; restoring it makes them available again. Restoring tools cannot introduce duplicate active Global variable names. See [the tools workspace](../Tools/README.md) for the shared-variable contract.

Text formatting is applied on blur and before generation/copy. Phone inputs format progressively and retain at most ten digits. Email, phone, number, and date validation appears below the input; empty optional inputs remain valid. Today fills the local date when it is within the configured limits.

Generated text follows the editor's default-template and ordered-condition contract. Number comparisons are numeric, dates compare calendar days, and radio comparisons use option values. Empty inputs do not match conditions. Input values are inserted as plain text in one pass; templates never execute JavaScript or HTML. Invalid values prevent generation until corrected.

Generate shows a snapshot of its linked output. Copy visibility follows its target configuration; clipboard success triggers the configured alert, and clipboard failures are shown in the tool. Reset clears all inputs and selections, clears every output, and hides outputs and linked conditional copy buttons. Runtime actions are scoped to that tool instance.

## Checks

- `npm run build`
- `npm run lint`
- `npm test`
- `npm run test:browser` for the create-tool editor.
- `npm run test:manage-browser` for the board and live renderer.

Browser checks require a dev server at `127.0.0.1:5173` and a separate Chromium profile with remote debugging at `9223`. They use native Chrome DevTools Protocol, require no new libraries, seed only the test profile's storage, and write ignored screenshots under `.artifacts/`.
