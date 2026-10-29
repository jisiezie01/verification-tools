import type { ElementType, ToolType } from "../../types"
import type { CategoryInputValuesType, SharedInputType, SharedRuntimeScopeType } from "./types"

export const sharedInputId = (toolId: string, inputId: string) => `global:${toolId}:${inputId}`
export const getGlobalInputs = (tool: ToolType, tools: Array<ToolType>): Array<SharedInputType> => tools
    .filter(source => source.id !== tool.id && source.categoryId === tool.categoryId && source.isGlobal && !source.archived)
    .flatMap(source => source.elements.filter((element): element is Extract<ElementType, { variableName: string }> => "variableName" in element).map(input => ({
        ...input, id: sharedInputId(source.id, input.id), variableName: `global.${input.variableName}`,
        label: `${input.label || input.variableName} · ${source.name}`,
        sourceToolId: source.id, sourceInputId: input.id, sourceToolName: source.name,
    })))
export const getSharedScope = (tool: ToolType, tools: Array<ToolType>, values: CategoryInputValuesType): SharedRuntimeScopeType => {
    const inputs = getGlobalInputs(tool, tools)
    return { inputs, values: Object.fromEntries(inputs.map(input => [input.id, values[input.sourceToolId]?.[input.sourceInputId] ?? ""])) }
}
export const globalVariableConflicts = (tool: ToolType, tools: Array<ToolType>) => {
    if (!tool.isGlobal || tool.archived) return []
    const shared = getGlobalInputs(tool, tools)
    return tool.elements.flatMap(input => "variableName" in input && shared.some(other => other.variableName === `global.${input.variableName}`)
        ? [`Global variable "${input.variableName}" is already published by another tool in this category. Choose a unique variable name.`] : [])
}
