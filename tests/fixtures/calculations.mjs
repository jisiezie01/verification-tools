import { importTypeScript } from "../import-typescript.mjs"

const { createElement } = await importTypeScript("src/screens/CreateTool/functions.ts")

export function makeCalculationCatalog() {
    const tool = { id: "calculator", categoryId: "calculations", name: "Calculation example", elements: [] }
    const add = (type, id, changes = {}) => {
        const element = { ...createElement(type, tool), id, ...changes }
        tool.elements.push(element)
        return element
    }
    add("Container", "calculation-group")
    for (const letter of ["a", "b", "c"]) add("Number input", letter, { containerId: "calculation-group", label: `Amount ${letter.toUpperCase()}`, variableName: `amount_${letter}`, step: 0.000001 })
    add("Number input", "target", { label: "Target amount", variableName: "target", step: 0.000001 })
    add("Output text", "result", { containerId: "calculation-group", generatedText: { default: "Below target." } })
    add("Generate button", "generate", { link: "result" })
    add("Copy button", "copy", { link: "result" })
    add("Reset button", "reset")
    return { categories: [{ id: "calculations", name: "Calculations" }], tools: [tool] }
}

export function makeCalculationRule(operation = "sum", inputIds = ["a", "b", "c"]) {
    return { id: "calculation-rule", inputId: "", calculation: { operation, inputIds }, operator: "equals", value: "27", text: "Meets target: ${calc.result}." }
}
