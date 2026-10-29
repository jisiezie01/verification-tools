import { importTypeScript } from "../import-typescript.mjs"

const { createElement } = await importTypeScript("src/screens/CreateTool/functions.ts")

export function makeCatalog() {
    const categories = [{ id: "references", name: "Reference tools" }, { id: "formatters", name: "Formatters" }]
    const agreement = { id: "agreement", categoryId: "references", name: "Agreement generator", elements: [] }
    function add(tool, type, id, changes = {}) {
        const element = { ...createElement(type, tool), id, ...changes }
        tool.elements.push(element)
        return element
    }
    add(agreement, "Text input", "agreement-name", { label: "Full name", variableName: "name_input" })
    add(agreement, "Email input", "agreement-email", { label: "Email", variableName: "email_input" })
    add(agreement, "Phone input", "agreement-phone", { label: "Contact number", variableName: "phone_input" })
    add(agreement, "Number input", "agreement-age", { label: "Age", variableName: "age", min: 0, max: 100 })
    add(agreement, "Date input", "agreement-date", { label: "Reference date", variableName: "reference_date" })
    add(agreement, "Radio button", "agreement-consent", { label: "Consent", variableName: "consent", options: [{ id: "yes", label: "Yes", value: "yes" }, { id: "no", label: "No", value: "no" }] })
    add(agreement, "Output text", "agreement-output", { generatedText: { default: "I disagree" }, conditions: [
        { id: "yes-rule", inputId: "agreement-consent", operator: "equals", value: "yes", text: "I, ${name_input} agree" },
        { id: "adult-rule", inputId: "agreement-age", operator: "at-least", value: "18", text: "Adult: ${name_input}" },
        { id: "past-rule", inputId: "agreement-date", operator: "less-than", value: "today", text: "Earlier date: ${reference_date}" },
    ] })
    add(agreement, "Container", "agreement-actions", { direction: "row", padding: 0, gap: 8 })
    add(agreement, "Generate button", "agreement-generate", { containerId: "agreement-actions", link: "agreement-output" })
    add(agreement, "Copy button", "agreement-copy", { containerId: "agreement-actions", text: "Copy result", link: "agreement-output", confirmationMessage: "Result copied.", visibility: "when-target-visible" })
    add(agreement, "Reset button", "agreement-reset", { containerId: "agreement-actions" })
    const phone = { id: "phone", categoryId: "references", name: "Phone formatter", elements: [] }
    add(phone, "Phone input", "phone-input", { label: "Phone to format" })
    add(phone, "Reset button", "phone-reset")
    const archived = { id: "archived", categoryId: "references", name: "Archived helper", archived: true, elements: [] }
    add(archived, "Text", "archived-text", { text: "A saved helper, ready to restore." })
    const dates = { id: "dates", categoryId: "formatters", name: "Date helper", elements: [] }
    add(dates, "Date input", "dates-input", { label: "Date to copy" })
    return { categories, tools: [agreement, phone, archived, dates] }
}
