import type { CSSProperties } from "react"
import type { ElementType, ToolCategoryType, ToolType } from "../../types"

export type ScreenCreateToolProps = {
    className?: string
    initialTool?: ToolType
    categories?: Array<ToolCategoryType>
    onSave?: (tool: ToolType) => void | Promise<void>
    onExit?: (categoryId: string) => void
}
export type BuilderDragItem =
    | { source: "palette"; elementType: ElementType["type"] }
    | { source: "builder"; id: string }
export type DragCollectedType = { isDragging: boolean }
export type DropCollectedType = { isOver: boolean }
export type PaletteItemType = {
    type: ElementType["type"]
    label: string
    description: string
    icon: "button" | "input" | "text" | "container" | "divider" | "radio" | "calendar" | "output"
    group: "Actions" | "Inputs" | "Layout & content"
}
export type InputElementType = Extract<ElementType, { variableName: string }>
export type TextElementType = Extract<ElementType, { type: "Text" | "Header 1" | "Header 2" | "Header 3" | "Label" }>
export type ButtonElementType = Extract<ElementType, { type: "Generate button" | "Reset button" | "Copy button" }>
export type ElementSettingsProps<T extends ElementType = ElementType> = {
    className?: string
    element: T
    elements: Array<ElementType>
    onChange: (element: ElementType, previousId?: string) => void
}
export type BuilderActionsType = {
    onSelect: (id: string | null) => void
    onDrop: (item: BuilderDragItem, containerId?: string, beforeId?: string) => void
    onChange: (element: ElementType) => void
    onDelete: (id: string) => void
    onMove: (id: string, direction: -1 | 1) => void
}
export type BuilderTreeProps = BuilderActionsType & {
    className?: string
    elements: Array<ElementType>
    selectedId: string | null
    containerId?: string
    direction?: "row" | "column"
    style?: CSSProperties
}
export type BuilderStateType = { tool: ToolType; selectedId: string | null; revision: number }
export type BuilderActionType =
    | { type: "select"; id: string | null }
    | { type: "metadata"; name?: string; categoryId?: string; isGlobal?: boolean }
    | { type: "drop"; item: BuilderDragItem; containerId?: string; beforeId?: string }
    | { type: "change"; element: ElementType; previousId?: string }
    | { type: "delete"; id: string }
    | { type: "duplicate"; id: string }
    | { type: "move"; id: string; direction: -1 | 1 }
