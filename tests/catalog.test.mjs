import assert from "node:assert/strict"
import test from "node:test"
import { seedCatalog } from "./catalog-fixture.mjs"
import { importTypeScript } from "./import-typescript.mjs"
import { makeCatalog } from "./fixtures/tools.mjs"
const store = await importTypeScript("src/data/toolCatalog/functions.ts")

test("published demo ignores browser storage, validates updates, and never writes remotely", async () => {
    const expected = makeCatalog()
    globalThis.localStorage = { getItem: () => "broken old data", setItem: () => { throw new Error("Demo must not persist") } }
    const server = await seedCatalog(expected, false)
    const originalFetch = globalThis.fetch
    let requests = 0
    globalThis.fetch = (...args) => { requests++; return originalFetch(...args) }
    assert.deepEqual(store.readToolCatalog(), expected)
    await Promise.all([
        store.updateToolCatalog(current => ({ ...current, categories: current.categories.map(c => ({ ...c, name: c.name + " demo" })) })),
        store.updateToolCatalog(current => ({ ...current, tools: [] })),
    ])
    const result = store.readToolCatalog()
    assert.equal(result.tools.length, 0)
    assert.ok(result.categories.every(c => c.name.endsWith(" demo")))
    assert.deepEqual(server.data, { version: 1, ...expected })
    assert.equal(requests, 0)
    result.categories[0].name = "mutated snapshot"
    assert.notEqual(store.readToolCatalog().categories[0].name, "mutated snapshot")
    await assert.rejects(store.updateToolCatalog(current => ({ ...current, categories: [...current.categories, current.categories[0]] })), /unique/)
    await store.initializeToolCatalog("/catalog", false)
    assert.deepEqual(store.readToolCatalog(), expected, "Reloading restores the published catalog")
    assert.equal(requests, 1)
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
