import type { CSSProperties } from "react"
import { generatedTextIds } from "../../data/toolLinks/functions"
import type { SharedRuntimeScopeType } from "../../data/toolVariables/types"
import type { DateLimitType, ElementType, TextConditionType, ToolType } from "../../types"
import type { RuntimeInputType, RuntimeValuesType, ToolRuntimeStateType } from "./types"

export const isRuntimeInput = (element: ElementType): element is RuntimeInputType => "variableName" in element
export const localDate = () => {
    const today = new Date()
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
}
export const dateBoundary = (limit: DateLimitType) => limit.mode === "today" ? localDate() : limit.mode === "fixed" ? limit.value : undefined
export const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 10)
    if (!digits) return ""
    if (digits.length <= 3) return `(${digits}`
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}
export const toPascalCase = (value: string) => value.replace(/[\p{L}\p{N}]+/gu, word => {
    const normalized = /^\p{Ll}\p{Lu}+$/u.test(word) ? word.toLocaleLowerCase() : word
    return normalized.replace(/(\p{Ll}|\p{N})(\p{Lu})/gu, "$1 $2").replace(/(\p{Lu})(\p{Lu}\p{Ll})/gu, "$1 $2").split(" ")
        .map(part => part[0].toLocaleUpperCase() + part.slice(1).toLocaleLowerCase()).join("")
})
export const normalizeInput = (element: RuntimeInputType, value: string) => {
    if (element.type === "Phone input") return formatPhone(value)
    if ((element.type === "Text input" || element.type === "Name input") && element.textCase === "pascal") return toPascalCase(value)
    return value
}
export const getRuntimeValues = (tool: ToolType, values: RuntimeValuesType): RuntimeValuesType => Object.fromEntries(tool.elements.filter(isRuntimeInput).map(element => [element.id, normalizeInput(element, values[element.id] ?? "")]))
export const inputError = (element: RuntimeInputType, value: string) => {
    if (!value) return ""
    if (element.type === "Email input" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return element.validation.message || "Enter a valid email address."
    if (element.type === "Phone input" && value.replace(/\D/g, "").length !== 10) return element.validation.message || "Enter a valid 10-digit phone number."
    if (element.type === "Number input") {
        const number = Number(value)
        if (!Number.isFinite(number)) return "Enter a valid number."
        if (element.min !== undefined && number < element.min) return `Enter a number at least ${element.min}.`
        if (element.max !== undefined && number > element.max) return `Enter a number no greater than ${element.max}.`
        const steps = (number - (element.min ?? 0)) / element.step
        if (element.step > 0 && Math.abs(steps - Math.round(steps)) > 0.0000001) return `Use increments of ${element.step}.`
    }
    if (element.type === "Date input") {
        const date = new Date(`${value}T12:00:00Z`)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return "Enter a valid date."
        const min = dateBoundary(element.min)
        const max = dateBoundary(element.max)
        if (min && value < min) return `Choose ${min} or a later date.`
        if (max && value > max) return `Choose ${max} or an earlier date.`
    }
    if (element.type === "Radio button" && !element.options.some(option => option.value === value)) return "Choose one of the available options."
    return ""
}
export const matchesCondition = (condition: TextConditionType, tool: ToolType, values: RuntimeValuesType) => {
    const input = tool.elements.find(element => element.id === condition.inputId)
    const raw = values[condition.inputId] ?? ""
    if (!input || !isRuntimeInput(input) || !raw || inputError(input, raw)) return false
    let actual: string | number = raw
    let comparison = condition.value
    const offset = condition.offset ?? 0
    if (!Number.isFinite(offset)) return false
    if (condition.comparisonInputId !== undefined) {
        const other = tool.elements.find(element => element.id === condition.comparisonInputId)
        comparison = values[condition.comparisonInputId] ?? ""
        if (!other || !isRuntimeInput(other) || other.type !== input.type || !comparison.trim() || inputError(other, comparison)) return false
    }
    let expected: string | number = comparison
    if (input.type === "Number input") {
        actual = Number(raw); expected = Number(comparison) + offset
        if (!comparison.trim() || !Number.isFinite(actual) || !Number.isFinite(expected)) return false
    } else if (input.type === "Date input") {
        const date = comparison === "today" ? localDate() : comparison
        const timestamp = Date.parse(`${date}T00:00:00Z`)
        if (!Number.isInteger(offset) || !Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== date) return false
        actual = Date.parse(`${raw}T00:00:00Z`)
        expected = timestamp + offset * 86400000
    }
    else if (input.type !== "Radio button") return false
    if (input.type === "Radio button" && !["equals", "not-equals"].includes(condition.operator)) return false
    switch (condition.operator) {
        case "equals": return actual === expected
        case "not-equals": return actual !== expected
        case "greater-than": return actual > expected
        case "less-than": return actual < expected
        case "at-least": return actual >= expected
        case "at-most": return actual <= expected
    }
}
export const resolveTemplate = (template: string, tool: ToolType, values: RuntimeValuesType) => {
    const variables = new Map(tool.elements.filter(isRuntimeInput).map(element => [element.variableName, values[element.id] ?? ""]))
    // A single replacement pass keeps user input literal, including ${...} text.
    return template.replace(/\$\{([^}]+)\}/g, (_match, name: string) => variables.get(name) ?? "")
}
export const generateOutput = (outputId: string, tool: ToolType, values: RuntimeValuesType, shared?: SharedRuntimeScopeType) => {
    const output = tool.elements.find(element => element.id === outputId && element.type === "Output text")
    if (!output || output.type !== "Output text") return ""
    const scope = { ...tool, elements: [...tool.elements, ...(shared?.inputs ?? [])] }
    const normalized = getRuntimeValues(scope, { ...values, ...shared?.values })
    const condition = output.conditions.find(rule => matchesCondition(rule, scope, normalized))
    return resolveTemplate(condition?.text ?? output.generatedText.default, scope, normalized)
}
export const sharedOutputError = (tool: ToolType, outputId: string, shared?: SharedRuntimeScopeType) => {
    const output = tool.elements.find(element => element.id === outputId && element.type === "Output text")
    if (output?.type !== "Output text") return ""
    const names = new Set([output.generatedText.default, ...output.conditions.map(rule => rule.text)].flatMap(text => [...text.matchAll(/\$\{(global\.[^}]+)\}/g)].map(match => match[1])))
    const ids = new Set(output.conditions.flatMap(rule => [rule.inputId, rule.comparisonInputId ?? ""]).filter(id => id.startsWith("global:")))
    const inputs = shared?.inputs ?? []
    if ([...names].some(name => !inputs.some(input => input.variableName === name)) || [...ids].some(id => !inputs.some(input => input.id === id))) return "A shared variable is unavailable. Add its Global tool to this category's board, or update the generated text's variables."
    if ([...names].some(name => inputs.filter(input => input.variableName === name).length > 1)) return "Multiple Global tools publish the same variable name. Give their inputs unique variable names."
    for (const input of inputs.filter(input => names.has(input.variableName) || ids.has(input.id))) {
        const issue = inputError(input, normalizeInput(input, shared?.values[input.id] ?? ""))
        if (issue) return `${input.sourceToolName} — ${input.label.split(" · ")[0]}: ${issue}`
    }
    return ""
}
export const createRuntimeState = (tool: ToolType, shared?: SharedRuntimeScopeType): ToolRuntimeStateType => {
    const visible = tool.elements.filter(element => element.type === "Output text" && !element.initiallyHidden)
    return { values: {}, errors: {}, outputs: Object.fromEntries(visible.map(element => [element.id, generateOutput(element.id, tool, {}, shared)])), visibleOutputIds: visible.map(element => element.id), message: "" }
}
export const requiredOutputInputs = (tool: ToolType, targets: Array<string>, values: RuntimeValuesType): Array<RuntimeInputType> => {
    const required = new Set<string>()
    for (const id of targets) {
        const output = tool.elements.find(element => element.id === id)
        if (output?.type !== "Output text") continue
        let template = output.generatedText.default
        let resolved = true
        for (const rule of output.conditions) {
            required.add(rule.inputId)
            if (rule.comparisonInputId) required.add(rule.comparisonInputId)
            // Ask for the first unanswered condition before choosing a branch.
            if (!(values[rule.inputId] ?? "").trim()) { resolved = false; break }
            if (rule.comparisonInputId && !(values[rule.comparisonInputId] ?? "").trim()) { resolved = false; break }
            if (matchesCondition(rule, tool, values)) { template = rule.text; break }
        }
        if (resolved) {
            const names = new Set([...template.matchAll(/\$\{([^}]+)\}/g)].map(match => match[1]))
            tool.elements.filter(isRuntimeInput).forEach(input => { if (names.has(input.variableName)) required.add(input.id) })
        }
    }
    return tool.elements.filter(isRuntimeInput).filter(input => required.has(input.id))
}
export const requiredInputError = (input: RuntimeInputType): string => input.type === "Radio button" ? "Please select an option." : `Please enter ${input.label.trim() || input.variableName}.`
export const generateRuntimeState = (tool: ToolType, state: ToolRuntimeStateType, outputId: string | Array<string>, shared?: SharedRuntimeScopeType): ToolRuntimeStateType => {
    const targets = generatedTextIds(outputId)
    const values = getRuntimeValues(tool, state.values)
    const errors = Object.fromEntries(tool.elements.filter(isRuntimeInput).filter(input => canShowElement(input, state, tool)).map(input => [input.id, inputError(input, values[input.id])]).filter(([, message]) => message))
    if (Object.keys(errors).length) return { ...state, values, errors, message: "Check the highlighted inputs before generating text." }
    if (!targets.length || targets.some(id => !tool.elements.some(element => element.id === id && element.type === "Output text"))) return { ...state, message: "This button has a missing or invalid generated text link." }
    const sharedError = targets.map(id => sharedOutputError(tool, id, shared)).find(Boolean)
    if (sharedError) return { ...state, values, errors, message: sharedError }
    const scope = { ...tool, elements: [...tool.elements, ...(shared?.inputs ?? [])] }
    const scopeValues = getRuntimeValues(scope, { ...values, ...shared?.values })
    const missing = requiredOutputInputs(scope, targets, scopeValues).filter(input => !(scopeValues[input.id] ?? "").trim())
    if (missing.length) {
        const messages = missing.map(input => {
            const source = shared?.inputs.find(candidate => candidate.id === input.id)
            if (!source) errors[input.id] = requiredInputError(input)
            const message = input.type === "Radio button" ? `Please select an option for ${input.label.trim() || input.variableName}.` : requiredInputError(input)
            return source ? `${source.sourceToolName}: ${message}` : message
        })
        return { ...state, values, errors, message: [...new Set(messages)].join("\n") }
    }
    return { ...state, values, errors, message: "", outputs: { ...state.outputs, ...Object.fromEntries(targets.map(id => [id, generateOutput(id, tool, values, shared)])) }, visibleOutputIds: [...new Set([...state.visibleOutputIds, ...targets])] }
}
export const resetRuntimeState = (): ToolRuntimeStateType => ({ values: {}, outputs: {}, visibleOutputIds: [], errors: {}, message: "" })
export const canShowElement = (element: ElementType, state: ToolRuntimeStateType, tool: ToolType, visited = new Set<string>()): boolean => {
    if (visited.has(element.id)) return false
    const next = new Set([...visited, element.id])
    if (element.containerId) {
        const parent = tool.elements.find(candidate => candidate.id === element.containerId)
        if (!parent || !canShowElement(parent, state, tool, next)) return false
    }
    if (element.type === "Container" && element.visibility) {
        const rule = element.visibility
        const radio = tool.elements.find(candidate => candidate.id === rule.inputId)
        if (radio?.type !== "Radio button" || !radio.options.some(option => option.value === rule.value)) return false
        const selected = state.values[radio.id] === rule.value
        return rule.mode === "show" ? selected : rule.mode === "hide" ? !selected : false
    }
    if (element.type === "Output text") return state.visibleOutputIds.includes(element.id)
    if (element.type === "Copy button" && element.visibility === "when-target-visible") {
        const target = tool.elements.find(candidate => candidate.id === element.link)
        return !!target && canShowElement(target, state, tool, next)
    }
    return true
}
export const getCopyValue = (targetId: string, tool: ToolType, state: ToolRuntimeStateType) => {
    const target = tool.elements.find(element => element.id === targetId)
    if (!target) throw new Error("This copy button is not linked to an element.")
    if (target.type === "Output text") return state.outputs[targetId] ?? ""
    if (isRuntimeInput(target)) return normalizeInput(target, state.values[targetId] ?? "")
    throw new Error("This element cannot be copied.")
}
export const runtimeElementStyle = (element: ElementType): CSSProperties => ({
    ...element.style,
    // The actual Button owns its fill and rounded corners.
    backgroundColor: element.type.endsWith("button") ? undefined : element.style.backgroundColor,
    width: element.size.width.unit === "auto" ? "fit-content" : `${element.size.width.value}${element.size.width.unit}`,
    minWidth: element.type === "Divider" ? undefined : "min-content",
    minHeight: element.size.height.unit === "auto" ? undefined : `${element.size.height.value}${element.size.height.unit}`,
    flexShrink: 0,
})
