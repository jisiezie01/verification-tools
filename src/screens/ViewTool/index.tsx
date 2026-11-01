import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import Button from "../../components/Button"
import ToolRenderer from "../../components/ToolRenderer"
import { loadToolCatalog } from "../../data/toolCatalog/functions"
import type { ScreenViewToolProps } from "./types"

const ScreenViewTool = ({ className = "" }: ScreenViewToolProps) => {
    const { toolId } = useParams()
    const [catalog] = useState(loadToolCatalog)
    const navigate = useNavigate()
    const tool = catalog.tools.find(candidate => candidate.id === toolId)
    return <main className={`min-h-dvh bg-gradient-to-br from-blue-50 to-slate-100 p-5 text-slate-800 lg:p-8 ${className}`}>
        <div className="mx-auto max-w-4xl"><header className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/80 bg-white/70 p-4 shadow-sm backdrop-blur-xl"><div><h1 className="text-lg font-semibold tracking-tight">{tool?.name ?? "Tool unavailable"}</h1>{tool?.archived && <p className="mt-1 text-xs text-slate-400">Archived tool</p>}</div><div className="flex flex-wrap gap-2">{tool && <Button onClick={() => navigate(`/tools?category=${encodeURIComponent(tool.categoryId)}`)}>Open category</Button>}<Button onClick={() => navigate(tool ? `/tools?category=${encodeURIComponent(tool.categoryId)}` : "/tools")}>Back to tools</Button>{tool && <Button variant="primary" onClick={() => navigate(`/create-tool?toolId=${encodeURIComponent(tool.id)}`)}>Edit tool</Button>}</div></header>
            {catalog.error || !tool ? <p role="alert" className="rounded-2xl bg-white/80 p-6 text-sm text-red-700">{catalog.error || "This tool could not be found. It may have been removed."}</p> : <div className="overflow-auto rounded-3xl border border-white/80 bg-white/90 p-6 shadow-sm"><ToolRenderer tool={tool} /></div>}
        </div>
    </main>
}
export default ScreenViewTool
