import type { ToolCategoryType, ToolType } from "../../types"

export type ToolCatalogType = { categories: Array<ToolCategoryType>; tools: Array<ToolType> }
export type ToolCatalogResultType = ToolCatalogType & { error: string }
export type ToolArchiveChangesType = Record<string, boolean>
