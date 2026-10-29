import { useNavigate } from "react-router-dom"
import { categoryUrl } from "../../functions"
import type { ContainerCategoryNavigationProps } from "./types"

const ContainerCategoryNavigation = ({ categories, selectedId, className = "" }: ContainerCategoryNavigationProps) => {
    const navigate = useNavigate()
    return <nav aria-label="Tool categories" className={`flex min-w-0 gap-2 overflow-x-auto py-1 ${className}`}>
        {[...categories].sort((a, b) => Number(!!a.archived) - Number(!!b.archived)).map(category => <button key={category.id} type="button" aria-current={selectedId === category.id ? "page" : undefined} onClick={() => { if (category.id !== selectedId) navigate(categoryUrl(category.id)) }} className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-blue-500 ${selectedId === category.id ? "bg-slate-900 text-white shadow-sm" : category.archived ? "text-slate-400 hover:bg-white/70" : "text-slate-600 hover:bg-white/80"}`}>{category.name}{category.archived && <span className="text-[9px] font-normal opacity-70">Archived</span>}</button>)}
    </nav>
}
export default ContainerCategoryNavigation
