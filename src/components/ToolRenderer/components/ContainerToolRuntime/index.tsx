import { useContext, useState } from "react"
import { CategoryRuntimeContext } from "../../../ContainerCategoryRuntime/data"
import { getSharedScope } from "../../../../data/toolVariables/functions"
import { createRuntimeState, formatPhone, generateRuntimeState, getCopyValue, inputError, normalizeInput, resetRuntimeState } from "../../functions"
import type { RuntimeInputType } from "../../types"
import ContainerRenderedElements from "../ContainerRenderedElements"
import type { ContainerToolRuntimeProps } from "./types"

const ContainerToolRuntime = ({ tool, className = "" }: ContainerToolRuntimeProps) => {
    const category = useContext(CategoryRuntimeContext)
    const shared = getSharedScope(tool, category?.tools ?? [], category?.values ?? {})
    const [localState, setState] = useState(() => createRuntimeState(tool, shared))
    const state = tool.isGlobal && category ? { ...localState, values: category.values[tool.id] ?? {} } : localState
    const onInput = (element: RuntimeInputType, raw: string) => {
        const value = element.type === "Phone input" ? formatPhone(raw) : raw
        if (tool.isGlobal) category?.setInput(tool.id, element.id, value)
        setState(current => ({ ...current, values: { ...current.values, [element.id]: value }, errors: { ...current.errors, [element.id]: inputError(element, value) }, message: "" }))
    }
    const onBlur = (element: RuntimeInputType) => {
        const value = normalizeInput(element, state.values[element.id] ?? "")
        if (tool.isGlobal) category?.setInput(tool.id, element.id, value)
        setState(current => ({ ...current, values: { ...current.values, [element.id]: value }, errors: { ...current.errors, [element.id]: inputError(element, value) } }))
    }
    const onGenerate = (outputId: string | Array<string>) => {
        const next = generateRuntimeState(tool, state, outputId, shared)
        if (tool.isGlobal) Object.entries(next.values).forEach(([inputId, value]) => category?.setInput(tool.id, inputId, value))
        setState(next)
    }
    const onReset = () => { if (tool.isGlobal) category?.resetInputs(tool.id); setState(resetRuntimeState()) }
    const onCopy = async (targetId: string, confirmCopy: boolean, message: string) => {
        try {
            const value = getCopyValue(targetId, tool, state)
            if (!navigator.clipboard?.writeText) throw new Error("Clipboard access is unavailable in this browser.")
            await navigator.clipboard.writeText(value)
            setState(current => ({ ...current, message: "" }))
            if (confirmCopy) window.alert(message || "Copied to clipboard.")
        } catch (error) { setState(current => ({ ...current, message: error instanceof Error ? error.message : "The content could not be copied. Please try again." })) }
    }
    return <div data-tool-content={tool.id} className={`min-w-0 text-sm text-slate-700 ${className}`}>
        <ContainerRenderedElements tool={tool} state={state} onInput={onInput} onBlur={onBlur} onCopy={onCopy} onGenerate={onGenerate} onReset={onReset} />
        {state.message && <p role="alert" className="mt-3 whitespace-pre-line rounded-xl border border-red-100 bg-red-50 p-3 text-xs leading-5 text-red-700">{state.message}</p>}
    </div>
}
export default ContainerToolRuntime
