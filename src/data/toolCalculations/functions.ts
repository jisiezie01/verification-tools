import type { ElementType, TextConditionType } from "../../types"
import { CALCULATION_OPERATIONS } from "./data"

export const conditionInputIds = (rule: TextConditionType): Array<string> => [
    ...(rule.calculation ? Array.isArray(rule.calculation.inputIds) ? rule.calculation.inputIds : [] : [rule.inputId]),
    ...(rule.comparisonInputId !== undefined ? [rule.comparisonInputId] : []),
    ...(rule.offsetInputId !== undefined ? [rule.offsetInputId] : []),
]

export const calculationDefinitionError = (calculation: NonNullable<TextConditionType["calculation"]>, inputs: Array<Pick<ElementType, "id" | "type">>): string => {
    if (!CALCULATION_OPERATIONS.some(operation => operation.value === calculation.operation)) return "Choose a valid calculation operation."
    if (!Array.isArray(calculation.inputIds) || calculation.inputIds.length < 2) return "Choose at least two number inputs for the calculation."
    if (calculation.inputIds.some(id => !inputs.some(input => input.id === id && input.type === "Number input"))) return "Choose an available number input for every calculation position."
    return ""
}

export const calculateNumbers = (operation: NonNullable<TextConditionType["calculation"]>["operation"], numbers: Array<number>) => {
    if (numbers.length < 2 || numbers.some(value => !Number.isFinite(value))) return { value: undefined, error: "The calculation needs at least two valid numbers." }
    let value = numbers[0]
    for (const next of numbers.slice(1)) {
        switch (operation) {
            case "sum": value += next; break
            case "difference": value -= next; break
            case "product": value *= next; break
            case "quotient":
                if (next === 0) return { value: undefined, error: "Cannot divide by zero. Change the divisor before generating text." }
                value /= next
                break
            default: return { value: undefined, error: "Choose a valid calculation operation." }
        }
        if (!Number.isFinite(value)) return { value: undefined, error: "The calculation result is too large. Use smaller numbers." }
    }
    return { value, error: "" }
}
