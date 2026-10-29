import type { ToolCategoryType, ToolType } from "../../../../types"
import type { BoardActionsType, ManagedCategoryType } from "../../types"
export type ContainerToolBoardProps = BoardActionsType & { className?: string; category: ManagedCategoryType; categories: Array<ToolCategoryType>; tools: Array<ToolType> }
