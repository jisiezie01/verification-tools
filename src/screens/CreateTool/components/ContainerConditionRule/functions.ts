import type { TextConditionType } from "../../../../types"
import type { InputElementType } from "../../types"
import { CALCULATION_OPERATIONS } from "../../../../data/toolCalculations/data"

export const calculationExpression = (calculation: NonNullable<TextConditionType["calculation"]>, inputs: Array<InputElementType>) => {
    const symbol = CALCULATION_OPERATIONS.find(operation => operation.value === calculation.operation)?.symbol ?? "?"
    return calculation.inputIds.reduce((expression, id, index) => {
        const name = inputs.find(input => input.id === id)?.variableName ?? "Choose a number"
        return index === 0 ? name : `(${expression} ${symbol} ${name})`
    }, "")
}

export const moveCalculationInput = (ids: Array<string>, index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= ids.length) return ids
    const next = [...ids]
    ;[next[index], next[target]] = [next[target], next[index]]
    return next
}
