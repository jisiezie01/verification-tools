import { seedCatalog } from "./catalog-fixture.mjs"
import assert from "node:assert/strict"
import { test } from "node:test"
import { importTypeScript } from "./import-typescript.mjs"
import { makeCatalog } from "./fixtures/tools.mjs"

const board = await importTypeScript("src/screens/ManageTools/functions.ts")
const storage = await importTypeScript("src/data/toolCatalog/functions.ts")
const { resizedToolSize } = await importTypeScript("src/screens/ManageTools/components/ButtonResizeTool/functions.ts")

test("legacy categories default to a wrapping row with every active tool on the board", () => {
    const catalog = makeCatalog()
    const draft = board.createCategoryDraft(catalog.categories[0], catalog.tools)
    assert.equal(draft.category.board.direction, "row")
    assert.equal(draft.category.board.wrap, "wrap")
    assert.deepEqual(draft.category.board.placements.map(item => item.toolId), ["agreement", "phone"])
})
test("explicit removals persist while newly saved tools appear automatically", () => {
    const catalog = makeCatalog()
    let draft = board.createCategoryDraft(catalog.categories[0], catalog.tools)
    draft = board.categoryDraftReducer(draft, { type: "remove", toolId: "phone" })
    const extra = { ...catalog.tools[1], id: "new-tool" }
    const next = board.reconcileBoard(draft.category, [...catalog.tools, extra])
    assert.deepEqual(next.placements.map(item => item.toolId), ["agreement", "new-tool"])
    assert.deepEqual(next.removedToolIds, ["phone"])
})
test("reordering is stable, duplicate drops are prevented, and foreign-category drops are rejected", () => {
    const catalog = makeCatalog()
    let draft = board.createCategoryDraft(catalog.categories[0], catalog.tools)
    draft = board.categoryDraftReducer(draft, { type: "drop", tool: catalog.tools[1], beforeId: "agreement" })
    assert.deepEqual(draft.category.board.placements.map(item => item.toolId), ["phone", "agreement"])
    const same = board.categoryDraftReducer(draft, { type: "drop", tool: catalog.tools[1], beforeId: "phone" })
    assert.deepEqual(same.category.board, draft.category.board)
    assert.deepEqual(board.categoryDraftReducer(draft, { type: "drop", tool: catalog.tools[3] }), draft)
})
test("archiving removes a tool and restoring by drop puts it back on the board", () => {
    const catalog = makeCatalog()
    let draft = board.createCategoryDraft(catalog.categories[0], catalog.tools)
    draft = board.categoryDraftReducer(draft, { type: "archive-tool", tool: catalog.tools[0], archived: true })
    assert.equal(draft.archiveChanges.agreement, true)
    assert.ok(!draft.category.board.placements.some(item => item.toolId === "agreement"))
    draft = board.categoryDraftReducer(draft, { type: "drop", tool: catalog.tools[0] })
    assert.equal(draft.archiveChanges.agreement, undefined)
    assert.ok(draft.category.board.placements.some(item => item.toolId === "agreement"))
    draft = board.categoryDraftReducer(draft, { type: "drop", tool: catalog.tools[2] })
    assert.equal(draft.archiveChanges.archived, false)
})
test("saving persists layout, removals, category archive and tool status without replacing unrelated definitions", async () => {
    const catalog = makeCatalog(); await seedCatalog(catalog)
    let draft = board.createCategoryDraft(catalog.categories[0], catalog.tools)
    draft = board.categoryDraftReducer(draft, { type: "category", changes: { name: "  References renamed  ", archived: true } })
    draft = board.categoryDraftReducer(draft, { type: "layout", changes: { direction: "column", wrap: "nowrap", gap: 30 } })
    draft = board.categoryDraftReducer(draft, { type: "resize", placement: { toolId: "agreement", width: 520, height: 800 } })
    draft = board.categoryDraftReducer(draft, { type: "archive-tool", tool: catalog.tools[1], archived: true })
    const saved = await board.saveCategoryDraft(draft)
    assert.equal(saved.categories[0].name, "References renamed")
    assert.equal(saved.categories[0].archived, true)
    assert.equal(saved.categories[0].board.direction, "column")
    assert.deepEqual(saved.categories[0].board.placements, [{ toolId: "agreement", width: 520, height: 800 }])
    assert.equal(saved.tools[1].archived, true)
    assert.deepEqual(saved.tools[0].elements, catalog.tools[0].elements)
    assert.deepEqual(saved.categories[1], catalog.categories[1])
})
test("a failed file write keeps the saved catalog and unsaved draft intact", async () => {
    const catalog = makeCatalog(); const state = await seedCatalog(catalog)
    state.fail = true
    const draft = board.categoryDraftReducer(board.createCategoryDraft(catalog.categories[0], catalog.tools), { type: "archive-tool", tool: catalog.tools[0], archived: true })
    await assert.rejects(board.saveCategoryDraft(draft), /Disk write failed/)
    assert.deepEqual(storage.readToolCatalog(), catalog)
    assert.equal(draft.archiveChanges.agreement, true)
})
test("invalid names and corrupt JSON are reported without replacing data", async () => {
    const catalog = makeCatalog(); await seedCatalog(catalog)
    const draft = board.createCategoryDraft(catalog.categories[0], catalog.tools)
    draft.category.name = "Formatters"
    assert.ok(board.validateCategoryDraft(draft, catalog.categories))
    draft.category.name = "   "
    assert.throws(() => board.saveCategoryDraft(draft))
    globalThis.fetch = async () => new Response("{broken")
    await assert.rejects(storage.initializeToolCatalog("/catalog", true))
    assert.ok(storage.loadToolCatalog().error)
})

test("resizing is bounded by rendered content and changing metadata back clears the dirty fingerprint", () => {
    assert.deepEqual(resizedToolSize({ width: 600, height: 500, x: 10, y: 10 }, { width: 350, height: 420 }, -1000, -1000), { width: 350, height: 420 })
    const catalog = makeCatalog()
    const draft = board.createCategoryDraft(catalog.categories[0], catalog.tools)
    let changed = board.categoryDraftReducer(draft, { type: "category", changes: { name: "Other" } })
    assert.notEqual(board.draftFingerprint(changed), board.draftFingerprint(draft))
    changed = board.categoryDraftReducer(changed, { type: "category", changes: { name: draft.category.name } })
    assert.equal(board.draftFingerprint(changed), board.draftFingerprint(draft))
})
