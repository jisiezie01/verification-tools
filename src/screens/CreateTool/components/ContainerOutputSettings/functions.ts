import type { TextConditionType } from "../../../../types"
import type { InputElementType } from "../../types"

export const createCondition = (input?: InputElementType): TextConditionType => ({ id: crypto.randomUUID(), inputId: input?.id ?? "", operator: "equals", value: input?.type === "Radio button" ? input.options[0]?.value ?? "" : "", text: "" })
export const moveCondition = (conditions: Array<TextConditionType>, index: number, direction: -1 | 1) => {
    const next = [...conditions]
    const target = index + direction
    if (target < 0 || target >= next.length) return conditions
    ;[next[index], next[target]] = [next[target], next[index]]
    return next
}
