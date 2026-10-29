import type { ToolType } from "../../types"
import type { PaletteItemType } from "./types"



export const NEW_TOOL: ToolType = {
    categoryId: "",
    id: "",
    name: "",
    elements: []
}

export const SAMPLE_TOOl: ToolType = {
    "categoryId": "a5fdac86-18c1-4733-855f-242170dc0061",
    "id": "e2af1216-2483-4534-818f-599211362741",
    "name": "Discontinue Request",
    "elements": [
        {
            "id": "bf20074a-07c7-439e-8428-8ec3ca347041",
            "toolId": "e2af1216-2483-4534-818f-599211362741",
            "categoryId": "a5fdac86-18c1-4733-855f-242170dc0061",
            "style": {},
            "size": {
                "width": {
                    "unit": "%",
                    "value": 100
                },
                "height": {
                    "unit": "auto",
                    "value": 80
                }
            },
            "type": "Container",
            "direction": "row",
            "gap": 16,
            "padding": 20
        },
        {
            "id": "286d0b43-c945-48d5-916b-a810da17c214",
            "toolId": "e2af1216-2483-4534-818f-599211362741",
            "categoryId": "a5fdac86-18c1-4733-855f-242170dc0061",
            "style": {
                "color": "#334155",
                "fontSize": 16,
                "fontWeight": 600
            },
            "size": {
                "width": {
                    "unit": "auto",
                    "value": 240
                },
                "height": {
                    "unit": "auto",
                    "value": 0
                }
            },
            "type": "Text",
            "text": "Discontinue Request",
            "containerId": "bf20074a-07c7-439e-8428-8ec3ca347041"
        },
        {
            "id": "e2bd0c07-ecda-4bd4-993a-b21d3eb96ae7",
            "toolId": "e2af1216-2483-4534-818f-599211362741",
            "categoryId": "a5fdac86-18c1-4733-855f-242170dc0061",
            "style": {
                "color": "#ffffff",
                "backgroundColor": "#ef4444"
            },
            "size": {
                "width": {
                    "unit": "auto",
                    "value": 0
                },
                "height": {
                    "unit": "auto",
                    "value": 0
                }
            },
            "type": "Reset button",
            "text": "Reset",
            "behavior": "clear-all-inputs-and-hide-outputs",
            "containerId": "bf20074a-07c7-439e-8428-8ec3ca347041"
        },
        {
            "id": "bb30f4d1-cbf9-425e-a16c-ec3698767fc4",
            "toolId": "e2af1216-2483-4534-818f-599211362741",
            "categoryId": "a5fdac86-18c1-4733-855f-242170dc0061",
            "style": {},
            "size": {
                "width": {
                    "unit": "%",
                    "value": 100
                },
                "height": {
                    "unit": "auto",
                    "value": 0
                }
            },
            "variableName": "name_input",
            "label": "Name",
            "showLabel": true,
            "placeholder": "Enter text",
            "type": "Text input",
            "textCase": "pascal",
            "copyButton": {
                "enabled": true,
                "text": "Copy",
                "confirmCopy": true,
                "confirmationMessage": "Copied to clipboard."
            }
        },
        {
            "id": "d6c26f12-9253-4a65-a5c4-44490f4d8e0d",
            "toolId": "e2af1216-2483-4534-818f-599211362741",
            "categoryId": "a5fdac86-18c1-4733-855f-242170dc0061",
            "style": {},
            "size": {
                "width": {
                    "unit": "%",
                    "value": 100
                },
                "height": {
                    "unit": "auto",
                    "value": 0
                }
            },
            "variableName": "phone_input",
            "label": "Phone input",
            "showLabel": true,
            "placeholder": "(123) 456-7890",
            "type": "Phone input",
            "copyButton": {
                "enabled": true,
                "text": "Copy",
                "confirmCopy": true,
                "confirmationMessage": "Copied to clipboard."
            },
            "format": "(###) ###-####",
            "maxDigits": 10,
            "validation": {
                "kind": "phone",
                "message": "Enter a valid 10-digit phone number."
            }
        },
        {
            "id": "a53ad30f-5198-4375-b347-92b5a0e0df31",
            "toolId": "e2af1216-2483-4534-818f-599211362741",
            "categoryId": "a5fdac86-18c1-4733-855f-242170dc0061",
            "style": {},
            "size": {
                "width": {
                    "unit": "%",
                    "value": 100
                },
                "height": {
                    "unit": "auto",
                    "value": 0
                }
            },
            "type": "Output text",
            "generatedText": {
                "default": "We received a request from the property staff ${name_input} using the phone number ${phone_input} requesting to discontinue the verification."
            },
            "conditions": [],
            "initiallyHidden": true
        },
        {
            "id": "bfa003e9-8971-44a5-8825-7cb4cd7b635e",
            "toolId": "e2af1216-2483-4534-818f-599211362741",
            "categoryId": "a5fdac86-18c1-4733-855f-242170dc0061",
            "style": {
                "color": "#ffffff",
                "backgroundColor": "#22c55e"
            },
            "size": {
                "width": {
                    "unit": "%",
                    "value": 100
                },
                "height": {
                    "unit": "auto",
                    "value": 0
                }
            },
            "type": "Generate button",
            "text": "Generate",
            "link": "a53ad30f-5198-4375-b347-92b5a0e0df31"
        }
    ]
}



export const DRAG_TYPE = "TOOL_BUILDER_ELEMENT"
export { TOOLS_STORAGE_KEY, CATEGORIES_STORAGE_KEY } from "../../data/toolCatalog/data"
export const DEFAULT_OUTPUT = "Lorem ipsum dolor sit amet."
export const PALETTE_GROUPS = ["Actions", "Inputs", "Layout & content"] as const
export const PALETTE_ITEMS: Array<PaletteItemType> = [
    { type: "Generate button", label: "Generate button", description: "Create a text output", icon: "button", group: "Actions" },
    { type: "Reset button", label: "Reset button", description: "Clear inputs and output", icon: "button", group: "Actions" },
    { type: "Copy button", label: "Copy button", description: "Copy a linked value", icon: "button", group: "Actions" },
    { type: "Text input", label: "Text input", description: "Names and short answers", icon: "input", group: "Inputs" },
    { type: "Number input", label: "Number input", description: "Numbers and amounts", icon: "input", group: "Inputs" },
    { type: "Email input", label: "Email input", description: "Validated email address", icon: "input", group: "Inputs" },
    { type: "Phone input", label: "Phone input", description: "Formatted phone number", icon: "input", group: "Inputs" },
    { type: "Date input", label: "Date input", description: "A date with a Today action", icon: "calendar", group: "Inputs" },
    { type: "Radio button", label: "Radio button group", description: "Choose one answer", icon: "radio", group: "Inputs" },
    { type: "Container", label: "Container", description: "Arrange elements together", icon: "container", group: "Layout & content" },
    { type: "Divider", label: "Divider", description: "Add a visual break", icon: "divider", group: "Layout & content" },
    { type: "Text", label: "Text", description: "Headings and instructions", icon: "text", group: "Layout & content" },
    { type: "Output text", label: "Generated text", description: "Templates and conditions", icon: "output", group: "Layout & content" },
]
export const CONDITION_OPERATORS = [
    { value: "equals", label: "is equal to" },
    { value: "not-equals", label: "is not equal to" },
    { value: "greater-than", label: "is greater than / after" },
    { value: "less-than", label: "is less than / before" },
    { value: "at-least", label: "is at least / on or after" },
    { value: "at-most", label: "is at most / on or before" },
]
export default NEW_TOOL
