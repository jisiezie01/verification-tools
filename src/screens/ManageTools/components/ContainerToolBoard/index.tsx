import { useDrop } from "react-dnd"
import ContainerCategoryRuntime from "../../../../components/ContainerCategoryRuntime"
import SvgBuilderIcon from "../../../../components/svg/SvgBuilderIcon"
import { BOARD_DRAG_TYPE } from "../../data"
import type { BoardDragItemType, BoardDropCollectedType } from "../../types"
import ContainerBoardTool from "../ContainerBoardTool"
import type { ContainerToolBoardProps } from "./types"

const ContainerToolBoard = ({ category, tools, className = "", ...actions }: ContainerToolBoardProps) => {
    const [{ isOver }, drop] = useDrop<BoardDragItemType, unknown, BoardDropCollectedType>(() => ({ accept: BOARD_DRAG_TYPE,
        canDrop: item => item.categoryId === category.id && tools.some(tool => tool.id === item.toolId),
        drop: (item, monitor) => { if (!monitor.didDrop()) actions.onDrop(item.toolId); return { handled: true } },
        collect: monitor => ({ isOver: monitor.isOver({ shallow: true }) && monitor.canDrop() }),
    }), [category.id, tools, actions.onDrop])
    return <ContainerCategoryRuntime tools={tools.filter(tool => category.board.placements.some(placement => placement.toolId === tool.id))}><section aria-label="Category board" className={`flex min-w-0 flex-col gap-4 ${className}`}>
        <div className="flex min-h-[580px] min-w-0 flex-1 flex-col overflow-hidden rounded-3xl border border-white/80 bg-white/35 shadow-sm backdrop-blur-xl">
            <div className="flex items-start justify-between gap-4 px-6 py-5"><div className="min-w-0"><div className="flex items-center gap-2"><h2 className="truncate text-lg font-semibold tracking-tight text-slate-800">{category.name || "Untitled category"}</h2>{category.archived && <span className="rounded-full bg-slate-200/70 px-2 py-1 text-[10px] text-slate-500">Archived</span>}</div><p className="mt-1 text-xs leading-5 text-slate-500">Use your tools here. Drag a grip to arrange them.</p></div><span className="shrink-0 rounded-full border border-white/90 bg-white/70 px-3 py-1 text-[10px] font-medium text-slate-500">{category.board.placements.length} on board</span></div>
            <div className="min-h-0 min-w-0 flex-1 overflow-auto px-4 pb-4 lg:px-5">
                <div ref={node => { drop(node) }} data-category-board={category.id} style={{ flexDirection: category.board.direction, flexWrap: category.board.wrap, gap: category.board.gap, height: category.board.direction.startsWith("column") && category.board.wrap !== "nowrap" ? "100%" : undefined }} className={`flex min-h-[460px] min-w-full content-start items-start rounded-2xl border-2 border-dashed p-2 transition-colors ${isOver ? "border-blue-300 bg-blue-50/50" : "border-transparent"}`}>
                    {category.board.placements.map(placement => { const tool = tools.find(candidate => candidate.id === placement.toolId); return tool ? <ContainerBoardTool key={tool.id} tool={tool} placement={placement} board={category.board} {...actions} /> : null })}
                    {!category.board.placements.length && <div className="flex min-h-[420px] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/30 p-8 text-center"><span className="mb-4 flex size-12 items-center justify-center rounded-2xl border border-white bg-white/70 text-slate-400 shadow-sm"><SvgBuilderIcon name="container" className="size-6" /></span><h3 className="text-sm font-semibold text-slate-600">A little room to make it yours</h3><p className="mt-2 max-w-64 text-xs leading-6 text-slate-400">Drag a tool from the sidebar, or create a new one for this category.</p></div>}
                </div>
            </div>
            <p className="px-6 pb-4 text-[11px] leading-5 text-slate-400">Tool sizes always respect their contents. Removing a tool returns it to the sidebar.</p>
        </div>
    </section></ContainerCategoryRuntime>
}
export default ContainerToolBoard
