import { useDrag, useDrop } from "react-dnd"
import SvgBuilderIcon from "../../../../components/svg/SvgBuilderIcon"
import { DRAG_TYPE } from "../../data"
import { canMoveElement, getElementLabel, getElementName, getElementSizeStyle } from "../../functions"
import type { BuilderDragItem, DragCollectedType, DropCollectedType } from "../../types"
import ContainerBuilderTree from "../ContainerBuilderTree"
import ContainerElementSample from "../ContainerElementSample"
import ButtonResizeElement from "../ButtonResizeElement"
import type { ContainerBuilderElementProps } from "./types"

const ContainerBuilderElement = ({ element, elements, selectedId, className = "", ...actions }: ContainerBuilderElementProps) => {
    const selected = selectedId === element.id
    const siblings = elements.filter(candidate => candidate.containerId === element.containerId)
    const index = siblings.findIndex(candidate => candidate.id === element.id)
    const [{ isDragging }, drag, preview] = useDrag<BuilderDragItem, unknown, DragCollectedType>(() => ({ type: DRAG_TYPE, item: { source: "builder", id: element.id }, collect: monitor => ({ isDragging: monitor.isDragging() }) }), [element.id])
    const [{ isOver }, drop] = useDrop<BuilderDragItem, unknown, DropCollectedType>(() => ({ accept: DRAG_TYPE,
        canDrop: item => item.source === "palette" || (item.id !== element.id && canMoveElement(elements, item.id, element.containerId)),
        drop: (item, monitor) => { if (!monitor.didDrop()) actions.onDrop(item, element.containerId, element.id); return { handled: true } },
        collect: monitor => ({ isOver: monitor.isOver({ shallow: true }) && monitor.canDrop() }),
    }), [element, elements, actions.onDrop])
    return <div ref={node => { preview(node); drop(node) }} data-builder-element={element.id} data-element-type={element.type} role="group" aria-label={`${getElementLabel(element.type)}: ${getElementName(element)}`} tabIndex={0}
        style={getElementSizeStyle(element)} onClick={event => { event.stopPropagation(); actions.onSelect(element.id) }} onFocus={event => { if (event.target === event.currentTarget) actions.onSelect(element.id) }}
        onKeyDown={event => { if (event.target !== event.currentTarget) return; if (event.key === "Enter" || event.key === " ") { event.preventDefault(); actions.onSelect(element.id) } if (event.altKey && (event.key === "ArrowUp" || event.key === "ArrowDown")) { event.preventDefault(); actions.onMove(element.id, event.key === "ArrowUp" ? -1 : 1) } }}
        className={`group relative min-h-8 min-w-12 rounded-xl outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-blue-400 ${selected ? "ring-2 ring-blue-400 ring-offset-4 ring-offset-white" : "hover:ring-1 hover:ring-slate-300 hover:ring-offset-4"} ${isDragging ? "opacity-30" : ""} ${isOver ? "border-t-4 border-blue-400" : ""} ${className}`}>
        <div className={`absolute -top-6 right-0 z-20 flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white/95 p-0.5 shadow-sm ${selected ? "flex" : "hidden group-hover:flex group-focus-within:flex"}`}>
            <button ref={node => { drag(node) }} type="button" aria-label={`Drag ${getElementLabel(element.type).toLowerCase()}`} title="Drag to move or delete" className="cursor-grab rounded p-1 text-slate-400 hover:bg-slate-100 active:cursor-grabbing"><SvgBuilderIcon name="grip" className="size-3.5" /></button>
            <button type="button" onClick={event => { event.stopPropagation(); actions.onMove(element.id, -1) }} disabled={index === 0} aria-label="Move element earlier" className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-25"><SvgBuilderIcon name="up" className="size-3.5" /></button>
            <button type="button" onClick={event => { event.stopPropagation(); actions.onMove(element.id, 1) }} disabled={index === siblings.length - 1} aria-label="Move element later" className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-25"><SvgBuilderIcon name="down" className="size-3.5" /></button>
        </div>
        {element.type === "Container" ? <div className="h-full rounded-xl border border-slate-200/80 bg-slate-50/60"><div className="px-3 pt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Container</div><ContainerBuilderTree elements={elements} selectedId={selectedId} containerId={element.id} direction={element.direction} style={{ padding: element.padding, gap: element.gap, justifyContent: element.justifyContent ?? (element.direction === "row" ? "space-between" : "flex-start"), minHeight: element.size.height.unit === "auto" ? undefined : `calc(${element.size.height.value}${element.size.height.unit} - 24px)` }} {...actions} /></div> : <ContainerElementSample element={element} />}
        {selected && <ButtonResizeElement element={element} onChange={actions.onChange} />}
    </div>
}
export default ContainerBuilderElement
