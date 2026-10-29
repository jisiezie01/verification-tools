import type { ToolCategoryType } from "../../../../types"
export type ContainerCategoryModalProps = {
    className?: string
    categories: Array<ToolCategoryType>
    onCreate: (category: ToolCategoryType) => void | Promise<void>
    onClose: () => void
}
