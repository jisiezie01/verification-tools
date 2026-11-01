import type { ToolCategoryType } from "../../types"
import { CATEGORIES_STORAGE_KEY, TOOLS_STORAGE_KEY } from "./data"
import type { ToolArchiveChangesType, ToolCatalogResultType, ToolCatalogType } from "./types"

let catalog: ToolCatalogType | undefined
let revision = ""
let endpoint = ""
let writable = false
let loadError = "Tools have not been loaded."
let pending: Promise<unknown> = Promise.resolve()

export const parseToolCatalog = (value: unknown): ToolCatalogType => {
    if (!value || typeof value !== "object") throw new Error("The catalog must be a JSON object.")
    const data = value as Record<string, unknown>
    if (data.version !== 1 || !Array.isArray(data.categories) || !Array.isArray(data.tools)) throw new Error("Unsupported catalog format. Expected version 1, categories, and tools.")
    if (data.categories.some(item => !item || typeof item.id !== "string" || typeof item.name !== "string") || data.tools.some(item => !item || typeof item.id !== "string" || typeof item.name !== "string" || typeof item.categoryId !== "string" || !Array.isArray(item.elements))) throw new Error("The catalog contains an invalid tool or category.")
    if (new Set(data.categories.map(item => item.id)).size !== data.categories.length || new Set(data.tools.map(item => item.id)).size !== data.tools.length) throw new Error("Catalog IDs must be unique.")
    const categoryIds = new Set(data.categories.map(category => category.id))
    if (data.tools.some(tool => !categoryIds.has(tool.categoryId))) throw new Error("A tool references a missing category.")
    return structuredClone({ categories: data.categories, tools: data.tools })
}

export const initializeToolCatalog = async (url: string, allowWrites: boolean) => {
    endpoint = url
    writable = allowWrites
    try {
        const response = await fetch(url, { cache: "no-store" })
        if (!response.ok) throw new Error("The tool catalog could not be loaded. Please retry.")
        catalog = parseToolCatalog(await response.json())
        revision = response.headers.get("ETag") ?? ""
        loadError = ""
    } catch (error) {
        catalog = undefined
        loadError = error instanceof Error ? error.message : "The tool catalog could not be loaded."
        throw error
    }
}
export const readToolCatalog = (): ToolCatalogType => {
    if (!catalog) throw new Error(loadError)
    return structuredClone(catalog)
}
export const loadToolCatalog = (): ToolCatalogResultType => {
    try { return { ...readToolCatalog(), error: "" } }
    catch (error) { return { categories: [], tools: [], error: error instanceof Error ? error.message : "Saved tools could not be loaded." } }
}

// Serialize updates. Published demos stay in memory; local edits wait for the file write.
export const updateToolCatalog = (update: (current: ToolCatalogType) => ToolCatalogType): Promise<ToolCatalogType> => {
    const operation = pending.then(async () => {
        const next = parseToolCatalog({ version: 1, ...update(readToolCatalog()) })
        if (!writable) {
            catalog = next
            return readToolCatalog()
        }
        const response = await fetch(endpoint, { method: "PUT", headers: { "Content-Type": "application/json", "If-Match": revision }, body: JSON.stringify({ version: 1, ...next }) })
        if (!response.ok) {
            const result = await response.json().catch(() => ({}))
            throw new Error(result.error || "The catalog file could not be saved. Your changes are still unsaved.")
        }
        catalog = parseToolCatalog(await response.json())
        revision = response.headers.get("ETag") ?? ""
        return readToolCatalog()
    })
    pending = operation.catch(() => {})
    return operation
}
export const saveManagedCategory = (category: ToolCategoryType, archiveChanges: ToolArchiveChangesType) => updateToolCatalog(current => {
    if (!current.categories.some(item => item.id === category.id)) throw new Error("This category no longer exists. Reload before saving.")
    return {
        categories: current.categories.map(item => item.id === category.id ? { ...item, ...structuredClone(category), name: category.name.trim() } : item),
        tools: current.tools.map(tool => tool.categoryId === category.id && Object.hasOwn(archiveChanges, tool.id) ? { ...tool, archived: archiveChanges[tool.id] } : tool),
    }
})

export const importBrowserCatalog = () => updateToolCatalog(current => {
    const imported = parseToolCatalog({ version: 1, categories: JSON.parse(localStorage.getItem(CATEGORIES_STORAGE_KEY) ?? "[]"), tools: JSON.parse(localStorage.getItem(TOOLS_STORAGE_KEY) ?? "[]") })
    if (!imported.categories.length && !imported.tools.length) throw new Error("No tools or categories were found in this browser.")
    if (current.categories.length || current.tools.length) throw new Error("Browser import is available only when the JSON catalog is empty, to avoid overwriting saved work.")
    return imported
})
