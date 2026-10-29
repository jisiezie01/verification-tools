import type { BoardSizeType } from "../../types"
import type { ToolResizeSessionType } from "./types"

export const resizedToolSize = (session: ToolResizeSessionType, minimum: BoardSizeType, x: number, y: number): BoardSizeType => ({ width: Math.max(minimum.width, Math.round(session.width + x - session.x)), height: Math.max(minimum.height, Math.round(session.height + y - session.y)) })
