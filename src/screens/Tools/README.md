# Tools workspace

`/tools` reads the same JSON catalog as `/create-tool` and `/manage-tools`. Select a category with the navigation or `/tools?category=<id>`. The screen uses the manager's board reconciliation rules, including saved order, requested sizes, direction, wrapping, gap, explicit removals, and automatically included new tools. Archived tools and categories are hidden. Unknown or archived category URLs fall back to the first active category.

Tools run through the shared `ToolRenderer`. The screen has no arrangement controls; Manage tools opens the current category's editor. Requested dimensions remain bounded by the rendered content. Both screens use the same measurement hook, and wide tools scroll within the board on small screens. Reloading fetches the deployed JSON; browser local storage does not override the published catalog. Empty and unreadable catalogs have separate states and do not overwrite saved data.

## Global input variables

`ToolType.isGlobal?: boolean` publishes a tool's input values to other tools in its category. Omitted or false keeps inputs local. All input types, including nested inputs, are supported. The Global tool must be active and placed on the current board to provide values.

In `/create-tool`, enable **Global tool**, give its inputs unique variable names, and save. Edit another tool in that category and select generated text. Its variable buttons and condition selector include the saved Global inputs. A local input named `name_input` remains `${name_input}`; the published value is `${global.name_input}`. Two active Global tools cannot publish the same variable name in a category. The same name is allowed in other categories or in local inputs.

`getGlobalInputs` provides virtual input descriptors with their source tool and input IDs. These descriptors are not added to the consumer's saved elements. Global conditions store `sharedInputId(sourceToolId, sourceInputId)` in the existing `TextConditionType.inputId` field. Number, date, and radio comparisons use the same rules as local conditions. `validateTool` and `createSavedTool` accept a catalog of tools as their final optional argument for resolving these references; `saveTool` loads the latest catalog itself.

`ContainerCategoryRuntime` provides shared state to sibling `ToolRenderer` instances. The manager wraps only placed tools, and `/tools` wraps the selected category's placed tools. Global inputs publish changes immediately. Generation applies the source input's normalization and validates shared inputs referenced by that output's default template or rules. Missing sources, ambiguous names, and invalid referenced values show an error rather than generating incomplete text. Unrelated invalid Global inputs do not block generation.

Generated output remains a snapshot until Generate is clicked again. Reset clears only the clicked tool's inputs and outputs. Resetting a Global tool also clears its published values, while resetting a consumer does not affect its sources. Input values and generated text are transient: they are never written to the tool catalog, and switching categories or leaving/reloading the workspace starts a fresh runtime. A standalone `/tools/:toolId` view has no sibling inputs; Open category opens the workspace where shared values can be entered.

Renaming/deleting a published variable, moving its source to another category, or disabling Global can leave other tools with stale references. Their editor reports unresolved variables on save; runtime generation reports an unavailable shared variable. Update their templates or conditions to use the replacement input.

## Container spacing

`ElementContainerType.justifyContent?: "flex-start" | "space-between"` defaults to `space-between` for rows and `flex-start` for columns when unset. Explicit saved alignment takes precedence. **Justify content → Space between** in the builder distributes children along the container's main axis, in both the canvas and live renderer. Gap remains the minimum spacing. A column needs extra height, or a row extra width, for this setting to have a visible effect.

## Validation

Run `npm run build`, `npm run lint`, and `npm test`. `npm run test:tools-browser` checks the saved board, editor settings, shared variables and conditions, isolated resets, absent sources, flex layouts, mobile overflow, and empty/error states. The existing `test:browser` and `test:manage-browser` scripts cover editor and manager regressions. Browser tests require a dev server at `127.0.0.1:5173` and an isolated Chromium profile with remote debugging at `9223`; they add no libraries and only seed that profile's storage.
