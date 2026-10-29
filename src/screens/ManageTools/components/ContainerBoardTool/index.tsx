import { useDrag, useDrop } from "react-dnd"
import { useNavigate } from "react-router-dom"
import ToolRenderer from "../../../../components/ToolRenderer"
import SvgBuilderIcon from "../../../../components/svg/SvgBuilderIcon"
import { BOARD_DRAG_TYPE } from "../../data"
import { editToolUrl } from "../../functions"
import type { BoardDragCollectedType, BoardDragItemType, BoardDropCollectedType } from "../../types"
import ButtonResizeTool from "../ButtonResizeTool"
import { useToolMeasurements } from "../../../../components/ToolRenderer/useToolMeasurements/functions"
import type { ContainerBoardToolProps } from "./types"

const ContainerBoardTool = ({ tool, placement, board, onDrop, onRemove, onMove, onResize, className = "" }: ContainerBoardToolProps) => {
    const navigate = useNavigate()
    const { card, attachCard, content, header, minimum, availableWidth } = useToolMeasurements(tool.elements)
    const index = board.placements.findIndex(item => item.toolId === tool.id)
    const [{ isDragging }, drag, preview] = useDrag<BoardDragItemType, unknown, BoardDragCollectedType>(() => ({ type: BOARD_DRAG_TYPE, item: { source: "board", toolId: tool.id, categoryId: tool.categoryId }, collect: monitor => ({ isDragging: monitor.isDragging() }) }), [tool.id, tool.categoryId])
    const [{ isOver }, drop] = useDrop<BoardDragItemType, unknown, BoardDropCollectedType>(() => ({ accept: BOARD_DRAG_TYPE,
        canDrop: item => item.categoryId === tool.categoryId && item.toolId !== tool.id,
        drop: (item, monitor) => {
            if (monitor.didDrop()) return
            const point = monitor.getClientOffset()
            const rect = card.current?.getBoundingClientRect()
            const isRow = board.direction.startsWith("row")
            let after = !!point && !!rect && (isRow ? point.x > rect.left + rect.width / 2 : point.y > rect.top + rect.height / 2)
            if (board.direction.endsWith("reverse")) after = !after
            onDrop(item.toolId, after ? board.placements[index + 1]?.toolId : tool.id)
            return { handled: true }
        }, collect: monitor => ({ isOver: monitor.isOver({ shallow: true }) && monitor.canDrop() }),
    }), [tool.id, tool.categoryId, board, index, onDrop])
    return <article ref={node => { attachCard(node); preview(node); drop(node) }} data-board-tool={tool.id} data-min-width={minimum.width} data-min-height={minimum.height} aria-label={tool.name} style={{ width: Math.max(placement.width ?? Math.min(400, availableWidth), minimum.width), height: Math.max(placement.height ?? 0, minimum.height), minWidth: minimum.width, minHeight: minimum.height }} className={`group relative shrink-0 rounded-2xl border bg-white/90 shadow-[0_8px_30px_rgba(71,85,105,0.06)] transition-shadow ${isOver ? "border-blue-400 ring-2 ring-blue-200" : "border-slate-200/80"} ${isDragging ? "opacity-35" : ""} ${className}`}>
        <div ref={header} className="flex items-center gap-2 border-b border-slate-100 px-3 py-3">
            <button ref={node => { drag(node) }} type="button" aria-label={`Move ${tool.name}`} title="Drag to reorder" className="cursor-grab rounded-lg p-1 text-slate-400 hover:bg-slate-100 active:cursor-grabbing"><SvgBuilderIcon name="grip" className="size-4" /></button>
            <h3 className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-700" title={tool.name}>{tool.name}</h3>
            <button type="button" aria-label={`Move ${tool.name} earlier`} disabled={index === 0} onClick={() => onMove(tool.id, -1)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-25"><SvgBuilderIcon name="up" className="size-4" /></button>
            <button type="button" aria-label={`Move ${tool.name} later`} disabled={index === board.placements.length - 1} onClick={() => onMove(tool.id, 1)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-25"><SvgBuilderIcon name="down" className="size-4" /></button>
            <button type="button" aria-label={`Edit ${tool.name}`} title="Edit tool" onClick={() => navigate(editToolUrl(tool.id))} className="rounded-lg p-1 text-slate-400 hover:bg-blue-50 hover:text-blue-600"><SvgBuilderIcon name="settings" className="size-4" /></button>
            <button type="button" aria-label={`Remove ${tool.name} from board`} title="Remove from board" onClick={() => onRemove(tool.id)} className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"><SvgBuilderIcon name="close" className="size-4" /></button>
        </div>
        <div ref={content} className="p-5"><ToolRenderer tool={tool} /></div>
        <div className="h-7 px-4"><button type="button" className="text-[10px] text-slate-400 opacity-0 hover:text-blue-600 focus:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100" onClick={() => onResize({ toolId: tool.id })}>Fit content</button></div>
        <ButtonResizeTool toolId={tool.id} minimum={minimum} onResize={onResize} />
    </article>
}
export default ContainerBoardTool
