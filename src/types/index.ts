import type { CSSProperties } from "react"

type ToolCategoryType = {
    id: string
    name: string
    archived?: boolean
    board?: ToolCategoryBoardType
}

type ToolBoardPlacementType = {
    toolId: string
    // Requested size in pixels; the rendered content always sets a lower bound.
    width?: number
    height?: number
}

type ToolCategoryBoardType = {
    direction: "row" | "column" | "row-reverse" | "column-reverse"
    wrap: "wrap" | "nowrap" | "wrap-reverse"
    gap: number
    placements: Array<ToolBoardPlacementType>
    // Explicit removals persist, while newly created tools appear automatically.
    removedToolIds: Array<string>
}

type ToolType = {
    categoryId: ToolCategoryType["id"]
    id: string
    name: string
    elements: Array<ElementType>
    archived?: boolean
    // Publish this tool's input variables to other tools in its category.
    isGlobal?: boolean
}
/**
 * Category: any input data in the container can be used by all tools in the category
 * Tool: input data is only tool level 
 */
type ContainerType = {
    categoryId: ToolCategoryType["id"]
    id: string
    type: "Category" | "Tool" // Tools exist within a ToolType but also in the tool catalog will be editable, meaning there will be containers outside of Tools
}
type ElementDimensionType = {
    unit: "auto" | "px" | "%"
    value: number
}

type ElementBaseType = {
    categoryId: ToolCategoryType["id"]
    toolId: ToolType["id"]
    containerId?: ContainerType["id"] // is defined when inserted inside a container element
    id: string
    style: CSSProperties
    size: { width: ElementDimensionType; height: ElementDimensionType }
}

type ElementType = ElementBaseType & (
    ElementContainerType | ElementHeader1Type | ElementHeader2Type |
    ElementHeader3Type | ElementLabelType | ElementTextType |
    ElementOutputTextType | ElementGenerateButtonType | ElementCopyButtonType |
    ElementResetButtonType | ElementRadioButtonType | ElementNumberInputType |
    ElementNameInputType | ElementTextInputType | ElementEmailInputType |
    ElementPhoneInputType | ElementDateInputType | ElementDividerType
)

type ElementContainerType = {
    type: "Container"
    direction: "column" | "row"
    gap: number
    padding: number
    justifyContent?: "flex-start" | "space-between"
    visibility?: { mode: "show" | "hide"; inputId: string; value: string }
}
type ElementHeader1Type = {
    type: "Header 1"
    text: string
}
type ElementHeader2Type = { type: "Header 2"; text: string }
type ElementHeader3Type = { type: "Header 3"; text: string }
type ElementLabelType = { type: "Label"; text: string }
type ElementTextType = { type: "Text"; text: string }

type TextConditionType = {
    id: string
    // Local element ID, or sharedInputId(sourceToolId, sourceInputId) for a Global input.
    inputId: string
    operator: "equals" | "not-equals" | "greater-than" | "less-than" | "at-least" | "at-most"
    value: string
    comparisonInputId?: string
    offset?: number
    text: string
}
type ElementOutputTextType = {
    type: "Output text"
    // Templates use ${variableName}. The first matching condition overrides default.
    generatedText: { default: string } & Record<string, string>
    conditions: Array<TextConditionType>
    initiallyHidden: boolean
}
type ElementGenerateButtonType = {
    type: "Generate button"
    text: string
    link: string | Array<string>
}
type ElementCopyButtonType = {
    type: "Copy button"
    text: string
    link: string
    visibility: "always" | "when-target-visible"
    confirmCopy: boolean
    confirmationMessage: string
}
type ElementResetButtonType = {
    type: "Reset button"
    text: string
    behavior: "clear-all-inputs-and-hide-outputs"
}
type ElementDividerType = {
    type: "Divider"
    orientation: "horizontal" | "vertical"
}
type InputCopyButtonType = {
    enabled: boolean
    text: string
    confirmCopy: boolean
    confirmationMessage: string
}
type ElementInputSettingsType = {
    variableName: string
    label: string
    showLabel: boolean
    placeholder: string
}
type ElementTextInputType = ElementInputSettingsType & {
    type: "Text input"
    textCase: "pascal" | "none"
    copyButton: InputCopyButtonType
}
type ElementNameInputType = Omit<ElementTextInputType, "type"> & { type: "Name input" }
type ElementNumberInputType = ElementInputSettingsType & {
    type: "Number input"
    min?: number
    max?: number
    step: number
}
type ElementEmailInputType = ElementInputSettingsType & {
    type: "Email input"
    copyButton: InputCopyButtonType
    validation: { kind: "email"; message: string }
}
type ElementPhoneInputType = ElementInputSettingsType & {
    type: "Phone input"
    copyButton: InputCopyButtonType
    format: "(###) ###-####"
    maxDigits: 10
    validation: { kind: "phone"; message: string }
}
type DateLimitType = {
    mode: "none" | "fixed" | "today"
    value: string
}
type ElementDateInputType = ElementInputSettingsType & {
    type: "Date input"
    todayButton: { enabled: boolean; text: string }
    min: DateLimitType
    max: DateLimitType
}
type RadioOptionType = { id: string; label: string; value: string }
type ElementRadioButtonType = ElementInputSettingsType & {
    type: "Radio button"
    options: Array<RadioOptionType>
}
/**
 * Preview structure
 *                                                                            APP
 *                              _______________________________________________|________________________________________________________
 *                              |                                              |                                                       |
 *                         "Formatters"                               "Negative Reference"                                        "Calculator"  <- These are ToolCategoryType
 *            __________________|________________            __________________|________________                     __________________|________________
 *            |                                 |            |                                 |                     |                                 |
 *      "Phone Formatter"             "Name Formatter"     "Rental Reference"       "Employment Reference"     "Salary Calculator"                 "RH Calculator"  <- These are ToolType
 *            |                                 |            |                                 |                     |                                 |
 *   Array<ContainerType>           Array<ContainerType>    Array<ContainerType>     Array<ContainerType>       Array<ContainerType>                Array<ContainerType>
 *            |                                 |            |                                 |                     |                                 |
 *   Array<ElementType>             Array<ElementType>       Array<ElementType>      Array<ElementType>         Array<ElementType>                  Array<ElementType>
 */

export type {
    ToolCategoryType,
    ToolBoardPlacementType,
    ToolCategoryBoardType,
    ToolType,
    ContainerType,
    ElementType,
    ElementBaseType,
    ElementDimensionType,
    ElementContainerType,
    ElementHeader1Type,
    ElementHeader2Type,
    ElementHeader3Type,
    ElementLabelType,
    ElementTextType,
    ElementOutputTextType,
    ElementGenerateButtonType,
    ElementCopyButtonType,
    ElementResetButtonType,
    ElementDividerType,
    ElementInputSettingsType,
    InputCopyButtonType,
    ElementTextInputType,
    ElementNameInputType,
    ElementNumberInputType,
    ElementEmailInputType,
    ElementPhoneInputType,
    ElementDateInputType,
    ElementRadioButtonType,
    DateLimitType,
    RadioOptionType,
    TextConditionType,
}

// Here's a list of standard i want you to absolutely follow:
//     - Components should always be Pascal Case.
// - If a component is a screen, it should have a "Screen" prefix.example: ScreenHome.
// - If a component is intended as a container, it should have a "Container" prefix.example: ContainerButtonGroup.
// - If a component is for a string, it should have a "Text" prefix.example: TextHeader.
// - If a component is for an input, it should have a "Input" prefix.examples: InputDate, InputNumber, InputRadio, InputCheckBox, InputDropdown(for select element).
// - All components should have a default props of:
// - className type of string for applying styling on the container
//     - children type of React.ReactNode only if the component expects to contain an element inside, like a button that needs a text
//         - A component should always be a folder with an index.tsx.example: a button component should be src / components / Button / index.tsx.
//     - if the component needs a function, style, or type, they should be a file in that folder, e.g: functions.ts, style.ts, types.ts.
//     - declare all functions in the functions.ts as much as possible.only declare a function inside the index.tsx when necessary.
//     - Use tailwind only, Avoid creating a React.CSSProperties or custom css class as much as possible, only create one when neccessary.
//     - never declare a type in the index of the Component, even the component Props should be in the types.ts.
// - Under no circumstances are you, an ai agent, allowed to declare a type, when a new type is needed, prompt the developer to create one before moving forwardRef.
// - In regards to stying; This app will follow apple's glass morphism design
// - Each .tsx file should only contain 1 React.JSX.Element variable, and that only variable is what the file's export default
//     - If the component will need specific Components, create a component folder and place them there
// - If what you're working on requires data, do not declare it in the component, instead create a file called data.ts under the same folder and declare it there
// - Always declare the type of the props of any Component
// - Never use emojis or special characters as icon
// - Always componentize SVGs
// - If an icon is needed, and it doesnt exist yet, create an svg file in the src/components/svg directory
//     - all svg component should have these as the minimum props; wrapperProps?: React.SVGProps<SVGSVGElement> and pathProps?: React.SVGProps<SVGPathElement>

