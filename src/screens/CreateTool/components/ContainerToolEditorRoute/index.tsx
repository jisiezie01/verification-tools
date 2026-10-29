import { useMemo } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import Button from "../../../../components/Button"
import ContainerToolBuilder from "../ContainerToolBuilder"
import { resolveEditorRoute } from "./functions"
import type { ContainerToolEditorRouteProps } from "./types"

const ContainerToolEditorRoute = ({ initialTool, onExit, ...props }: ContainerToolEditorRouteProps) => {
    const [params] = useSearchParams()
    const navigate = useNavigate()
    const toolId = params.get("toolId")
    const categoryId = params.get("categoryId")
    const route = useMemo(() => resolveEditorRoute(toolId, categoryId, initialTool), [toolId, categoryId, initialTool])
    return route.error ? <main className="min-h-dvh bg-slate-50 p-8"><div className="mx-auto max-w-lg rounded-3xl border border-white bg-white/75 p-8 shadow-sm"><h1 className="text-xl font-semibold">The tool could not be opened</h1><p role="alert" className="mt-3 text-sm text-red-700">{route.error}</p><Button className="mt-5" onClick={() => navigate("/manage-tools")}>Manage tools</Button></div></main> : <ContainerToolBuilder key={route.tool?.id ?? "new"} {...props} initialTool={route.tool} onExit={onExit ?? (id => navigate(id ? `/manage-tools?category=${encodeURIComponent(id)}` : "/manage-tools"))} />
}
export default ContainerToolEditorRoute
