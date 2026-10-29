import type { CSSProperties } from "react"
import { generatedTextIds } from "../../data/toolLinks/functions"
import { readToolCatalog, updateToolCatalog } from "../../data/toolCatalog/functions"
import { getGlobalInputs, globalVariableConflicts } from "../../data/toolVariables/functions"
import type { DateLimitType, ElementBaseType, ElementType, InputCopyButtonType, ToolCategoryType, ToolType } from "../../types"
import { DEFAULT_OUTPUT, NEW_TOOL, PALETTE_ITEMS } from "./data"
import type { BuilderActionType, BuilderStateType, InputElementType } from "./types"

export const createId = () => crypto.randomUUID()
export const isInputElement = (element: ElementType): element is InputElementType => "variableName" in element
export const getElementName = (element: ElementType) => {
    if (isInputElement(element)) return element.label || getElementLabel(element.type)
    if ("text" in element) return element.text || getElementLabel(element.type)
    return getElementLabel(element.type)
}
export const getElementLabel = (type: ElementType["type"]) => PALETTE_ITEMS.find(item => item.type === type)?.label ?? type
export const getVariableName = (type: ElementType["type"], elements: Array<ElementType>) => {
    const base = type === "Radio button" ? "radio_group" : type.toLowerCase().replaceAll(" ", "_")
    const used = new Set(elements.filter(isInputElement).map(element => element.variableName))
    let name = base
    let suffix = 2
    while (used.has(name)) name = `${base}_${suffix++}`
    return name
}
export const createElement = (type: ElementType["type"], tool: ToolType, containerId?: string): ElementType => {
    const base: ElementBaseType = {
        id: createId(), toolId: tool.id, categoryId: tool.categoryId,
        ...(containerId ? { containerId } : {}), style: {},
        size: { width: { unit: "%", value: 100 }, height: { unit: "auto", value: 0 } },
    }
    const input = { variableName: getVariableName(type, tool.elements), label: getElementLabel(type), showLabel: true, placeholder: "" }
    const copyButton: InputCopyButtonType = { enabled: true, text: "Copy", confirmCopy: true, confirmationMessage: "Copied to clipboard." }
    const button = { ...base, size: { ...base.size, width: { unit: "auto" as const, value: 0 } }, style: { color: "#ffffff" } }
    const output = tool.elements.find(element => element.type === "Output text")
    switch (type) {
        case "Container": return { ...base, type, direction: "column", gap: 16, padding: 0 }
        case "Text": case "Header 1": case "Header 2": case "Header 3": case "Label":
            return { ...base, type, text: type === "Text" ? "Add your text here" : type, style: { color: "#334155", fontSize: type === "Header 1" ? 32 : type === "Header 2" ? 24 : 16, fontWeight: type.startsWith("Header") ? 600 : 400 } }
        case "Output text": return { ...base, type, generatedText: { default: DEFAULT_OUTPUT }, conditions: [], initiallyHidden: true }
        case "Generate button": return { ...button, type, text: "Generate", style: { ...button.style, backgroundColor: "#22c55e" }, link: output?.id ?? "" }
        case "Reset button": return { ...button, type, text: "Reset", style: { ...button.style, backgroundColor: "#ef4444" }, behavior: "clear-all-inputs-and-hide-outputs" }
        case "Copy button": {
            const target = output ?? tool.elements.find(element => isInputElement(element) && element.type !== "Radio button")
            return { ...button, type, text: "Copy", style: { ...button.style, backgroundColor: "#3b82f6" }, link: target?.id ?? "", visibility: target?.type === "Output text" ? "when-target-visible" : "always", confirmCopy: true, confirmationMessage: "Copied to clipboard." }
        }
        case "Text input": case "Name input": return { ...base, ...input, type, placeholder: "Enter text", textCase: "pascal", copyButton }
        case "Number input": return { ...base, ...input, type, placeholder: "Enter a number", step: 1 }
        case "Email input": return { ...base, ...input, type, placeholder: "you@example.com", copyButton, validation: { kind: "email", message: "Enter a valid email address." } }
        case "Phone input": return { ...base, ...input, type, placeholder: "(123) 456-7890", copyButton, format: "(###) ###-####", maxDigits: 10, validation: { kind: "phone", message: "Enter a valid 10-digit phone number." } }
        case "Date input": return { ...base, ...input, type, todayButton: { enabled: true, text: "Today" }, min: { mode: "none", value: "" }, max: { mode: "none", value: "" } }
        case "Radio button": return { ...base, ...input, type, options: [{ id: createId(), label: "Option 1", value: "option_1" }] }
        case "Divider": return { ...base, type, orientation: "horizontal" }
    }
}

export const getDescendantIds = (elements: Array<ElementType>, id: string): Set<string> => {
    const ids = new Set([id])
    let previousSize = 0
    while (previousSize !== ids.size) {
        previousSize = ids.size
        elements.forEach(element => { if (element.containerId && ids.has(element.containerId)) ids.add(element.id) })
    }
    return ids
}
export const canMoveElement = (elements: Array<ElementType>, id: string, containerId?: string) =>
    elements.some(element => element.id === id) && (!containerId || (elements.some(element => element.id === containerId && element.type === "Container") && !getDescendantIds(elements, id).has(containerId)))

export const moveElement = (elements: Array<ElementType>, id: string, containerId?: string, beforeId?: string) => {
    if (!canMoveElement(elements, id, containerId) || id === beforeId) return elements
    const source = elements.find(element => element.id === id)
    if (!source) return elements
    const { containerId: previousParent, ...rest } = source
    void previousParent
    const moved: ElementType = { ...rest, ...(containerId ? { containerId } : {}) }
    const remaining = elements.filter(element => element.id !== id)
    const index = remaining.findIndex(element => element.id === beforeId && element.containerId === containerId)
    remaining.splice(index < 0 ? remaining.length : index, 0, moved)
    return remaining
}
export const removeElement = (elements: Array<ElementType>, id: string) => {
    const removed = getDescendantIds(elements, id)
    return elements.filter(element => !removed.has(element.id)).map(element => {
        if (element.type === "Generate button") return { ...element, link: Array.isArray(element.link) ? generatedTextIds(element.link).filter(target => !removed.has(target)) : removed.has(element.link) ? "" : element.link }
        if (element.type === "Copy button" && removed.has(element.link)) return { ...element, link: "" }
        // Retain affected conditions so the editor can ask for a replacement variable.
        if (element.type === "Output text") return { ...element, conditions: element.conditions.map(condition => removed.has(condition.inputId) ? { ...condition, inputId: "" } : condition) }
        if (element.type === "Container" && element.visibility && removed.has(element.visibility.inputId)) return { ...element, visibility: { ...element.visibility, inputId: "" } }
        return element
    })
}
export const replaceTemplateVariable = (text: string, previous: string, next: string) => text.replaceAll("${" + previous + "}", "${" + next + "}")
export const outputIdError = (elements: Array<ElementType>, previousId: string, nextId: string): string => {
    if (!nextId || /\s/.test(nextId)) return "Use a nonempty ID without spaces."
    if (elements.some(element => element.id === nextId && element.id !== previousId)) return "Another element already uses this ID."
    return ""
}
export const updateElement = (elements: Array<ElementType>, updated: ElementType, previousId = updated.id) => {
    const previous = elements.find(element => element.id === previousId)
    if (!previous) return elements
    const renamed = previousId !== updated.id
    if (renamed && (previous.type !== "Output text" || updated.type !== "Output text" || outputIdError(elements, previousId, updated.id))) return elements
    return elements.map(element => {
        if (element.id === previousId) return updated
        if (renamed && element.type === "Generate button") return { ...element, link: Array.isArray(element.link) ? element.link.map(id => id === previousId ? updated.id : id) : element.link === previousId ? updated.id : element.link }
        if (renamed && element.type === "Copy button" && element.link === previousId) return { ...element, link: updated.id }
        if (element.type === "Output text" && previous && isInputElement(previous) && isInputElement(updated) && previous.variableName !== updated.variableName) {
            return { ...element, generatedText: Object.fromEntries(Object.entries(element.generatedText).map(([key, value]) => [key, replaceTemplateVariable(value, previous.variableName, updated.variableName)])) as typeof element.generatedText,
                conditions: element.conditions.map(condition => ({ ...condition, text: replaceTemplateVariable(condition.text, previous.variableName, updated.variableName) })) }
        }
        return element
    })
}
export const createBuilderState = (initialTool?: ToolType): BuilderStateType => ({ tool: initialTool ? structuredClone(initialTool) : { ...NEW_TOOL, id: createId(), elements: [] }, selectedId: null, revision: 0 })
export const builderReducer = (state: BuilderStateType, action: BuilderActionType): BuilderStateType => {
    if (action.type === "select") return { ...state, selectedId: action.id }
    let elements = state.tool.elements
    let selectedId = state.selectedId
    if (action.type === "metadata") {
        const categoryId = action.categoryId ?? state.tool.categoryId
        return { ...state, revision: state.revision + 1, tool: { ...state.tool, name: action.name ?? state.tool.name, ...(action.isGlobal !== undefined ? { isGlobal: action.isGlobal } : {}), categoryId, elements: elements.map(element => ({ ...element, categoryId })) } }
    }
    if (action.type === "change") {
        elements = updateElement(elements, action.element, action.previousId)
        if (elements === state.tool.elements) return state
        if (action.previousId && selectedId === action.previousId) selectedId = action.element.id
    }
    if (action.type === "delete") {
        const removed = getDescendantIds(elements, action.id)
        elements = removeElement(elements, action.id)
        if (selectedId && removed.has(selectedId)) selectedId = null
    }
    if (action.type === "drop") {
        if (action.item.source === "palette") {
            if (action.containerId && !elements.some(element => element.id === action.containerId && element.type === "Container")) return state
            const created = createElement(action.item.elementType, state.tool, action.containerId)
            elements = moveElement([...elements, created], created.id, action.containerId, action.beforeId)
            if (created.type === "Output text") elements = elements.map(element => element.type === "Generate button" && !generatedTextIds(element.link).length ? { ...element, link: created.id } : element)
            selectedId = created.id
        } else {
            elements = moveElement(elements, action.item.id, action.containerId, action.beforeId)
            selectedId = action.item.id
        }
    }
    if (action.type === "move") {
        const source = elements.find(element => element.id === action.id)
        if (!source) return state
        const siblings = elements.filter(element => element.containerId === source.containerId)
        const index = siblings.findIndex(element => element.id === source.id)
        const destination = index + action.direction
        if (destination < 0 || destination >= siblings.length) return state
        elements = moveElement(elements, source.id, source.containerId, siblings[action.direction === -1 ? destination : destination + 1]?.id)
    }
    return { ...state, selectedId, revision: state.revision + 1, tool: { ...state.tool, elements } }
}

export const getElementSizeStyle = (element: ElementType): CSSProperties => ({
    width: element.size.width.unit === "auto" ? "fit-content" : `${element.size.width.value}${element.size.width.unit}`,
    height: element.size.height.unit === "auto" ? undefined : `${element.size.height.value}${element.size.height.unit}`,
    maxWidth: "100%", flexShrink: 0,
})
export const getToday = () => {
    const date = new Date()
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}
export const resolveDateLimit = (limit: DateLimitType) => limit.mode === "today" ? getToday() : limit.mode === "fixed" ? limit.value : undefined
export const isCalendarDate = (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
    const date = new Date(`${value}T12:00:00Z`)
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export const validateTool = (tool: ToolType, categories?: Array<ToolCategoryType>, catalog: Array<ToolType> = []): Array<string> => {
    const errors: Array<string> = globalVariableConflicts(tool, catalog)
    if (!tool.id.trim()) errors.push("The tool must have an ID.")
    if (!tool.name.trim()) errors.push("Give your tool a name.")
    if (!tool.categoryId || (categories && !categories.some(category => category.id === tool.categoryId))) errors.push("Choose or create a tool category.")
    if (!tool.elements.length) errors.push("Add at least one element to your tool.")
    const variables = new Set<string>()
    const ids = new Set<string>()
    const inputs = [...tool.elements.filter(isInputElement), ...getGlobalInputs(tool, catalog)]
    tool.elements.forEach(element => {
        const name = getElementName(element)
        if (!element.id.trim()) errors.push(`${name}: an element ID is required.`)
        if (ids.has(element.id)) errors.push(`${name}: element IDs must be unique.`)
        ids.add(element.id)
        if (element.containerId !== undefined && (!element.containerId || !canMoveElement(tool.elements, element.id, element.containerId))) errors.push(`${name}: invalid container nesting.`)
        if (isInputElement(element)) {
            if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(element.variableName)) errors.push(`${name}: use a variable name starting with a letter or underscore, with no spaces.`)
            if (variables.has(element.variableName)) errors.push(`${name}: variable names must be unique.`)
            variables.add(element.variableName)
        }
        if (element.type === "Generate button") {
            const targets = generatedTextIds(element.link)
            if (!targets.length || targets.some(id => !tool.elements.some(target => target.id === id && target.type === "Output text"))) errors.push(`${name}: choose valid linked generated text elements.`)
        }
        if (element.type === "Copy button") {
            const target = tool.elements.find(candidate => candidate.id === element.link)
            if (!target || (target.type !== "Output text" && (!isInputElement(target) || target.type === "Radio button"))) errors.push(`${name}: choose a valid linked input or generated text element.`)
        }
        if (element.type === "Number input" && element.min !== undefined && element.max !== undefined && element.min > element.max) errors.push(`${name}: minimum must not exceed maximum.`)
        if (element.type === "Number input" && [element.min, element.max].some(value => value !== undefined && !Number.isFinite(value))) errors.push(`${name}: number limits must be finite.`)
        if (element.type === "Number input" && (!Number.isFinite(element.step) || element.step <= 0)) errors.push(`${name}: step must be greater than zero.`)
        if (element.type === "Date input") {
            if ([element.min, element.max].some(limit => limit.mode === "fixed" && !isCalendarDate(limit.value))) errors.push(`${name}: enter a valid fixed date limit.`)
            const min = resolveDateLimit(element.min)
            const max = resolveDateLimit(element.max)
            if (min && max && min > max) errors.push(`${name}: earliest date must not be after latest date.`)
        }
        if (element.type === "Radio button" && (!element.options.length || element.options.some(option => !option.label.trim() || !option.value.trim()) || new Set(element.options.map(option => option.value)).size !== element.options.length)) errors.push(`${name}: include at least one option with a label and a unique, nonempty value.`)
        if (element.type === "Output text") {
            for (const template of [element.generatedText.default, ...element.conditions.map(condition => condition.text)]) {
                for (const match of template.matchAll(/\$\{([^}]+)\}/g)) {
                    if (!inputs.some(input => input.variableName === match[1])) errors.push(`Generated text references an unknown variable: ${match[1]}.`)
                }
            }
            element.conditions.forEach((condition, index) => {
                const input = inputs.find(candidate => candidate.id === condition.inputId)
                const prefix = `Generated text, rule ${index + 1}`
                if (!input || !["Number input", "Date input", "Radio button"].includes(input.type)) errors.push(`${prefix}: choose a number, date, or radio variable.`)
                else if (condition.comparisonInputId !== undefined) {
                    const comparison = inputs.find(candidate => candidate.id === condition.comparisonInputId)
                    if (!comparison || comparison.type !== input.type || !["Number input", "Date input"].includes(comparison.type)) errors.push(`${prefix}: choose a comparison variable of the same type.`)
                }
                else if (input.type === "Number input" && (!condition.value.trim() || !Number.isFinite(Number(condition.value)))) errors.push(`${prefix}: enter a number to compare.`)
                else if (input.type === "Date input" && condition.value !== "today" && !isCalendarDate(condition.value)) errors.push(`${prefix}: enter a valid date or today.`)
                else if (input.type === "Radio button" && (!input.options.some(option => option.value === condition.value) || !["equals", "not-equals"].includes(condition.operator))) errors.push(`${prefix}: choose a valid radio option and equality comparison.`)
                if (condition.offset !== undefined && (!Number.isFinite(condition.offset) || (input?.type === "Date input" && !Number.isInteger(condition.offset)))) errors.push(`${prefix}: enter a valid offset${input?.type === "Date input" ? " in whole days" : ""}.`)
            })
        }
        for (const dimension of [element.size.width, element.size.height]) {
            if (dimension.unit !== "auto" && (!Number.isFinite(dimension.value) || dimension.value <= 0 || (dimension.unit === "%" && dimension.value > 100))) errors.push(`${name}: sizes must be positive, and percentages cannot exceed 100.`)
        }
        if (element.type === "Container" && [element.padding, element.gap].some(value => !Number.isFinite(value) || value < 0)) errors.push(`${name}: padding and gap must be nonnegative numbers.`)
        if (element.type === "Container" && element.justifyContent !== undefined && !["flex-start", "space-between"].includes(element.justifyContent)) errors.push(`${name}: choose a valid content alignment.`)
        if (element.type === "Container" && element.visibility) {
            const rule = element.visibility
            const radio = tool.elements.find(candidate => candidate.id === rule.inputId)
            if (!["show", "hide"].includes(rule.mode)) errors.push(`${name}: choose a valid visibility mode.`)
            if (radio?.type !== "Radio button") errors.push(`${name}: choose a radio group for visibility.`)
            else {
                if (getDescendantIds(tool.elements, element.id).has(radio.id)) errors.push(`${name}: the visibility radio group must be outside this container.`)
                if (!radio.options.some(option => option.value === rule.value)) errors.push(`${name}: choose a valid radio option for visibility.`)
            }
        }
    })
    return [...new Set(errors)]
}
export const createSavedTool = (tool: ToolType, catalog: Array<ToolType> = []): ToolType => {
    const errors = validateTool(tool, undefined, catalog)
    if (errors.length) throw new Error(errors.join("\n"))
    const ordered: Array<ElementType> = []
    const visit = (containerId?: string) => tool.elements.filter(element => element.containerId === containerId).forEach(element => {
        ordered.push({ ...element, toolId: tool.id, categoryId: tool.categoryId })
        if (element.type === "Container") visit(element.id)
    })
    visit()
    return structuredClone({ ...tool, name: tool.name.trim(), elements: ordered })
}
export const readCategories = (): Array<ToolCategoryType> => readToolCatalog().categories
export const saveCategories = (categories: Array<ToolCategoryType>) => updateToolCatalog(current => ({ ...current, categories }))
export const saveTool = async (tool: ToolType): Promise<ToolType> => {
    let saved: ToolType
    await updateToolCatalog(current => {
        saved = createSavedTool(tool, current.tools)
        return { ...current, tools: [...current.tools.filter(item => item.id !== saved.id), saved] }
    })
    return saved!
}
export const downloadTool = (tool: ToolType) => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(tool, null, 2)], { type: "application/json" }))
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `${tool.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "tool"}.json`
    anchor.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
}
