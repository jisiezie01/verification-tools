import type { RuntimeActionsType, RuntimeInputType, ToolRuntimeStateType } from "../../types"
export type InputRenderedElementProps = RuntimeActionsType & { className?: string; element: RuntimeInputType; state: ToolRuntimeStateType }
