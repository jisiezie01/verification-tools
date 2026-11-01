import { useCallback, useReducer, useState } from "react"
import { loadToolCatalog } from "../../../../data/toolCatalog/functions"
import { getGlobalInputs } from "../../../../data/toolVariables/functions"
import Button from "../../../../components/Button"
import ContainerUnsavedChanges from "../../../../components/ContainerUnsavedChanges"
import SvgBuilderIcon from "../../../../components/svg/SvgBuilderIcon"
import type { ElementType, ToolCategoryType, ToolType } from "../../../../types"
import { builderReducer, createBuilderState, createSavedTool, downloadTool, readCategories, saveCategories, saveTool, validateTool } from "../../functions"
import type { BuilderDragItem } from "../../types"
import ContainerPalette from "../ContainerPalette"
import ContainerBuilderTree from "../ContainerBuilderTree"
import ContainerDeleteZone from "../ContainerDeleteZone"
import ContainerElementSettings from "../ContainerElementSettings"
import ContainerToolSettings from "../ContainerToolSettings"
import type { ContainerToolBuilderProps } from "./types"

const ContainerToolBuilder = ({ initialTool, categories: suppliedCategories, onSave, onExit, className = "" }: ContainerToolBuilderProps) => {
    const [catalog] = useState(loadToolCatalog)
    const [state, dispatch] = useReducer(builderReducer, initialTool, createBuilderState)
    const [categories, setCategories] = useState(() => suppliedCategories ?? readCategories())
    const [saveAttempted, setSaveAttempted] = useState(false)
    const [savedRevision, setSavedRevision] = useState(-1)
    const [savedTool, setSavedTool] = useState<ToolType | null>(null)
    const [saveError, setSaveError] = useState("")
    const [isSaving, setIsSaving] = useState(false)
    const [cleanSnapshot, setCleanSnapshot] = useState(() => JSON.stringify(state.tool))
    const { tool, selectedId, revision } = state
    const selected = tool.elements.find(element => element.id === selectedId)
    const errors = saveAttempted ? validateTool(tool, categories, catalog.tools) : []
    const isSaved = revision === savedRevision
    const onSelect = useCallback((id: string | null) => dispatch({ type: "select", id }), [])
    const onDrop = useCallback((item: BuilderDragItem, containerId?: string, beforeId?: string) => dispatch({ type: "drop", item, containerId, beforeId }), [])
    const onChange = useCallback((element: ElementType, previousId?: string) => dispatch({ type: "change", element, previousId }), [])
    const onDelete = useCallback((id: string) => dispatch({ type: "delete", id }), [])
    const onMove = useCallback((id: string, direction: -1 | 1) => dispatch({ type: "move", id, direction }), [])
    const handleSave = async () => {
        if (isSaving) return false
        setSaveAttempted(true)
        setSaveError("")
        if (validateTool(tool, categories, catalog.tools).length) { onSelect(null); return false }
        setIsSaving(true)
        try {
            const saved = onSave ? createSavedTool(tool, catalog.tools) : await saveTool(tool)
            if (onSave) await onSave(structuredClone(saved))
            setSavedTool(saved)
            setSavedRevision(revision)
            setSaveAttempted(false)
            setCleanSnapshot(JSON.stringify(tool))
            return true
        } catch (error) { setSaveError(error instanceof Error ? error.message : "The tool could not be saved. Please try again."); return false }
        finally { setIsSaving(false) }
    }
    const handleCreateCategory = async (category: ToolCategoryType) => {
        const next = [...categories, category]
        await saveCategories(next)
        setCategories(next)
    }
    return <div className={`relative min-h-dvh bg-[#edf2f8] text-slate-800 ${className}`}>
        <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true"><div className="absolute -left-40 -top-64 size-[640px] rounded-full bg-blue-200/40 blur-3xl" /><div className="absolute -bottom-80 right-0 size-[700px] rounded-full bg-violet-200/30 blur-3xl" /></div>
        <main inert={isSaving} aria-busy={isSaving} className="relative mx-auto max-w-[1800px] p-4 lg:p-6">
            <header className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/80 bg-white/65 px-5 py-3 shadow-sm backdrop-blur-xl">
                <div className="flex min-w-0 items-center gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm"><SvgBuilderIcon name="container" /></span><div className="min-w-0"><div className="flex items-center gap-2"><h1 className="truncate text-sm font-semibold">{tool.name || "Untitled tool"}</h1><span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${isSaved ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>{isSaved ? import.meta.env.DEV ? "Saved" : "Applied to demo" : "Draft"}</span></div><p className="mt-0.5 text-xs text-slate-500">Tool studio / Create a tool</p></div></div>
                <div className="flex items-center gap-2">{onExit && <Button variant="ghost" onClick={() => onExit(tool.categoryId)} className="text-xs">Manage tools</Button>}<Button variant="primary" onClick={handleSave} disabled={isSaving} className="flex items-center gap-2"><SvgBuilderIcon name="save" className="size-4" />{isSaving ? "Saving…" : "Save tool"}</Button></div>
            </header>
            <div className="grid items-start gap-4 lg:h-[calc(100dvh-134px)] lg:min-h-[560px] lg:grid-cols-[216px_minmax(0,1fr)_320px] xl:grid-cols-[240px_minmax(0,1fr)_320px] xl:gap-5">
                <ContainerPalette className="max-h-96 overflow-y-auto lg:max-h-none lg:h-full" onAdd={elementType => onDrop({ source: "palette", elementType }, selected?.type === "Container" ? selected.id : undefined)} />
                <section aria-label="Builder section" className="flex min-h-[600px] min-w-0 flex-col overflow-y-auto rounded-3xl border border-white/80 bg-white/35 shadow-sm backdrop-blur-xl lg:h-full lg:min-h-0" onClick={() => onSelect(null)}>
                    <div className="flex items-center justify-between px-6 py-5"><div><h2 className="text-sm font-semibold text-slate-700">Canvas</h2><p className="mt-1 text-[11px] text-slate-400">Arrange your tool, one element at a time.</p></div><span className="rounded-full border border-white/90 bg-white/60 px-2.5 py-1 text-[10px] text-slate-500">{tool.elements.length} {tool.elements.length === 1 ? "element" : "elements"}</span></div>
                    <div className="mx-4 mb-5 min-w-0 flex-1 rounded-2xl border border-slate-200/70 bg-white/90 px-2 pb-3 pt-6 shadow-[0_12px_40px_rgba(71,85,105,0.06)] xl:mx-6"><ContainerBuilderTree elements={tool.elements} selectedId={selectedId} onSelect={onSelect} onDrop={onDrop} onChange={onChange} onDelete={onDelete} onMove={onMove} /></div>
                    <p className="px-6 pb-5 text-center text-[11px] leading-5 text-slate-400">Select to configure. Use the grip to move. Drag the corner to resize.</p>
                </section>
                <aside aria-label="Element selection" className="rounded-3xl border border-white/80 bg-white/60 p-5 shadow-sm backdrop-blur-xl lg:h-full lg:overflow-y-auto">
                    {selected ? <ContainerElementSettings sharedInputs={getGlobalInputs(tool, catalog.tools)} element={selected} elements={tool.elements} onChange={onChange} onDelete={onDelete} onDuplicate={id => dispatch({ type: "duplicate", id })} onToolSettings={() => onSelect(null)} /> : <ContainerToolSettings tool={tool} categories={categories} onGlobalChange={isGlobal => dispatch({ type: "metadata", isGlobal })} onNameChange={name => dispatch({ type: "metadata", name })} onCategoryChange={categoryId => dispatch({ type: "metadata", categoryId })} onCreateCategory={handleCreateCategory} />}
                    <div className="mt-6 space-y-3 border-t border-slate-200/70 pt-5">
                        {!!errors.length && <div role="alert" className="rounded-xl bg-red-50 p-3 text-xs leading-5 text-red-700"><p className="font-semibold">Before saving</p><ul className="mt-1 list-disc space-y-1 pl-4">{errors.map(error => <li key={error}>{error}</li>)}</ul></div>}
                        {saveError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-xs leading-5 text-red-700">{saveError}</p>}
                        <Button variant="primary" className="w-full" onClick={handleSave} disabled={isSaving}>{isSaving ? "Saving…" : "Save tool"}</Button>
                        <p role="status" className="text-center text-[11px] leading-5 text-slate-500">{isSaved ? onSave ? "Your tool has been saved." : import.meta.env.DEV ? "Saved to tool-catalog.json. Ready to publish." : "Applied to this demo only. Refreshing discards your changes." : "Save your tool when everything looks right."}</p>
                        <Button className="w-full text-xs" disabled={!!validateTool(tool, categories, catalog.tools).length} onClick={() => downloadTool(createSavedTool(tool, catalog.tools))}>Download tool JSON</Button>
                        {savedTool && <details className="text-xs text-slate-500"><summary className="cursor-pointer py-1">View last saved object</summary><pre className="mt-2 max-h-60 overflow-auto rounded-xl border border-slate-200 bg-white/70 p-3 text-[10px]">{JSON.stringify(savedTool, null, 2)}</pre></details>}
                    </div>
                </aside>
            </div>
        </main>
        <ContainerDeleteZone onDelete={onDelete} />
        <ContainerUnsavedChanges when={JSON.stringify(tool) !== cleanSnapshot} onSave={handleSave} subject="tool" />
    </div>
}
export default ContainerToolBuilder
