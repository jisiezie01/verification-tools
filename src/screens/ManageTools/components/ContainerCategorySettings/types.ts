import type { ToolCategoryBoardType, ToolType } from "../../../../types"
import type { ManagedCategoryType } from "../../types"
export type ContainerCategorySettingsProps = {
    className?: string
    category: ManagedCategoryType
    tools: Array<ToolType>
    dirty: boolean
    error: string
    savedMessage: string
    onName: (name: string) => void
    onLayout: (changes: Partial<Pick<ToolCategoryBoardType, "direction" | "wrap" | "gap">>) => void
    onArchiveCategory: (archived: boolean) => void
    onArchiveTool: (tool: ToolType, archived: boolean) => void
    onAdd: (toolId: string) => void
    onSave: () => boolean | Promise<boolean>
}
