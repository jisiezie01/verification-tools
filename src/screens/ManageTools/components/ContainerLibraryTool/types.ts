import type { ToolType } from "../../../../types"
export type ContainerLibraryToolProps = { className?: string; tool: ToolType; onAdd: (toolId: string) => void; onArchive: (tool: ToolType, archived: boolean) => void }
