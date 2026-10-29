import type { ReactNode } from "react"
import type { ToolType } from "../../types"
import type { CategoryInputValuesType } from "../../data/toolVariables/types"

export type ContainerCategoryRuntimeProps = { className?: string; tools: Array<ToolType>; children: ReactNode }
export type CategoryRuntimeContextType = {
    tools: Array<ToolType>
    values: CategoryInputValuesType
    setInput: (toolId: string, inputId: string, value: string) => void
    resetInputs: (toolId: string) => void
}
