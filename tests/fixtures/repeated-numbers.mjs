import { importTypeScript } from "../import-typescript.mjs"

const { createElement } = await importTypeScript("src/screens/CreateTool/functions.ts")

export function makeRepeatedNumberCatalog() {
    const tool = { id: "address-months", categoryId: "rental-history", name: "Address months", elements: [] }
    const add = (type, id, changes = {}) => {
        const element = { ...createElement(type, tool), id, ...changes }
        tool.elements.push(element)
        return element
    }
    add("Number input", "required", { label: "Required months", variableName: "required_months_rh_input", min: 0, defaultValue: 12 })
    add("Container", "addresses")
    add("Number input", "months", { containerId: "addresses", label: "Months stayed on address 1", variableName: "months_stayed_on_addresses", min: 0, max: 12, repeatable: { enabled: true, buttonText: "Add field" } })
    add("Output text", "result", {
        generatedText: { default: "Below requirement: ${months_stayed_on_addresses} months." },
        conditions: [{ id: "enough-months", inputId: "months", operator: "at-least", value: "", comparisonInputId: "required", text: "Requirement met: ${months_stayed_on_addresses} months." }],
    })
    add("Generate button", "generate", { link: "result" })
    add("Copy button", "copy", { link: "result" })
    add("Reset button", "reset")
    return { categories: [{ id: "rental-history", name: "Rental history" }], tools: [tool] }
}
