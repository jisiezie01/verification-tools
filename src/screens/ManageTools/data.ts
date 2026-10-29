import type { ToolCategoryBoardType } from "../../types"

export const BOARD_DRAG_TYPE = "CATEGORY_BOARD_TOOL"
export const DEFAULT_BOARD: ToolCategoryBoardType = { direction: "row", wrap: "wrap", gap: 20, placements: [], removedToolIds: [] }
export const BOARD_DIRECTIONS = [{ value: "row", label: "Row" }, { value: "column", label: "Column" }, { value: "row-reverse", label: "Row, reversed" }, { value: "column-reverse", label: "Column, reversed" }]
export const BOARD_WRAPS = [{ value: "wrap", label: "Wrap" }, { value: "nowrap", label: "No wrap" }, { value: "wrap-reverse", label: "Wrap, reversed" }]
