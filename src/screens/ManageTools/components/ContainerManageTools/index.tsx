import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import Button from "../../../../components/Button"
import SvgBuilderIcon from "../../../../components/svg/SvgBuilderIcon"
import { loadToolCatalog } from "../../../../data/toolCatalog/functions"
import ContainerCategoryNavigation from "../ContainerCategoryNavigation"
import ContainerCategoryWorkspace from "../ContainerCategoryWorkspace"
import type { ContainerManageToolsProps } from "./types"

const ContainerManageTools = ({ className = "" }: ContainerManageToolsProps) => {
    const [catalog, setCatalog] = useState(loadToolCatalog)
    const [params] = useSearchParams()
    const navigate = useNavigate()
    const [firstCategoryId] = useState(() => catalog.categories.find(category => !category.archived)?.id ?? catalog.categories[0]?.id)
    const category = catalog.categories.find(candidate => candidate.id === (params.get("category") ?? firstCategoryId)) ?? catalog.categories.find(candidate => !candidate.archived) ?? catalog.categories[0]
    return <div className={`relative min-h-dvh bg-[#edf2f8] text-slate-800 ${className}`}>
        <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true"><div className="absolute -left-40 -top-64 size-[640px] rounded-full bg-blue-200/40 blur-3xl" /><div className="absolute -bottom-80 right-0 size-[700px] rounded-full bg-violet-200/30 blur-3xl" /></div>
        <main className="relative mx-auto max-w-[1800px] p-4 lg:p-6"><header className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-white/80 bg-white/65 px-5 py-4 shadow-sm backdrop-blur-xl"><span className="flex size-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm"><SvgBuilderIcon name="container" /></span><div><h1 className="text-sm font-semibold">Manage tools</h1><p className="mt-0.5 text-xs text-slate-500">A workspace that works your way.</p></div><span className="ml-auto hidden text-xs text-slate-400 sm:block">{catalog.categories.length} categories</span><Button onClick={() => navigate(category ? `/tools?category=${encodeURIComponent(category.id)}` : "/tools")}>Use tools</Button>{!catalog.error && category && <ContainerCategoryNavigation categories={catalog.categories} selectedId={category.id} className="w-full border-t border-slate-200/60 pt-3" />}</header>
            {catalog.error ? <div role="alert" className="rounded-3xl border border-red-100 bg-white/70 p-8"><h2 className="font-semibold">Your tools could not be loaded</h2><p className="mt-2 text-sm text-red-700">{catalog.error}</p><Button className="mt-5" onClick={() => setCatalog(loadToolCatalog())}>Try again</Button></div> : category ? <ContainerCategoryWorkspace key={category.id} category={category} catalog={catalog} onSaved={next => setCatalog({ ...next, error: "" })} /> : <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]"><section className="flex min-h-[520px] flex-col items-center justify-center rounded-3xl border border-white/80 bg-white/45 p-8 text-center"><SvgBuilderIcon name="container" className="mb-5 size-10 text-slate-400" /><h2 className="text-xl font-semibold tracking-tight">Make space for your tools</h2><p className="mt-3 max-w-sm text-sm leading-6 text-slate-500">Create a tool and choose a category. Your saved tools will appear here, ready to arrange and use.</p></section><aside className="rounded-3xl border border-white/80 bg-white/65 p-5 shadow-sm"><Button variant="primary" className="flex w-full items-center justify-center gap-2 py-3.5" onClick={() => navigate("/create-tool")}><SvgBuilderIcon name="plus" />Create new tool</Button><p className="mt-4 text-xs leading-6 text-slate-500">Categories you create in the tool editor will be available in this workspace.</p></aside></div>}
        </main>
    </div>
}
export default ContainerManageTools
