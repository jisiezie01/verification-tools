import { useDrop } from "react-dnd"
import { DRAG_TYPE } from "../../data"
import { canMoveElement } from "../../functions"
import type { BuilderDragItem, DropCollectedType } from "../../types"
import ContainerBuilderElement from "../ContainerBuilderElement"
import type { ContainerBuilderTreeProps } from "./types"

const ContainerBuilderTree = ({ elements, selectedId, containerId, direction = "column", style, className = "", ...actions }: ContainerBuilderTreeProps) => {
    const children = elements.filter(element => element.containerId === containerId)
    const [{ isOver }, drop] = useDrop<BuilderDragItem, unknown, DropCollectedType>(() => ({
        accept: DRAG_TYPE,
        canDrop: item => item.source === "palette" || canMoveElement(elements, item.id, containerId),
        drop: (item, monitor) => { if (!monitor.didDrop()) actions.onDrop(item, containerId); return { handled: true } },
        collect: monitor => ({ isOver: monitor.isOver({ shallow: true }) && monitor.canDrop() }),
    }), [elements, containerId, actions.onDrop])
    return <div ref={node => { drop(node) }} data-builder-drop={containerId ?? "root"} style={style} className={`flex min-w-0 flex-1 items-start rounded-2xl border border-dashed transition-colors ${direction === "row" ? "flex-row flex-wrap" : "flex-col"} ${containerId ? "min-h-28" : "min-h-[440px] gap-5 p-5"} ${isOver ? "border-blue-400 bg-blue-50/70" : "border-transparent"} ${className}`}>
        {children.map(element => <ContainerBuilderElement key={element.id} element={element} elements={elements} selectedId={selectedId} {...actions} />)}
        {!children.length && <div className={`flex w-full flex-1 flex-col items-center justify-center self-stretch rounded-xl border border-dashed border-slate-200/90 px-4 py-8 text-center ${containerId ? "min-h-20" : "min-h-80"}`}><span className="text-sm font-medium text-slate-500">{containerId ? "Drop elements inside" : "Your next tool starts here"}</span><span className="mt-2 max-w-60 text-xs leading-5 text-slate-400">{containerId ? "Group fields, buttons, and content." : "Drag an element from the left, or click one to add it to your canvas."}</span></div>}
        {!!children.length && <div className="basis-full self-stretch rounded-xl border border-dashed border-slate-200/70 px-3 py-3 text-center text-[11px] text-slate-400">Drop here to append{containerId ? " inside this container" : " to the canvas"}</div>}
    </div>
}
export default ContainerBuilderTree
