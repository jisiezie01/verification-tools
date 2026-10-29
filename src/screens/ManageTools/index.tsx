import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import ContainerManageTools from "./components/ContainerManageTools"
import type { ScreenManageToolsProps } from "./types"

const ScreenManageTools = ({ className = "" }: ScreenManageToolsProps) => {
    return (
        <DndProvider backend={HTML5Backend}><ContainerManageTools className={className} /></DndProvider>
    )
}

export default ScreenManageTools
