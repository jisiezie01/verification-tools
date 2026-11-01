import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import Button from "../../components/Button"
import ContainerCategoryRuntime from "../../components/ContainerCategoryRuntime"
import SvgBuilderIcon from "../../components/svg/SvgBuilderIcon"
import { loadToolCatalog } from "../../data/toolCatalog/functions"
import ContainerPublishedTool from "./components/ContainerPublishedTool"
import { getToolsWorkspace } from "./functions"
import type { ScreenToolsProps } from "./types"

const ScreenTools = ({ className = "" }: ScreenToolsProps) => {
    const [catalog, setCatalog] = useState(loadToolCatalog)
    const [params, setParams] = useSearchParams()
    const navigate = useNavigate()
    const workspace = getToolsWorkspace(catalog.categories, catalog.tools, params.get("category"))
    const { category, board } = workspace
    return (
        <div className={`relative min-h-dvh bg-[#edf2f8] text-slate-800 ${className}`}>
            <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
                <div className="absolute -left-40 -top-64 size-[640px] rounded-full bg-blue-200/40 blur-3xl" />
                <div className="absolute -bottom-80 right-0 size-[700px] rounded-full bg-violet-200/30 blur-3xl" />
            </div>
            <main className="relative mx-auto max-w-[1800px] py-6 flex flex-col gap-4">
                <header className="flex flex-row flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/80 bg-white/65 px-5 py-3 shadow-sm backdrop-blur-xl">
                    <a href={import.meta.env.BASE_URL} className="flex shrink-0 items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-700"><img src={`${import.meta.env.BASE_URL}brand.svg`} width="24" height="24" alt="" />Verification Tools home</a>
                    {!catalog.error && category && (
                        <nav aria-label="Tool categories" className="flex min-w-0 gap-2 overflow-x-auto">
                            {workspace.categories.map(item => <button key={item.id} type="button" aria-current={item.id === category.id ? "page" : undefined} onClick={() => setParams({ category: item.id })} className={`cursor-pointer shrink-0 rounded-full px-4 py-2.5 text-xs font-semibold transition-colors ${item.id === category.id ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:bg-white/80 hover:text-slate-800"}`}>{item.name}</button>)}</nav>)}

                    <Button onClick={() => navigate(category ? `/manage-tools?category=${encodeURIComponent(category.id)}` : "/manage-tools")}>Manage tools</Button>
                </header>
                {catalog.error ? <section role="alert" className="rounded-3xl border border-red-100 bg-white/70 p-8"><h2 className="font-semibold">Your tools could not be loaded</h2><p className="mt-2 text-sm text-red-700">{catalog.error}</p>
                    <Button className="mt-5" onClick={() => setCatalog(loadToolCatalog())}>Try again</Button>
                </section> :
                    category && board ? <>
                        <section aria-label={category.name} className="min-h-[580px] min-w-0 overflow-auto lg:h-[calcz(100dvh-192px)]">
                            <ContainerCategoryRuntime key={`${category.id}:${JSON.stringify(workspace.tools)}`} tools={workspace.tools}>
                                <div data-tools-board={category.id} style={{ flexDirection: board.direction, flexWrap: board.wrap, gap: board.gap, height: board.direction.startsWith("column") && board.wrap !== "nowrap" ? "100%" : undefined }} className="flex min-h-[460px] min-w-full content-start items-start">
                                    {board.placements.map(placement => { const tool = workspace.tools.find(item => item.id === placement.toolId); return tool ? <ContainerPublishedTool key={tool.id} tool={tool} placement={placement} /> : null })}
                                    {!workspace.tools.length && <div className="flex min-h-[420px] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/30 p-8 text-center"><SvgBuilderIcon name="container" className="mb-4 size-10 text-slate-400" /><h3 className="text-sm font-semibold text-slate-600">No tools on this board yet</h3><p className="mt-2 max-w-xs text-xs leading-6 text-slate-500">Add tools in Manage tools, then save your layout to see them here.</p><Button className="mt-5" onClick={() => navigate(`/manage-tools?category=${encodeURIComponent(category.id)}`)}>Arrange this category</Button></div>}
                                </div>
                            </ContainerCategoryRuntime>
                        </section>
                    </> : <section className="flex min-h-[520px] flex-col items-center justify-center rounded-3xl border border-white/80 bg-white/45 p-8 text-center"><SvgBuilderIcon name="container" className="mb-5 size-10 text-slate-400" /><h2 className="text-xl font-semibold tracking-tight">Your tools start here</h2><p className="mt-3 max-w-sm text-sm leading-6 text-slate-500">Create a tool and arrange its category to build your workspace. Archived categories can be restored in Manage tools.</p><Button variant="primary" className="mt-6" onClick={() => navigate("/create-tool")}>Create new tool</Button></section>}
            </main>
        </div>)
}
export default ScreenTools
