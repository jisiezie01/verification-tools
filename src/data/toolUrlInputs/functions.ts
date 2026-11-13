import type { ElementType, ToolType } from "../../types"

type Input = Extract<ElementType, { variableName: string }>
export const reservedUrlParameters = new Set(["category", "categoryId", "toolId"])
export const isUrlInput = (element: ElementType): element is Input =>
    "variableName" in element && element.syncWithUrl === true && !reservedUrlParameters.has(element.variableName)

// The URL is authoritative for opted-in inputs, including an explicitly empty value.
export const urlInputValues = (tool: ToolType, params: URLSearchParams): Record<string, string> =>
    Object.fromEntries(tool.elements.filter(isUrlInput).map(input => [input.id,
        params.get(input.variableName) ?? (input.type === "Number input" && input.defaultValue !== undefined ? String(input.defaultValue) : "")]))

export const updateUrlInputs = (params: URLSearchParams, inputs: Array<ElementType>, values?: Record<string, string>) => {
    const next = new URLSearchParams(params)
    for (const input of inputs.filter(isUrlInput)) {
        if (values === undefined) next.delete(input.variableName)
        else if (Object.hasOwn(values, input.id)) next.set(input.variableName, values[input.id])
    }
    return next
}

export const withCategory = (params: URLSearchParams, categoryId?: string) => {
    const next = new URLSearchParams(params)
    if (categoryId) next.set("category", categoryId)
    else next.delete("category")
    return next
}
