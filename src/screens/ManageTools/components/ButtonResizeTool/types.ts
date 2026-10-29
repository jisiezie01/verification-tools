import type { ToolBoardPlacementType } from "../../../../types"
import type { BoardSizeType } from "../../types"
export type ButtonResizeToolProps = { className?: string; toolId: string; minimum: BoardSizeType; onResize: (placement: ToolBoardPlacementType) => void }
export type ToolResizeSessionType = BoardSizeType & { x: number; y: number }
