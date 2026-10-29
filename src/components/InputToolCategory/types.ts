import type { ToolCategoryType } from "../../types"
export type InputToolCategoryProps = {
    className?: string
    value: string
    categories: Array<ToolCategoryType>
    onChange: (id: string) => void
    onCreate: (category: ToolCategoryType) => void | Promise<void>
}
