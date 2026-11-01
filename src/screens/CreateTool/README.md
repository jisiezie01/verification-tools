# Create tool editor

`/create-tool` edits a `ToolType`. The canvas shows design samples; its controls select elements and do not execute a tool. Saved tools run through `src/components/ToolRenderer` on `/tools`, `/manage-tools`, and `/tools/:toolId`.

The editor uses the existing Button, InputText, InputDate, and InputRadio components and the already installed React DnD HTML5 backend. No dependencies were added.

## Saving and integration

`ScreenCreateTool` accepts optional `initialTool`, `categories`, `className`, and `onSave` props. An `initialTool` is cloned on mount. To switch tools in a mounted editor, give the screen a React `key` matching the tool ID.

```tsx
<ScreenCreateTool
    initialTool={tool}
    categories={categories}
    onSave={async (savedTool: ToolType) => {
        await saveToYourApplication(savedTool)
    }}
/>
```

The editor validates the name, category, element relationships, variable names, limits, and conditional rules before calling `onSave`. A rejected callback displays an error and leaves the draft intact. Editing while an asynchronous save runs keeps the edited draft marked unsaved.

Without `onSave`, `saveTool(tool): Promise<ToolType>` saves to `public/tool-catalog.json` through the local development API and returns an independent snapshot after the write succeeds. Categories and layouts share the same JSON file. Failed writes keep the draft unsaved. Production loads the deployed JSON and enables authoring as a temporary demo. Saves update the in-memory catalog only and reset on refresh, without server writes or browser storage. See the root README for migration and deployment.

`createSavedTool(tool, catalog?): ToolType` validates and creates the same snapshot without storing it. Supply the other saved tools when validating Global references. Download exports that object as JSON. No preview values, selected-element state, React nodes, or executable functions are included.

`InputToolCategory` is reusable and accepts `categories`, `value`, `onChange`, and `onCreate`. Its native dialog supports keyboard focus and Escape, rejects blank or duplicate names, and selects the category after creation.

## Element contract

Every element has `id`, `toolId`, `categoryId`, `style`, and `size`. The saved array is ordered by the visible tree: each container precedes its children, and sibling order is preserved. Root elements omit `containerId`; children refer to their parent container element's ID. Arbitrary nesting is supported; cycles are rejected.

`size.width` is `{ unit: "auto" | "px" | "%", value: number }`. `size.height` uses `auto` or `px` in the editor. `auto` means intrinsic content size and ignores `value`; percentages are relative to the containing content area. `style` holds the user-selected colors and typography. Container `direction`, `gap`, and `padding` are flex layout settings, with gap and padding measured in pixels. New containers start with zero padding. Optional `justifyContent` supports `flex-start` and `space-between` through the Justify content setting. When unset, rows use `space-between` and columns use `flex-start`; explicit alignment is preserved when changing direction.

| Element | Saved behavior |
| --- | --- |
| Generate button | `link` accepts an array of output IDs or a legacy single ID. Select targets in the Linked generated text checklist. All selected templates generate from the same current input values and appear together; an invalid target or input prevents partial updates. Defaults to white text on green. |
| Reset button | `behavior: "clear-all-inputs-and-hide-outputs"` clears every input, unchecks radio selections, and clears/hides all outputs, including nested elements. |
| Copy button | `link` identifies an input or output. `visibility: "always"` shows it initially; `when-target-visible` follows the linked element's visibility. Copy the linked current value and, only after a successful clipboard write, show the configured alert when `confirmCopy` is true. |
| Text input / legacy Name input | `textCase: "pascal"` capitalizes words while preserving whitespace and punctuation (e.g. `jane doe` to `Jane Doe`); `none` preserves the entered text. |
| Number input | Omitted `min`/`max` mean unlimited. `step` defaults to 1 and can be configured. |
| Email input | `validation.kind: "email"` requests email validation, a red invalid border, and the configured red error message below the input. |
| Phone input | `format: "(###) ###-####"`, `maxDigits: 10`, and `validation.kind: "phone"`. Keep at most 10 digits, format progressively, and validate a complete 10-digit number. The complete formatted string has 14 characters. Use a red invalid border and the configured red message below it. |
| Date input | `todayButton` configures the paired Today action. `min`/`max` have mode `none`, `fixed` (ISO date in `value`), or `today` (evaluate the local current date at runtime). |
| Radio button | One group with at least one `{ id, label, value }` option. Labels sit to the right. Flex direction defaults to column; row and reversed directions are available. Flex wrap supports no wrap (default), wrap, and reversed wrap. Justify content, align content, and gap are configurable, defaulting to start, stretch, and 8px respectively. Its variable is the selected option's `value`, initially empty. |
| Divider | `orientation` is `horizontal` or `vertical`. |
| Text / legacy headings and Label | `text` contains plain text; `style` contains font size, weight, and colors. |
| Output text | `generatedText.default`, ordered `conditions`, and `initiallyHidden`. No rich-text or executable expressions. |

All inputs expose `variableName`, `label`, `showLabel`, and `placeholder`. Text, email, and phone inputs carry `copyButton` settings for the paired action on the right; that action copies its own input and is enabled by default. Date inputs carry `todayButton`, also enabled by default. Empty optional input values should not show an invalid-state error.

The palette calls `Output text` “Generated text” and `Radio button` “Radio button group.” Existing heading, Label, and Name input discriminants remain supported for typed integration.

## Generated text and conditions

Templates use literal `${variableName}` placeholders, resolved from any input in the same tool, including nested inputs. Inserted values are plain text. Renaming a variable in the editor updates placeholders in default and conditional templates. Unresolved variables prevent saving.

Enable **Global tool** to publish this tool's inputs to its category. Other tools in that category can select `${global.variableName}` placeholders and Global number/date/radio conditions. Local names remain separate. The editor checks for conflicting published names and saves `ToolType.isGlobal`. See [Global input variables](../Tools/README.md#global-input-variables) for runtime, validation, and reset behavior.

Each condition contains `id`, `inputId`, `operator`, `value`, and `text`. It compares a number input, date input, or radio selection. The first matching condition supplies the entire output template. If none match, use `generatedText.default`. An empty input does not match any condition, including `not-equals`.

- Numbers compare numerically with `equals`, `not-equals`, `greater-than`, `less-than`, `at-least`, or `at-most`.
- Dates compare calendar days with the same operators. A condition value of `today` means the local date at generation time.
- Radios compare option values with `equals` or `not-equals`.

For the agreement example, use default text `I disagree`, a radio condition `equals` / `yes`, and condition text `I, ${name_input} agree`. Additional rules can be reordered, removed, or use the same variables in different text.

Deleting an input clears affected condition references and flags unresolved template variables. Deleting a container deletes its descendants. Deleted copy/generate targets clear their links so the user can reconnect them.

## Verification

Run `npm run build`, `npm run lint`, and `npm test` (use `npm.cmd` on Windows if PowerShell blocks npm.ps1).

`npm run test:browser` uses native Chrome DevTools Protocol without another library. It expects the dev server at `127.0.0.1:5173` and an isolated Chromium profile with remote debugging on port `9223`. It clears storage only in that test profile and writes screenshots to ignored `.artifacts/`.

## Container visibility

Select a container and choose **Container visibility**: Always show, Show when selected, or Hide when selected. Choose a radio group from the same tool, outside that container, and the option that triggers the rule. Show mode starts hidden until that option is selected; hide mode starts visible and hides on that selection. The rule includes all nested contents and is saved in the catalog JSON. The editing canvas always shows the contents so they remain editable.

Hidden inputs retain their values for templates and later redisplay, but their validation errors do not block generation while hidden. Reset clears radio selections and input values. Deleted radio groups, removed options, and radio groups moved inside their controlled container must be fixed before saving.

## Generated text IDs

Select a generated text element, edit **Generated text ID**, and click **Apply ID**. IDs must be nonempty, contain no spaces, and be unique across elements in the tool. Applying a rename updates every Generate and Copy link and keeps the element selected. Save the tool to persist the ID and links in the catalog JSON. Removing an output removes it from multi-target Generate links while preserving the other targets; a Generate button must retain at least one valid target before saving.

## Missing values on Generate

Clicking Generate requires nonblank values for variables in the selected output template and conditions evaluated before it. Unused conditional templates and unrelated empty inputs are not required. Whitespace-only text is empty; numeric zero is valid. Local inputs show inline messages (for example, Please enter Full name or Please select an option), with a summary below the tool. Missing Global inputs identify their source tool in the summary. If any linked output lacks required values, all linked outputs keep their previous results and visibility until validation succeeds.

Number and date conditions can compare against another input of the same type using `comparisonInputId`. An optional `offset` adds to the comparison value; dates use whole calendar days (e.g. 60 means 60 days after the comparison date). Fixed values and `today` remain supported.

Generated text supports **Show when selected**: choose a radio group in the same tool and an option. This replaces Hide until generated while enabled, displays text immediately using current inputs, and hides it on other selections or Reset. Conditional text rules still apply. Copy buttons configured to follow the output visibility hide with it.

Select a container and use **Duplicate container and its contents** in Element settings to copy its full subtree beside the original. Element IDs receive the first available suffix (`_1`, `_2`, etc.). Input variable names are also made unique; internal links, visibility rules, conditions, and template variables follow the copies. References outside the container stay unchanged.
