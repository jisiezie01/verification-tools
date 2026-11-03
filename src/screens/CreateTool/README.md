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
| Number input | Omitted `min`/`max` mean unlimited. `defaultValue` is optional and prefills the input on load and Reset. `step` defaults to 1 and can be configured. |
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

Date rules add the main **Offset** (days, months, or years) to the comparison date, then apply **Additional offset (days)**. This optional setting accepts positive or negative whole days; blank or `0` leaves the main offset unchanged. Month and year offsets clamp to the last valid day of the target month before applying the extra days.

For a rental-history requirement with a 15-day allowance, choose **When variable** `move_out_date_input`, **Comparison** **is at least / on or after**, **Compare against** **Another variable**, **Comparison date** `move_in_date_input`, **Offset unit** **Months**, **Offset (months) source** **Number input**, **Offset (months) variable** `required_months_rh_input`, and **Additional offset (days)** `-15`. This checks `move-out >= (move-in + required calendar months) - 15 days`. A move-in date of July 25, 2022 with 12 required months qualifies from July 10, 2023 onward. Saved rules store the adjustment in the optional `additionalOffsetDays` field; existing rules retain their behavior.

In a date rule's **Use this text when matched**, insert **`${date.remainingDays}`** to show the calendar days from **When variable** to that rule's comparison date, after applying both offsets. It returns `0` on or after the comparison date. For a shortfall message, use **is less than / before** with text such as `You need ${date.remainingDays} more days to meet the requirement.` Using the example above, a move-out date of July 9, 2023 produces `1`; July 1 produces `9`. Without the additional `-15` adjustment, July 9 produces `16`. The count uses calendar days and handles leap years and month ends. This variable belongs to its own date condition, so it is unavailable in default text or non-date rules. Missing or invalid inputs must be corrected before generating.

To display the original shortfall while a grace allowance makes the rule match, insert **`${date.remainingDaysBeforeAdjustment}`**. This counts calendar days to **Comparison date + the main Offset**, excluding **Additional offset (days)**, and returns `0` once that original date is reached. For move-in `10/10/2022`, move-out `09/30/2023` (MM/DD/YYYY), 12 required months, and an additional offset of `-15`, an **is at least / on or after** rule matches and `The requirement would be met by adding ${date.remainingDaysBeforeAdjustment} days.` produces `The requirement would be met by adding 10 days.` In that same rule `${date.remainingDays}` is `0` because the adjusted cutoff has already been reached. Both variables are available from insertion buttons in date-rule text.

### Repeating number fields

Select a **Number input**, enable **Allow additional fields**, and customize **Add field button text** (defaults to `Add field`). The tool starts with one field; each click adds one empty field. Extra fields can be removed. A label such as `Months stayed on address 1` increments to address 2, 3, and so on. Labels without a trailing number get a number appended; `{index}` can place the number elsewhere, such as `Address {index}: months stayed`.

The existing variable represents the sum of all fields. For example, give the repeated input the variable name `months_stayed_on_addresses` and use this generated-text rule:

| Setting | Value |
| --- | --- |
| Condition source | Single variable |
| When variable | `months_stayed_on_addresses` |
| Comparison | is at least / on or after |
| Compare against | Another variable |
| Comparison variable | `required_months_rh_input` |
| Offset | `0` |
| Use this text when matched | `Requirement met: ${months_stayed_on_addresses} months total.` |

Values of `4`, `5`, and `3` give a total of `12`, so the rule matches a required value of `12`. This total also works in formulas, calculation operands, comparison values, date offsets, copy buttons, and Global variables. Minimum, maximum, and step apply to each entry, not to the total. All added fields must be completed or removed when the group is used by the generated text; a blank field does not count as zero. Reset removes the added fields and restores the first field's default value, if configured. Saving/exporting stores `repeatable: { enabled, buttonText }`; entered values and added rows remain runtime state.

### Formulas in generated text

Write arithmetic directly inside a generated-text placeholder. For example, `The total is ${((Hourly_Rate_input * Hours_per_Week_input) * 52) / 12}`. The app calculates it when generating the text and asks for the number inputs used by the formula. Formulas support number-input variable names, numeric constants, parentheses, unary signs, and `+`, `-`, `*`, `/`. Every formula variable must be a Number input; division by zero and nonfinite results block generation. Wrap the full formula in `Currency(...)` to format it as USD, or pass a three-letter ISO code such as `Currency(((Hourly_Rate_input * Hours_per_Week_input * 52) / 12), "JPY")`. Currency values display with two decimal places, including JPY.

### Conditions using calculations

Select a Generated text element, click **Add condition**, then set **Condition source** to **Calculation**. Choose **Sum**, **Difference**, **Product**, or **Quotient**, and select at least two number inputs. **Add number input** adds more operands; **Earlier**, **Later**, and **Remove** change the ordered list. The expression preview shows the exact calculation. Local inputs and number inputs from Global tools in the category are available.

Choose a comparison (such as **At least**), then compare the result with a specific number or another number input. An optional Offset is added to the comparison value. In **Use this text when matched**, insert **`${calc.result}`** to include the calculated number in the generated text. For example, Sum of Income 1, Income 2, and Income 3 compared with At least 5000 can generate `Total: ${calc.result}` when the total reaches 5000.

Difference and Quotient evaluate left to right: `20 - 5 - 2 = 13`, and `(20 / 5) / 2 = 2`. The same input can appear more than once. Blank values are required rather than treated as zero; zero itself is valid except as a divisor. Invalid values, unavailable inputs, division by zero, and nonfinite results prevent generation and preserve previous results. The first matching rule still wins; later calculations are skipped. Radio-controlled text evaluates these rules immediately and displays calculation errors without showing fallback text. Decimal comparisons account for floating-point round-off; integer comparisons remain exact.

Calculation rules retain the existing comparison fields and add `calculation: { operation: "sum" | "difference" | "product" | "quotient", inputIds: string[] }`. In this mode `inputId` is empty and unused. Ordered operands use local element IDs or Global input IDs. Saved/exported catalogs preserve this configuration; duplicated containers remap internal operands, and deleting an operand requires selecting a replacement before saving.

For the agreement example, use default text `I disagree`, a radio condition `equals` / `yes`, and condition text `I, ${name_input} agree`. Additional rules can be reordered, removed, or use the same variables in different text.

Deleting an input clears affected condition references and flags unresolved template variables. Deleting a container deletes its descendants. Deleted copy/generate targets clear their links so the user can reconnect them.

## Verification

`tests/calculations.test.mjs` covers arithmetic conditions, validation, shared inputs, save/reload, and container operations. After `npm run build`, `npm run test:calculations-browser` checks the production editor and workspace using an isolated Chromium profile on debugging port 9223. It serves an in-memory fixture on port 4176, blocks analytics requests, and does not modify the author's catalog.

`tests/date-offsets.test.mjs` covers additional day offsets, cutoff dates, month-end clamping, Global inputs, validation, and persistence. After building, `npm run test:date-offsets-browser` checks the date-rule editor and generation with the same isolated-browser setup and an in-memory catalog.

Run `npm run build`, `npm run lint`, and `npm test` (use `npm.cmd` on Windows if PowerShell blocks npm.ps1).

`npm run test:browser` uses native Chrome DevTools Protocol without another library. It expects the dev server at `127.0.0.1:5173` and an isolated Chromium profile with remote debugging on port `9223`. It clears storage only in that test profile and writes screenshots to ignored `.artifacts/`.

## Container visibility

Select a container and choose **Container visibility**: Always show, Show when selected, or Hide when selected. Choose a radio group from the same tool, outside that container, and the option that triggers the rule. Show mode starts hidden until that option is selected; hide mode starts visible and hides on that selection. The rule includes all nested contents and is saved in the catalog JSON. The editing canvas always shows the contents so they remain editable.

Hidden inputs retain their values for templates and later redisplay, but their validation errors do not block generation while hidden. Reset clears radio selections and input values. Deleted radio groups, removed options, and radio groups moved inside their controlled container must be fixed before saving.

## Generated text IDs

Select a generated text element, edit **Generated text ID**, and click **Apply ID**. IDs must be nonempty, contain no spaces, and be unique across elements in the tool. Applying a rename updates every Generate and Copy link and keeps the element selected. Save the tool to persist the ID and links in the catalog JSON. Removing an output removes it from multi-target Generate links while preserving the other targets; a Generate button must retain at least one valid target before saving.

## Missing values on Generate

Clicking Generate requires nonblank values for variables in the selected output template and conditions evaluated before it. Unused conditional templates and unrelated empty inputs are not required. Whitespace-only text is empty; numeric zero is valid. Local inputs show inline messages (for example, Please enter Full name or Please select an option), with a summary below the tool. Missing Global inputs identify their source tool in the summary. If any linked output lacks required values, all linked outputs keep their previous results and visibility until validation succeeds.

Number and date conditions can compare against another input of the same type using `comparisonInputId`. An optional `offset` adds to the comparison value; date offsets use whole days, months, or years and can come from a Number input variable, including shared Global number inputs. Month/year offsets use calendar arithmetic and clamp to the last valid day of the destination month (for example, January 31 plus one month becomes February 28 or 29). Fixed values and `today` remain supported.

Generated text supports **Show when selected**: choose a radio group in the same tool and an option. This replaces Hide until generated while enabled, displays text immediately using current inputs, and hides it on other selections or Reset. Conditional text rules still apply. Copy buttons configured to follow the output visibility hide with it.

Select a container and use **Duplicate container and its contents** in Element settings to copy its full subtree beside the original. Element IDs receive the first available suffix (`_1`, `_2`, etc.). Input variable names are also made unique; internal links, visibility rules, conditions, and template variables follow the copies. References outside the container stay unchanged.
