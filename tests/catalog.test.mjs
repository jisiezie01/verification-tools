import assert from "node:assert/strict"
import test from "node:test"
import { seedCatalog } from "./catalog-fixture.mjs"
import { importTypeScript } from "./import-typescript.mjs"
import { makeCatalog } from "./fixtures/tools.mjs"
const store = await importTypeScript("src/data/toolCatalog/functions.ts")

test("published catalog ignores browser storage and rejects writes", async () => {
    const expected = makeCatalog()
    globalThis.localStorage = { getItem: () => "broken old data" }
    await seedCatalog(expected, false)
    assert.deepEqual(store.readToolCatalog(), expected)
    await assert.rejects(store.updateToolCatalog(current => ({ ...current, tools: [] })), /published catalog/)
    assert.deepEqual(store.readToolCatalog(), expected)
})
test("queued writes preserve both changes; stale revisions never overwrite the file", async () => {
    const state = await seedCatalog(makeCatalog())
    await Promise.all([
        store.updateToolCatalog(current => ({ ...current, categories: current.categories.map(c => ({ ...c, name: c.name + " updated" })) })),
        store.updateToolCatalog(current => ({ ...current, tools: [] })),
    ])
    assert.equal(state.data.tools.length, 0)
    assert.ok(state.data.categories.every(c => c.name.endsWith(" updated")))
    state.revision++
    await assert.rejects(store.updateToolCatalog(current => ({ ...current, categories: [] })), /reload/)
    assert.ok(state.data.categories.length)
})
test("browser migration writes one complete catalog without deleting the old copy", async () => {
    const expected = makeCatalog()
    globalThis.localStorage = { getItem: key => JSON.stringify(key.includes("categories") ? expected.categories : expected.tools) }
    const state = await seedCatalog({ categories: [], tools: [] })
    await store.importBrowserCatalog()
    assert.deepEqual(state.data, { version: 1, ...expected })
    await assert.rejects(store.importBrowserCatalog(), /only when.*empty/)
})
