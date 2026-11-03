import { useContext, useEffect, useRef, useState } from "react"
import { trackToolEvent } from "../../../../analytics"
import { observeVisibleOnce } from "../../../../data/analytics/functions"
import { CategoryRuntimeContext } from "../../../ContainerCategoryRuntime/data"
import { getSharedScope } from "../../../../data/toolVariables/functions"
import { createRuntimeState, formatPhone, generateRuntimeState, getCopyValue, inputError, normalizeInput, resetRuntimeState, resolveRadioOutputs } from "../../functions"
import type { RuntimeInputType } from "../../types"
import ContainerRenderedElements from "../ContainerRenderedElements"
import type { ContainerToolRuntimeProps } from "./types"

const ContainerToolRuntime = ({ tool, analytics, className = "" }: ContainerToolRuntimeProps) => {
    const category = useContext(CategoryRuntimeContext)
    const shared = getSharedScope(tool, category?.tools ?? [], category?.values ?? {})
    const [localState, setState] = useState(() => createRuntimeState(tool, shared))
    const used = useRef(false)
    const content = useRef<HTMLDivElement>(null)
    const viewed = useRef(false)
    const categoryName = analytics?.categoryName
    const source = analytics?.source
    useEffect(() => {
        if (!import.meta.env.PROD || !source || !content.current || viewed.current) return
        return observeVisibleOnce(content.current, () => {
            viewed.current = trackToolEvent("tool_view", tool, { categoryName: categoryName ?? "", source })
            return viewed.current
        })
    }, [tool, categoryName, source])
    const trackUse = () => {
        if (!used.current) used.current = trackToolEvent("tool_use", tool, analytics)
    }
    const state = resolveRadioOutputs(tool, tool.isGlobal && category ? { ...localState, values: category.values[tool.id] ?? {} } : localState, shared)
    const onInput = (element: RuntimeInputType, raw: string) => {
        const value = element.type === "Phone input" ? formatPhone(raw) : raw
        if (tool.isGlobal) category?.setInput(tool.id, element.id, value)
        setState(current => ({ ...current, values: { ...current.values, [element.id]: value }, errors: { ...current.errors, [element.id]: inputError(element, value) }, message: "" }))
        if (value !== (state.values[element.id] ?? "")) trackUse()
    }
    const onBlur = (element: RuntimeInputType) => {
        const value = normalizeInput(element, state.values[element.id] ?? "")
        if (tool.isGlobal) category?.setInput(tool.id, element.id, value)
        setState(current => ({ ...current, values: { ...current.values, [element.id]: value }, errors: { ...current.errors, [element.id]: inputError(element, value) } }))
    }
    const onGenerate = (outputId: string | Array<string>) => {
        trackToolEvent("tool_action_click", tool, analytics, "generate")
        const next = generateRuntimeState(tool, state, outputId, shared)
        if (tool.isGlobal) Object.entries(next.values).forEach(([inputId, value]) => category?.setInput(tool.id, inputId, value))
        setState(next)
        if (!next.message) {
            trackUse()
            trackToolEvent("tool_generate", tool, analytics)
        }
    }
    const onReset = () => {
        trackToolEvent("tool_action_click", tool, analytics, "reset")
        if (tool.isGlobal) category?.resetInputs(tool.id)
        setState(resetRuntimeState(tool))
        trackToolEvent("tool_reset", tool, analytics)
        used.current = false
    }
    const onCopy = async (targetId: string, confirmCopy: boolean, message: string) => {
        trackToolEvent("tool_action_click", tool, analytics, "copy")
        try {
            const value = getCopyValue(targetId, tool, state)
            if (!navigator.clipboard?.writeText) throw new Error("Clipboard access is unavailable in this browser.")
            await navigator.clipboard.writeText(value)
            setState(current => ({ ...current, message: "" }))
            trackUse()
            trackToolEvent("tool_copy", tool, analytics)
            if (confirmCopy) window.alert(message || "Copied to clipboard.")
        } catch (error) { setState(current => ({ ...current, message: error instanceof Error ? error.message : "The content could not be copied. Please try again." })) }
    }
    return <div ref={content} data-tool-content={tool.id} className={`min-w-0 text-sm text-slate-700 ${className}`}>
        <ContainerRenderedElements tool={tool} state={state} onInput={onInput} onBlur={onBlur} onCopy={onCopy} onGenerate={onGenerate} onReset={onReset} />
        {state.message && <p role="alert" className="mt-3 whitespace-pre-line rounded-xl border border-red-100 bg-red-50 p-3 text-xs leading-5 text-red-700">{state.message}</p>}
    </div>
}
export default ContainerToolRuntime
