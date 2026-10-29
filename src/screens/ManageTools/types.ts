import type { ToolArchiveChangesType, ToolCatalogType } from "../../data/toolCatalog/types"
import type { ToolBoardPlacementType, ToolCategoryBoardType, ToolCategoryType, ToolType } from "../../types"

export type ScreenManageToolsProps = { className?: string }
export type ManagedCategoryType = ToolCategoryType & { board: ToolCategoryBoardType }
export type CategoryDraftType = { category: ManagedCategoryType; archiveChanges: ToolArchiveChangesType }
export type ManageBoardActionType =
    | { type: "category"; changes: Partial<Pick<ToolCategoryType, "name" | "archived">> }
    | { type: "layout"; changes: Partial<Pick<ToolCategoryBoardType, "direction" | "wrap" | "gap">> }
    | { type: "drop"; tool: ToolType; beforeId?: string }
    | { type: "remove"; toolId: string }
    | { type: "move"; toolId: string; direction: -1 | 1 }
    | { type: "resize"; placement: ToolBoardPlacementType }
    | { type: "archive-tool"; tool: ToolType; archived: boolean }
    | { type: "replace"; draft: CategoryDraftType }
export type BoardDragItemType = { source: "board" | "library"; toolId: string; categoryId: string }
export type BoardDragCollectedType = { isDragging: boolean }
export type BoardDropCollectedType = { isOver: boolean }
export type BoardSizeType = { width: number; height: number }
export type BoardActionsType = {
    onDrop: (toolId: string, beforeId?: string) => void
    onRemove: (toolId: string) => void
    onMove: (toolId: string, direction: -1 | 1) => void
    onResize: (placement: ToolBoardPlacementType) => void
    onArchive: (tool: ToolType, archived: boolean) => void
}
export type CategoryWorkspaceProps = {
    className?: string
    category: ToolCategoryType
    catalog: ToolCatalogType
    onSaved: (catalog: ToolCatalogType) => void
}
