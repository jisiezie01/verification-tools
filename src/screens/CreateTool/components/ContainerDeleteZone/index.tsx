import { useDragLayer, useDrop } from "react-dnd"
import SvgBuilderIcon from "../../../../components/svg/SvgBuilderIcon"
import { DRAG_TYPE } from "../../data"
import type { BuilderDragItem, DropCollectedType } from "../../types"
import type { ContainerDeleteZoneProps } from "./types"

const ContainerDeleteZone = ({ onDelete, className = "" }: ContainerDeleteZoneProps) => {
    const active = useDragLayer(monitor => monitor.isDragging() && monitor.getItem<BuilderDragItem>()?.source === "builder")
    const [{ isOver }, drop] = useDrop<BuilderDragItem, unknown, DropCollectedType>(() => ({ accept: DRAG_TYPE, canDrop: item => item.source === "builder", drop: item => { if (item.source === "builder") onDelete(item.id); return { handled: true } }, collect: monitor => ({ isOver: monitor.isOver() && monitor.canDrop() }) }), [onDelete])
    return active ? <div ref={node => { drop(node) }} role="region" aria-label="Drop to delete element" className={`fixed bottom-6 left-1/2 z-50 flex w-[min(400px,90vw)] -translate-x-1/2 items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-6 text-sm font-semibold shadow-xl backdrop-blur-xl ${isOver ? "border-red-500 bg-red-100 text-red-700" : "border-red-300 bg-white/95 text-red-500"} ${className}`}><SvgBuilderIcon name="trash" />Drop here to delete</div> : null
}
export default ContainerDeleteZone
