import { useDrag } from "react-dnd"
import { useNavigate } from "react-router-dom"
import Button from "../../../../components/Button"
import SvgBuilderIcon from "../../../../components/svg/SvgBuilderIcon"
import { BOARD_DRAG_TYPE } from "../../data"
import { editToolUrl, viewToolUrl } from "../../functions"
import type { BoardDragCollectedType, BoardDragItemType } from "../../types"
import type { ContainerLibraryToolProps } from "./types"

const ContainerLibraryTool = ({ tool, onAdd, onArchive, className = "" }: ContainerLibraryToolProps) => {
    const navigate = useNavigate()
    const [{ isDragging }, drag] = useDrag<BoardDragItemType, unknown, BoardDragCollectedType>(() => ({ type: BOARD_DRAG_TYPE, item: { source: "library", toolId: tool.id, categoryId: tool.categoryId }, collect: monitor => ({ isDragging: monitor.isDragging() }) }), [tool.id, tool.categoryId])
    return <article data-library-tool={tool.id} className={`rounded-2xl border p-3 ${tool.archived ? "border-slate-200/50 bg-white/20 text-slate-500" : "border-white/90 bg-white/65 shadow-sm"} ${isDragging ? "opacity-35" : ""} ${className}`}>
        <div className="flex items-center gap-2"><button ref={node => { drag(node) }} type="button" aria-label={`Drag ${tool.name} to board`} title="Drag onto the board" className="cursor-grab rounded-lg p-1 text-slate-400 hover:bg-white active:cursor-grabbing"><SvgBuilderIcon name="grip" className="size-4" /></button><h4 className="min-w-0 flex-1 truncate text-xs font-semibold" title={tool.name}>{tool.name}</h4><button type="button" aria-label={`${tool.archived ? "Restore" : "Archive"} ${tool.name}`} title={tool.archived ? "Restore tool" : "Archive tool"} onClick={() => onArchive(tool, !tool.archived)} className="rounded-lg p-1 text-slate-400 hover:bg-white hover:text-slate-700"><SvgBuilderIcon name="archive" className="size-4" /></button></div>
        <div className="mt-3 flex gap-1.5"><Button variant="ghost" className="flex-1 px-2 py-1.5 text-[11px]" onClick={() => navigate(viewToolUrl(tool.id))}>View</Button><Button variant="ghost" className="flex-1 px-2 py-1.5 text-[11px]" onClick={() => navigate(editToolUrl(tool.id))}>Edit</Button><Button className="px-2 py-1.5 text-[11px]" onClick={() => onAdd(tool.id)}>{tool.archived ? "Restore & add" : "Add to board"}</Button></div>
    </article>
}
export default ContainerLibraryTool
