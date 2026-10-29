import type { ToolCategoryType } from "../../../../types"

export const validateCategoryName = (name: string, categories: Array<ToolCategoryType>) => {
    if (!name.trim()) return "Enter a category name."
    if (categories.some(category => category.name.toLowerCase() === name.trim().toLowerCase())) return "A category with this name already exists."
    return ""
}
