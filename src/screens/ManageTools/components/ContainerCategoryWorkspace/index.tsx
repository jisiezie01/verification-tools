import { useCallback, useReducer, useState } from "react"
import ContainerUnsavedChanges from "../../../../components/ContainerUnsavedChanges"
import type { ToolBoardPlacementType, ToolType } from "../../../../types"
import { categoryDraftReducer, createCategoryDraft, draftFingerprint, effectiveTools, saveCategoryDraft, validateCategoryDraft } from "../../functions"
import ContainerToolBoard from "../ContainerToolBoard"
import ContainerCategorySettings from "../ContainerCategorySettings"
import type { ContainerCategoryWorkspaceProps } from "./types"

const ContainerCategoryWorkspace = ({ category, catalog, onSaved, className = "" }: ContainerCategoryWorkspaceProps) => {
    const [draft, dispatch] = useReducer(categoryDraftReducer, createCategoryDraft(category, catalog.tools))
    const [baseline, setBaseline] = useState(() => draftFingerprint(draft))
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState("")
    const [savedMessage, setSavedMessage] = useState("")
    const tools = effectiveTools(catalog.tools, draft.archiveChanges)
    const dirty = draftFingerprint(draft) !== baseline
    const onDrop = useCallback((toolId: string, beforeId?: string) => { const tool = catalog.tools.find(candidate => candidate.id === toolId); if (tool) dispatch({ type: "drop", tool, beforeId }) }, [catalog.tools])
    const onRemove = useCallback((toolId: string) => dispatch({ type: "remove", toolId }), [])
    const onMove = useCallback((toolId: string, direction: -1 | 1) => dispatch({ type: "move", toolId, direction }), [])
    const onResize = useCallback((placement: ToolBoardPlacementType) => dispatch({ type: "resize", placement }), [])
    const onArchive = useCallback((tool: ToolType, archived: boolean) => { const original = catalog.tools.find(candidate => candidate.id === tool.id); if (original) dispatch({ type: "archive-tool", tool: original, archived }) }, [catalog.tools])
    const handleSave = async () => {
        if (isSaving) return false
        const issue = validateCategoryDraft(draft, catalog.categories)
        if (issue) { setError(issue); return false }
        setIsSaving(true)
        try {
            const saved = await saveCategoryDraft(draft)
            const updated = saved.categories.find(candidate => candidate.id === category.id)!
            const nextDraft = createCategoryDraft(updated, saved.tools)
            dispatch({ type: "replace", draft: nextDraft })
            setBaseline(draftFingerprint(nextDraft)); setError(""); setSavedMessage(import.meta.env.DEV ? "Changes saved to tool-catalog.json." : "Applied to this demo only. Refreshing discards your changes.")
            onSaved(saved)
            return true
        } catch (cause) { setError(cause instanceof Error ? cause.message : "Changes could not be saved. Please try again."); return false }
        finally { setIsSaving(false) }
    }
    return <div inert={isSaving} aria-busy={isSaving} className={`grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px] ${className}`}>
        <ContainerToolBoard category={draft.category} categories={catalog.categories} tools={tools.filter(tool => tool.categoryId === category.id)} onDrop={onDrop} onRemove={onRemove} onMove={onMove} onResize={onResize} onArchive={onArchive} className="lg:h-[calc(100dvh-144px)] lg:min-h-[600px]" />
        <ContainerCategorySettings category={draft.category} tools={tools} dirty={dirty} error={error} savedMessage={savedMessage} onName={name => dispatch({ type: "category", changes: { name } })} onLayout={changes => dispatch({ type: "layout", changes })} onArchiveCategory={archived => dispatch({ type: "category", changes: { archived } })} onArchiveTool={onArchive} onAdd={onDrop} onSave={handleSave} className="lg:max-h-[calc(100dvh-144px)] lg:overflow-y-auto" />
        <ContainerUnsavedChanges when={dirty} onSave={handleSave} subject="category and board" />
    </div>
}
export default ContainerCategoryWorkspace
