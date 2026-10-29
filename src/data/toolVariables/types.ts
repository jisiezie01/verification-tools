import type { ElementType } from "../../types"

export type SharedInputType = Extract<ElementType, { variableName: string }> & {
    sourceToolId: string
    sourceInputId: string
    sourceToolName: string
}
export type CategoryInputValuesType = Record<string, Record<string, string>>
export type SharedRuntimeScopeType = {
    inputs: Array<SharedInputType>
    values: Record<string, string>
}
