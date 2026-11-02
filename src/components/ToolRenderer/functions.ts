import type { CSSProperties } from "react"
import { generatedTextIds } from "../../data/toolLinks/functions"
import { calculateNumbers, calculationDefinitionError, conditionInputIds } from "../../data/toolCalculations/functions"
import { analyzeExpression, calculateExpression } from "../../data/toolCalculations/expression"
import type { SharedRuntimeScopeType } from "../../data/toolVariables/types"
import type { DateLimitType, ElementType, TextConditionType, ToolType } from "../../types"
import type { RuntimeInputType, RuntimeValuesType, ToolRuntimeStateType } from "./types"

export const isRuntimeInput = (element: ElementType): element is RuntimeInputType => "variableName" in element
export const localDate = () => {
    const today = new Date()
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
}
export const parseDateInput = (value: string) => {
    const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
    const iso = match ? `${match[3]}-${match[1]}-${match[2]}` : value
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return undefined
    const date = new Date(`${iso}T12:00:00Z`)
    return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== iso ? undefined : iso
}
export const formatDateInput = (value: string) => {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    return match ? `${match[2]}/${match[3]}/${match[1]}` : value
}
export const dateBoundary = (limit: DateLimitType) => limit.mode === "today" ? localDate() : limit.mode === "fixed" ? limit.value : undefined
const addDateOffset = (timestamp: number, offset: number, unit: NonNullable<TextConditionType["offsetUnit"]>) => {
    const date = new Date(timestamp)
    if (unit === "days") return timestamp + offset * 86400000
    const day = date.getUTCDate()
    date.setUTCDate(1)
    if (unit === "months") date.setUTCMonth(date.getUTCMonth() + offset)
    else date.setUTCFullYear(date.getUTCFullYear() + offset)
    const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate()
    date.setUTCDate(Math.min(day, lastDay))
    return date.getTime()
}
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
    if (element.type === "Date input") return parseDateInput(value) ?? value
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
        const date = parseDateInput(value)
        if (!date) return "Enter a valid date in MM/DD/YYYY format."
        const min = dateBoundary(element.min)
        const max = dateBoundary(element.max)
        if (min && date < min) return `Choose ${formatDateInput(min)} or a later date.`
        if (max && date > max) return `Choose ${formatDateInput(max)} or an earlier date.`
    }
    if (element.type === "Radio button" && !element.options.some(option => option.value === value)) return "Choose one of the available options."
    return ""
}
export const evaluateCalculation = (calculation: NonNullable<TextConditionType["calculation"]>, tool: ToolType, values: RuntimeValuesType) => {
    const definitionError = calculationDefinitionError(calculation, tool.elements)
    if (definitionError) return { value: undefined, error: definitionError }
    const numbers: Array<number> = []
    for (const id of calculation.inputIds) {
        const input = tool.elements.find(element => element.id === id)
        if (input?.type !== "Number input") return { value: undefined, error: "A calculation number input is unavailable." }
        const raw = values[id] ?? ""
        if (!raw.trim()) return { value: undefined, error: `Please enter ${input.label || input.variableName}.` }
        const error = inputError(input, raw)
        if (error) return { value: undefined, error: `${input.label || input.variableName}: ${error}` }
        numbers.push(Number(raw))
    }
    return calculateNumbers(calculation.operation, numbers)
}
export const matchesCondition = (condition: TextConditionType, tool: ToolType, values: RuntimeValuesType) => {
    const calculation = condition.calculation ? evaluateCalculation(condition.calculation, tool, values) : undefined
    if (calculation?.error) return false
    const input = tool.elements.find(element => element.id === condition.inputId)
    const inputType = calculation ? "Number input" : input?.type
    const raw = values[condition.inputId] ?? ""
    if (!calculation && (!input || !isRuntimeInput(input) || !raw || inputError(input, raw))) return false
    let actual: string | number = calculation?.value ?? raw
    let comparison = condition.value
    let offset = condition.offset ?? 0
    if (condition.offsetInputId !== undefined) {
        const offsetInput = tool.elements.find(element => element.id === condition.offsetInputId)
        const rawOffset = values[condition.offsetInputId] ?? ""
        if (offsetInput?.type !== "Number input" || !rawOffset.trim() || inputError(offsetInput, rawOffset)) return false
        offset = Number(rawOffset)
    }
    if (!Number.isFinite(offset)) return false
    if (condition.comparisonInputId !== undefined) {
        const other = tool.elements.find(element => element.id === condition.comparisonInputId)
        comparison = values[condition.comparisonInputId] ?? ""
        if (!other || !isRuntimeInput(other) || other.type !== inputType || !comparison.trim() || inputError(other, comparison)) return false
    }
    let expected: string | number = comparison
    if (inputType === "Number input") {
        actual = calculation?.value ?? Number(raw); expected = Number(comparison) + offset
        if (!comparison.trim() || !Number.isFinite(actual) || !Number.isFinite(expected)) return false
    } else if (inputType === "Date input") {
        const date = comparison === "today" ? localDate() : comparison
        const timestamp = Date.parse(`${date}T00:00:00Z`)
        if (!Number.isInteger(offset) || !Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== date) return false
        actual = Date.parse(`${raw}T00:00:00Z`)
        if (!Number.isInteger(offset) || !["days", "months", "years"].includes(condition.offsetUnit ?? "days")) return false
        expected = addDateOffset(timestamp, offset, condition.offsetUnit ?? "days")
    }
    else if (inputType !== "Radio button") return false
    if (inputType === "Radio button" && !["equals", "not-equals"].includes(condition.operator)) return false
    // Absorb arithmetic round-off (e.g. 0.1 + 0.2), while keeping integer comparisons exact.
    const equal = actual === expected || (!!condition.calculation && typeof actual === "number" && typeof expected === "number"
        && !(Number.isInteger(actual) && Number.isInteger(expected))
        && Math.abs(actual - expected) <= Number.EPSILON * Math.max(Math.abs(actual), Math.abs(expected)) * condition.calculation.inputIds.length)
    switch (condition.operator) {
        case "equals": return equal
        case "not-equals": return !equal
        case "greater-than": return !equal && actual > expected
        case "less-than": return !equal && actual < expected
        case "at-least": return equal || actual > expected
        case "at-most": return equal || actual < expected
    }
}
export const outputCalculationError = (tool: ToolType, outputId: string, values: RuntimeValuesType): string => {
    const output = tool.elements.find(element => element.id === outputId)
    if (output?.type !== "Output text") return ""
    let template = output.generatedText.default
    for (const [index, rule] of output.conditions.entries()) {
        if (rule.calculation) {
            const result = evaluateCalculation(rule.calculation, tool, values)
            if (result.error) return `Rule ${index + 1}: ${result.error}`
        }
        if (rule.offsetInputId !== undefined) {
            const offsetInput = tool.elements.find(element => element.id === rule.offsetInputId)
            const rawOffset = values[rule.offsetInputId] ?? ""
            if (offsetInput?.type !== "Number input") return `Rule ${index + 1}: choose a number input for the date offset.`
            if (rawOffset.trim() && Number.isFinite(Number(rawOffset)) && !Number.isInteger(Number(rawOffset))) return `Rule ${index + 1}: date offset must be a whole number of ${rule.offsetUnit ?? "days"}.`
        }
        // Later calculations are irrelevant once a preceding rule matches.
        if (matchesCondition(rule, tool, values)) { template = rule.text; break }
        if (conditionInputIds(rule).some(id => !(values[id] ?? "").trim())) break
    }
    const variables = new Map(tool.elements.filter(isRuntimeInput).map(element => [element.variableName, values[element.id] ?? ""]))
    const numberVariables = new Set(tool.elements.filter(element => element.type === "Number input").map(element => element.variableName))
    for (const match of template.matchAll(/\$\{([^}]+)\}/g)) {
        const expression = match[1]
        if (expression === "calc.result" || !/[()+\-*/\d]/.test(expression)) continue
        const result = calculateExpression(expression, variables, numberVariables)
        if (result.error) return `Generated text formula: ${result.error}`
    }
    return ""
}
// Keep ISO dates in runtime state for native inputs and comparisons; format only text output.
const formatInputText = (element: RuntimeInputType, value: string) => element.type === "Date input" ? formatDateInput(value) : value
export const resolveTemplate = (template: string, tool: ToolType, values: RuntimeValuesType, calculationResult?: number) => {
    const inputs = tool.elements.filter(isRuntimeInput)
    const variables = new Map(inputs.map(element => [element.variableName, values[element.id] ?? ""]))
    const numberVariables = new Set(inputs.filter(element => element.type === "Number input").map(element => element.variableName))
    // A single replacement pass keeps user input literal, including ${...} text.
    return template.replace(/\$\{([^}]+)\}/g, (_match, name: string) => {
        if (name === "calc.result") return calculationResult === undefined ? "" : String(calculationResult)
        if (!/[()+\-*/\d]/.test(name)) {
            const input = inputs.find(element => element.variableName === name)
            return input ? formatInputText(input, variables.get(name) ?? "") : ""
        }
        const result = calculateExpression(name, variables, numberVariables)
        return result.formatted ?? (result.value === undefined ? "" : String(result.value))
    })
}
export const generateOutput = (outputId: string, tool: ToolType, values: RuntimeValuesType, shared?: SharedRuntimeScopeType) => {
    const output = tool.elements.find(element => element.id === outputId && element.type === "Output text")
    if (!output || output.type !== "Output text") return ""
    const scope = { ...tool, elements: [...tool.elements, ...(shared?.inputs ?? [])] }
    const normalized = getRuntimeValues(scope, { ...values, ...shared?.values })
    if (outputCalculationError(scope, outputId, normalized)) return ""
    const condition = output.conditions.find(rule => matchesCondition(rule, scope, normalized))
    const calculationResult = condition?.calculation ? evaluateCalculation(condition.calculation, scope, normalized).value : undefined
    return resolveTemplate(condition?.text ?? output.generatedText.default, scope, normalized, calculationResult)
}
export const sharedOutputError = (tool: ToolType, outputId: string, shared?: SharedRuntimeScopeType) => {
    const output = tool.elements.find(element => element.id === outputId && element.type === "Output text")
    if (output?.type !== "Output text") return ""
    const names = new Set([output.generatedText.default, ...output.conditions.map(rule => rule.text)].flatMap(text => [...text.matchAll(/\$\{(global\.[^}]+)\}/g)].map(match => match[1])))
    const ids = new Set(output.conditions.flatMap(conditionInputIds).filter(id => id.startsWith("global:")))
    const inputs = shared?.inputs ?? []
    if ([...names].some(name => !inputs.some(input => input.variableName === name)) || [...ids].some(id => !inputs.some(input => input.id === id))) return "A shared variable is unavailable. Add its Global tool to this category's board, or update the generated text's variables."
    if ([...names].some(name => inputs.filter(input => input.variableName === name).length > 1)) return "Multiple Global tools publish the same variable name. Give their inputs unique variable names."
    for (const input of inputs.filter(input => names.has(input.variableName) || ids.has(input.id))) {
        const issue = inputError(input, normalizeInput(input, shared?.values[input.id] ?? ""))
        if (issue) return `${input.sourceToolName} — ${input.label.split(" · ")[0]}: ${issue}`
    }
    return ""
}
export const getDefaultInputValues = (tool: ToolType): RuntimeValuesType => Object.fromEntries(tool.elements.flatMap(element =>
    element.type === "Number input" && element.defaultValue !== undefined ? [[element.id, String(element.defaultValue)]] : []))
export const createRuntimeState = (tool: ToolType, shared?: SharedRuntimeScopeType): ToolRuntimeStateType => {
    const visible = tool.elements.filter(element => element.type === "Output text" && !element.initiallyHidden)
    const values = getDefaultInputValues(tool)
    return { values, errors: {}, outputs: Object.fromEntries(visible.map(element => [element.id, generateOutput(element.id, tool, values, shared)])), visibleOutputIds: visible.map(element => element.id), message: "" }
}
export const requiredOutputInputs = (tool: ToolType, targets: Array<string>, values: RuntimeValuesType): Array<RuntimeInputType> => {
    const required = new Set<string>()
    for (const id of targets) {
        const output = tool.elements.find(element => element.id === id)
        if (output?.type !== "Output text") continue
        let template = output.generatedText.default
        let resolved = true
        for (const rule of output.conditions) {
            const ids = conditionInputIds(rule)
            ids.forEach(id => required.add(id))
            // Ask for the first unanswered condition before choosing a branch.
            if (ids.some(id => !(values[id] ?? "").trim()) || (rule.calculation && evaluateCalculation(rule.calculation, tool, values).error)) { resolved = false; break }
            if (matchesCondition(rule, tool, values)) { template = rule.text; break }
        }
        if (resolved) {
            const names = new Set([...template.matchAll(/\$\{([^}]+)\}/g)].flatMap(match => {
                if (match[1] === "calc.result") return []
                return /[()+\-*/\d]/.test(match[1]) ? analyzeExpression(match[1]).variableNames : [match[1]]
            }))
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
    const calculationError = targets.map(id => outputCalculationError(scope, id, scopeValues)).find(Boolean)
    if (calculationError) return { ...state, values, errors, message: calculationError }
    return { ...state, values, errors, message: "", outputs: { ...state.outputs, ...Object.fromEntries(targets.map(id => [id, generateOutput(id, tool, values, shared)])) }, visibleOutputIds: [...new Set([...state.visibleOutputIds, ...targets])] }
}
export const resolveRadioOutputs = (tool: ToolType, state: ToolRuntimeStateType, shared?: SharedRuntimeScopeType): ToolRuntimeStateType => {
    const visible = tool.elements.filter(element => element.type === "Output text" && element.visibility && canShowElement(element, state, tool))
    const scope = { ...tool, elements: [...tool.elements, ...(shared?.inputs ?? [])] }
    const values = getRuntimeValues(scope, { ...state.values, ...shared?.values })
    const calculationError = visible.map(element => outputCalculationError(scope, element.id, values)).find(Boolean)
    return {
        ...state,
        message: calculationError || state.message,
        outputs: { ...state.outputs, ...Object.fromEntries(visible.map(element => [element.id, generateOutput(element.id, tool, state.values, shared)])) },
    }
}
export const resetRuntimeState = (tool?: ToolType): ToolRuntimeStateType => ({ values: tool ? getDefaultInputValues(tool) : {}, outputs: {}, visibleOutputIds: [], errors: {}, message: "" })
export const canShowElement = (element: ElementType, state: ToolRuntimeStateType, tool: ToolType, visited = new Set<string>()): boolean => {
    if (visited.has(element.id)) return false
    const next = new Set([...visited, element.id])
    if (element.containerId) {
        const parent = tool.elements.find(candidate => candidate.id === element.containerId)
        if (!parent || !canShowElement(parent, state, tool, next)) return false
    }
    if ((element.type === "Container" || element.type === "Output text") && element.visibility) {
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
    if (isRuntimeInput(target)) return formatInputText(target, normalizeInput(target, state.values[targetId] ?? ""))
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
