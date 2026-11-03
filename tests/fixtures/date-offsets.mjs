import { importTypeScript } from "../import-typescript.mjs"

const { createElement } = await importTypeScript("src/screens/CreateTool/functions.ts")

export function makeDateOffsetCatalog() {
    const tool = { id: "date-offset", name: "Rental history", categoryId: "dates", elements: [] }
    const add = (type, id, changes = {}) => {
        const element = { ...createElement(type, tool), id, ...changes }
        tool.elements.push(element)
        return element
    }
    add("Container", "date-group")
    add("Date input", "move-in", { containerId: "date-group", label: "Move in date", variableName: "move_in_date_input" })
    add("Date input", "move-out", { containerId: "date-group", label: "Move out date", variableName: "move_out_date_input" })
    add("Number input", "months", { containerId: "date-group", label: "Required months", variableName: "required_months_rh_input", defaultValue: 12 })
    add("Output text", "result", { containerId: "date-group", generatedText: { default: "Requirement not met." }, conditions: [
        { id: "rental-rule", inputId: "move-out", operator: "at-least", comparisonInputId: "move-in", value: "", offsetUnit: "months", offsetInputId: "months", text: "Requirement met." },
    ] })
    add("Generate button", "generate", { link: "result" })
    return { categories: [{ id: "dates", name: "Dates" }], tools: [tool] }
}
