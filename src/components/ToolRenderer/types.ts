import type { ElementType, ToolType } from "../../types"

export type ToolRendererProps = { className?: string; tool: ToolType }
export type RuntimeInputType = Extract<ElementType, { variableName: string }>
export type RuntimeValuesType = Record<string, string>
export type ToolRuntimeStateType = {
    values: RuntimeValuesType
    outputs: Record<string, string>
    visibleOutputIds: Array<string>
    errors: Record<string, string>
    message: string
}
export type RuntimeActionsType = {
    onInput: (element: RuntimeInputType, value: string) => void
    onBlur: (element: RuntimeInputType) => void
    onGenerate: (outputId: string | Array<string>) => void
    onReset: () => void
    onCopy: (targetId: string, confirmCopy: boolean, message: string) => void
}
export type RuntimeTreeProps = RuntimeActionsType & {
    className?: string
    tool: ToolType
    state: ToolRuntimeStateType
    containerId?: string
    ancestors?: Array<string>
}
