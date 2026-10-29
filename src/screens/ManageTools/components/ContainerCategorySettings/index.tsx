import { useNavigate } from "react-router-dom"
import Button from "../../../../components/Button"
import SvgBuilderIcon from "../../../../components/svg/SvgBuilderIcon"
import type { ToolCategoryBoardType } from "../../../../types"
import InputSetting from "../../../CreateTool/components/InputSetting"
import { BOARD_DIRECTIONS, BOARD_WRAPS } from "../../data"
import { createToolUrl } from "../../functions"
import ContainerLibraryTool from "../ContainerLibraryTool"
import type { ContainerCategorySettingsProps } from "./types"

const ContainerCategorySettings = ({ category, tools, dirty, error, savedMessage, onName, onLayout, onArchiveCategory, onArchiveTool, onAdd, onSave, className = "" }: ContainerCategorySettingsProps) => {
    const navigate = useNavigate()
    const available = tools.filter(tool => tool.categoryId === category.id && !category.board.placements.some(item => item.toolId === tool.id))
    const active = available.filter(tool => !tool.archived)
    const archived = available.filter(tool => tool.archived)
    return <aside aria-label="Category configuration" className={`flex flex-col rounded-3xl border border-white/80 bg-white/60 p-5 shadow-sm backdrop-blur-xl ${className}`}>
        <Button variant="primary" className="mb-6 flex w-full items-center justify-center gap-2 py-3.5 shadow-lg shadow-slate-900/10" onClick={() => navigate(createToolUrl(category.id))}><SvgBuilderIcon name="plus" className="size-5" />Create new tool</Button>
        <div className="mb-5"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Category settings</p><h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-800">Your workspace</h2></div>
        <div className="space-y-4"><InputSetting label="Category name" value={category.name} onChange={onName} /><div className="grid grid-cols-2 gap-3"><InputSetting label="Flex direction" kind="select" value={category.board.direction} options={BOARD_DIRECTIONS} onChange={direction => onLayout({ direction: direction as ToolCategoryBoardType["direction"] })} /><InputSetting label="Flex wrapping" kind="select" value={category.board.wrap} options={BOARD_WRAPS} onChange={wrap => onLayout({ wrap: wrap as ToolCategoryBoardType["wrap"] })} /></div><InputSetting label="Spacing (px)" kind="number" min={0} value={category.board.gap} onChange={gap => onLayout({ gap: Number(gap) })} /></div>
        <section aria-label="Active tools off board" className="mt-6 border-t border-slate-200/70 pt-5"><div className="mb-3 flex items-center justify-between"><h3 className="text-xs font-semibold text-slate-600">Available tools</h3><span className="text-[10px] text-slate-400">{active.length} active</span></div><div className="space-y-2">{active.map(tool => <ContainerLibraryTool key={tool.id} tool={tool} onAdd={onAdd} onArchive={onArchiveTool} />)}</div>{!active.length && <p className="rounded-xl border border-dashed border-slate-200 p-3 text-xs leading-5 text-slate-400">No active tools waiting to be added.</p>}</section>
        <section aria-label="Archived tools off board" className="mt-5"><div className="mb-3 flex items-center justify-between"><h3 className="text-xs font-medium text-slate-400">Archived</h3><span className="text-[10px] text-slate-400">{archived.length}</span></div><div className="space-y-2">{archived.map(tool => <ContainerLibraryTool key={tool.id} tool={tool} onAdd={onAdd} onArchive={onArchiveTool} />)}</div>{!archived.length && <p className="text-xs text-slate-400">No archived tools.</p>}</section>
        <div className="mt-6 space-y-3 border-t border-slate-200/70 pt-5"><Button variant={category.archived ? "glass" : "ghost"} className="w-full text-xs" onClick={() => onArchiveCategory(!category.archived)}>{category.archived ? "Restore category" : "Archive category"}</Button>{category.archived && <p className="text-xs leading-5 text-slate-500">This category is marked archived. You can restore it at any time.</p>}{error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-xs leading-5 text-red-700">{error}</p>}<Button variant="primary" className="flex w-full items-center justify-center gap-2" onClick={onSave}><SvgBuilderIcon name="save" className="size-4" />Save changes</Button><p role="status" className={`text-center text-[11px] leading-5 ${dirty ? "text-amber-700" : "text-slate-400"}`}>{dirty ? "Unsaved changes" : savedMessage || "Your board is ready."}</p></div>
    </aside>
}
export default ContainerCategorySettings
