import type { ToolBoardPlacementType, ToolCategoryBoardType, ToolType } from "../../../../types"
import type { BoardActionsType } from "../../types"
export type ContainerBoardToolProps = BoardActionsType & { className?: string; tool: ToolType; placement: ToolBoardPlacementType; board: ToolCategoryBoardType }
