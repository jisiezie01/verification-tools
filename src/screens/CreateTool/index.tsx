import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import ContainerToolEditorRoute from "./components/ContainerToolEditorRoute"
import type { ScreenCreateToolProps } from "./types"

const ScreenCreateTool = (props: ScreenCreateToolProps) => {
    return (
        <DndProvider backend={HTML5Backend}><ContainerToolEditorRoute {...props} /></DndProvider>
    )
}

export default ScreenCreateTool
