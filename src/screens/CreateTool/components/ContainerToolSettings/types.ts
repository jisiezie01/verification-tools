import type { ToolCategoryType, ToolType } from "../../../../types"
export type ContainerToolSettingsProps = {
    className?: string
    tool: ToolType
    categories: Array<ToolCategoryType>
    onNameChange: (name: string) => void
    onCategoryChange: (categoryId: string) => void
    onGlobalChange: (isGlobal: boolean) => void
    onCreateCategory: (category: ToolCategoryType) => void | Promise<void>
}
