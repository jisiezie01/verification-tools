import type { TextConditionType } from "../../../../types"
import type { InputElementType } from "../../types"
export type ContainerConditionRuleProps = {
    className?: string
    rule: TextConditionType
    index: number
    count: number
    inputs: Array<InputElementType>
    onChange: (rule: TextConditionType) => void
    onDelete: () => void
    onMove: (direction: -1 | 1) => void
}
