import type { ToolArchiveChangesType } from "../../data/toolCatalog/types"
import { readToolCatalog, saveManagedCategory } from "../../data/toolCatalog/functions"
import { globalVariableConflicts } from "../../data/toolVariables/functions"
import type { ToolBoardPlacementType, ToolCategoryBoardType, ToolCategoryType, ToolType } from "../../types"
import { BOARD_DIRECTIONS, BOARD_WRAPS, DEFAULT_BOARD } from "./data"
import type { CategoryDraftType, ManageBoardActionType } from "./types"

export const effectiveTools = (tools: Array<ToolType>, changes: ToolArchiveChangesType) => tools.map(tool => Object.hasOwn(changes, tool.id) ? { ...tool, archived: changes[tool.id] } : tool)
export const reconcileBoard = (category: ToolCategoryType, tools: Array<ToolType>): ToolCategoryBoardType => {
    const saved = category.board
    const available = tools.filter(tool => tool.categoryId === category.id)
    const ids = new Set(available.map(tool => tool.id))
    const removedToolIds = [...new Set(Array.isArray(saved?.removedToolIds) ? saved.removedToolIds.filter(id => ids.has(id)) : [])]
    const placed = new Set<string>()
    const placements: Array<ToolBoardPlacementType> = []
    for (const item of Array.isArray(saved?.placements) ? saved.placements : []) {
        if (!item || placed.has(item.toolId) || !available.some(tool => tool.id === item.toolId && !tool.archived)) continue
        placements.push({ toolId: item.toolId, ...(Number.isFinite(item.width) && Number(item.width) > 0 ? { width: item.width } : {}), ...(Number.isFinite(item.height) && Number(item.height) > 0 ? { height: item.height } : {}) })
        placed.add(item.toolId)
    }
    available.forEach(tool => {
        if (!tool.archived && !placed.has(tool.id) && !removedToolIds.includes(tool.id)) { placements.push({ toolId: tool.id }); placed.add(tool.id) }
    })
    return { direction: BOARD_DIRECTIONS.some(option => option.value === saved?.direction) ? saved!.direction : DEFAULT_BOARD.direction,
        wrap: BOARD_WRAPS.some(option => option.value === saved?.wrap) ? saved!.wrap : DEFAULT_BOARD.wrap,
        gap: Number.isFinite(saved?.gap) && Number(saved?.gap) >= 0 ? saved!.gap : DEFAULT_BOARD.gap,
        placements, removedToolIds: removedToolIds.filter(id => !placed.has(id)) }
}
export const createCategoryDraft = (category: ToolCategoryType, tools: Array<ToolType>): CategoryDraftType => ({ category: { ...structuredClone(category), archived: !!category.archived, board: reconcileBoard(category, tools) }, archiveChanges: {} })
export const draftFingerprint = (draft: CategoryDraftType) => JSON.stringify({ category: { ...draft.category, board: { ...draft.category.board, removedToolIds: [...draft.category.board.removedToolIds].sort() } }, archiveChanges: Object.fromEntries(Object.entries(draft.archiveChanges).sort(([a], [b]) => a.localeCompare(b))) })
export const removeFromBoard = (board: ToolCategoryBoardType, toolId: string): ToolCategoryBoardType => ({ ...board, placements: board.placements.filter(item => item.toolId !== toolId), removedToolIds: [...new Set([...board.removedToolIds, toolId])] })
export const placeTool = (board: ToolCategoryBoardType, toolId: string, beforeId?: string): ToolCategoryBoardType => {
    if (toolId === beforeId) return board
    const placement = board.placements.find(item => item.toolId === toolId) ?? { toolId }
    const placements = board.placements.filter(item => item.toolId !== toolId)
    const index = placements.findIndex(item => item.toolId === beforeId)
    placements.splice(index < 0 ? placements.length : index, 0, placement)
    return { ...board, placements, removedToolIds: board.removedToolIds.filter(id => id !== toolId) }
}
const updateArchive = (changes: ToolArchiveChangesType, original: ToolType, archived: boolean): ToolArchiveChangesType => {
    const next = { ...changes }
    if (!!original.archived === archived) delete next[original.id]
    else next[original.id] = archived
    return next
}
export const categoryDraftReducer = (draft: CategoryDraftType, action: ManageBoardActionType): CategoryDraftType => {
    if (action.type === "replace") return action.draft
    if (action.type === "category") return { ...draft, category: { ...draft.category, ...action.changes } }
    let board = draft.category.board
    let archiveChanges = draft.archiveChanges
    if (action.type === "layout") board = { ...board, ...action.changes }
    if (action.type === "remove") board = removeFromBoard(board, action.toolId)
    if (action.type === "drop") {
        if (action.tool.categoryId !== draft.category.id) return draft
        board = placeTool(board, action.tool.id, action.beforeId)
        archiveChanges = updateArchive(archiveChanges, action.tool, false)
    }
    if (action.type === "move") {
        const index = board.placements.findIndex(item => item.toolId === action.toolId)
        const destination = index + action.direction
        if (index < 0 || destination < 0 || destination >= board.placements.length) return draft
        board = placeTool(board, action.toolId, board.placements[action.direction < 0 ? destination : destination + 1]?.toolId)
    }
    if (action.type === "resize") board = { ...board, placements: board.placements.map(item => item.toolId === action.placement.toolId ? action.placement : item) }
    if (action.type === "archive-tool") {
        if (action.tool.categoryId !== draft.category.id) return draft
        board = removeFromBoard(board, action.tool.id)
        archiveChanges = updateArchive(archiveChanges, action.tool, action.archived)
    }
    return { ...draft, archiveChanges, category: { ...draft.category, board } }
}
export const validateCategoryDraft = (draft: CategoryDraftType, categories: Array<ToolCategoryType>): string => {
    const name = draft.category.name.trim()
    if (!name) return "Give this category a name before saving."
    if (categories.some(category => category.id !== draft.category.id && category.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase())) return "Another category already uses this name."
    if (!Number.isFinite(draft.category.board.gap) || draft.category.board.gap < 0) return "Spacing must be a nonnegative number."
    if (draft.category.board.placements.some(item => [item.width, item.height].some(value => value !== undefined && (!Number.isFinite(value) || value <= 0)))) return "Tool sizes must be positive numbers."
    return ""
}
export const saveCategoryDraft = (draft: CategoryDraftType) => {
    const latest = readToolCatalog()
    const error = validateCategoryDraft(draft, latest.categories)
    if (error) throw new Error(error)
    const tools = effectiveTools(latest.tools, draft.archiveChanges)
    const conflicts = tools.filter(tool => tool.categoryId === draft.category.id).flatMap(tool => globalVariableConflicts(tool, tools))
    if (conflicts.length) throw new Error(conflicts[0])
    const category = { ...draft.category, name: draft.category.name.trim(), board: reconcileBoard(draft.category, tools) }
    return saveManagedCategory(category, draft.archiveChanges)
}
export const categoryUrl = (categoryId: string) => `/manage-tools?category=${encodeURIComponent(categoryId)}`
export const editToolUrl = (toolId: string) => `/create-tool?toolId=${encodeURIComponent(toolId)}`
export const createToolUrl = (categoryId?: string) => categoryId ? `/create-tool?categoryId=${encodeURIComponent(categoryId)}` : "/create-tool"
export const viewToolUrl = (toolId: string) => `/tools/${encodeURIComponent(toolId)}`
