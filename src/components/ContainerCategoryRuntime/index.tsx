import { useCallback, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { urlInputValues } from "../../data/toolUrlInputs/functions"
import type { CategoryInputValuesType } from "../../data/toolVariables/types"
import { CategoryRuntimeContext } from "./data"
import type { ContainerCategoryRuntimeProps } from "./types"

const ContainerCategoryRuntime = ({ tools, children, className = "contents" }: ContainerCategoryRuntimeProps) => {
    const [params] = useSearchParams()
    const [values, setValues] = useState<CategoryInputValuesType>(() => Object.fromEntries(tools.filter(tool => tool.isGlobal).map(tool => [tool.id, Object.fromEntries(tool.elements.flatMap(element =>
        element.type === "Number input" && element.defaultValue !== undefined ? [[element.id, String(element.defaultValue)]] : []))])))
    const setInput = useCallback((toolId: string, inputId: string, value: string) => setValues(current => ({ ...current, [toolId]: { ...current[toolId], [inputId]: value } })), [])
    const resetInputs = useCallback((toolId: string) => {
        const tool = tools.find(candidate => candidate.id === toolId)
        const defaults = Object.fromEntries(tool?.elements.flatMap(element => element.type === "Number input" && element.defaultValue !== undefined ? [[element.id, String(element.defaultValue)]] : []) ?? [])
        setValues(current => ({ ...current, [toolId]: defaults }))
    }, [tools])
    const context = useMemo(() => ({ tools, values: Object.fromEntries(tools.filter(tool => tool.isGlobal).map(tool =>
        [tool.id, { ...values[tool.id], ...urlInputValues(tool, params) }])), setInput, resetInputs }), [tools, values, params, setInput, resetInputs])
    return <CategoryRuntimeContext.Provider value={context}><div className={className}>{children}</div></CategoryRuntimeContext.Provider>
}
export default ContainerCategoryRuntime
