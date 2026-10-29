import type { ToolCategoryType, ToolType } from "../../types"
import { reconcileBoard } from "../ManageTools/functions"

export const getToolsWorkspace = (categories: Array<ToolCategoryType>, tools: Array<ToolType>, selectedId?: string | null) => {
    const activeCategories = categories.filter(category => !category.archived)
    const category = activeCategories.find(item => item.id === selectedId) ?? activeCategories[0]
    const board = category ? reconcileBoard(category, tools) : undefined
    const placedTools = board?.placements.flatMap(placement => {
        const tool = tools.find(candidate => candidate.id === placement.toolId && candidate.categoryId === category?.id && !candidate.archived)
        return tool ? [tool] : []
    }) ?? []
    return { categories: activeCategories, category, board, tools: placedTools }
}
