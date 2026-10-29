import type { ElementType } from "../../../../types"
export type ButtonResizeElementProps = { className?: string; element: ElementType; onChange: (element: ElementType) => void }
export type ResizeSessionType = { x: number; y: number; width: number; height: number; parentWidth: number }
