import type { ElementType } from "../../../../types"
import type { ResizeSessionType } from "./types"

export const resizeElement = (element: ElementType, session: ResizeSessionType, x: number, y: number): ElementType => {
    const width = Math.max(40, Math.min(session.parentWidth, session.width + x - session.x))
    const height = Math.max(24, session.height + y - session.y)
    return { ...element, size: {
        width: element.size.width.unit === "%" ? { unit: "%", value: Math.min(100, Math.max(1, Math.round(width / session.parentWidth * 100))) } : { unit: "px", value: Math.round(width) },
        height: { unit: "px", value: Math.round(height) },
    } }
}
