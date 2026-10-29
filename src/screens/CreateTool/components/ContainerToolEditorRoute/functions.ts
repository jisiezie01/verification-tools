import { loadToolCatalog } from "../../../../data/toolCatalog/functions"
import type { ToolType } from "../../../../types"
import { createBuilderState } from "../../functions"
import type { EditorRouteStateType } from "./types"

export const resolveEditorRoute = (toolId: string | null, categoryId: string | null, initialTool?: ToolType): EditorRouteStateType => {
    if (initialTool) return { tool: initialTool, error: "" }
    if (!toolId && !categoryId) return { error: "" }
    const catalog = loadToolCatalog()
    if (catalog.error) return { error: catalog.error }
    if (toolId) {
        const tool = catalog.tools.find(candidate => candidate.id === toolId)
        return tool ? { tool, error: "" } : { error: "This tool could not be found. It may have been removed." }
    }
    if (!catalog.categories.some(category => category.id === categoryId)) return { error: "This category could not be found." }
    return { tool: { ...createBuilderState().tool, categoryId: categoryId! }, error: "" }
}
