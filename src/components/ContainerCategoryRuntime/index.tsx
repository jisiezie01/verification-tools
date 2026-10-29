import { useCallback, useMemo, useState } from "react"
import type { CategoryInputValuesType } from "../../data/toolVariables/types"
import { CategoryRuntimeContext } from "./data"
import type { ContainerCategoryRuntimeProps } from "./types"

const ContainerCategoryRuntime = ({ tools, children, className = "contents" }: ContainerCategoryRuntimeProps) => {
    const [values, setValues] = useState<CategoryInputValuesType>({})
    const setInput = useCallback((toolId: string, inputId: string, value: string) => setValues(current => ({ ...current, [toolId]: { ...current[toolId], [inputId]: value } })), [])
    const resetInputs = useCallback((toolId: string) => setValues(current => ({ ...current, [toolId]: {} })), [])
    const context = useMemo(() => ({ tools, values, setInput, resetInputs }), [tools, values, setInput, resetInputs])
    return <CategoryRuntimeContext.Provider value={context}><div className={className}>{children}</div></CategoryRuntimeContext.Provider>
}
export default ContainerCategoryRuntime
