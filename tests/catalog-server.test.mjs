import assert from "node:assert/strict"
import test from "node:test"
import { createServer } from "node:http"
import { mkdtemp, mkdir, readFile, writeFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { importTypeScript } from "./import-typescript.mjs"
const { catalogFilePlugin } = await importTypeScript("catalog-server.ts")

test("file API persists atomically and rejects conflicts, malformed data and cross-origin writes", async () => {
    const root = await mkdtemp(join(tmpdir(), "tool-catalog-test-"))
    const file = join(root, "public/tool-catalog.json")
    await mkdir(join(root, "public"))
    const initial = JSON.stringify({ version: 1, categories: [], tools: [] })
    await writeFile(file, initial)
    let handler
    catalogFilePlugin().configureServer({ config: { root }, watcher: { unwatch: () => {} }, middlewares: { use: (_path, callback) => { handler = callback } } })
    const server = createServer((request, response) => handler(request, response))
    await new Promise(resolve => server.listen(0, "127.0.0.1", resolve))
    const origin = `http://127.0.0.1:${server.address().port}`
    try {
        const loaded = await fetch(origin)
        const revision = loaded.headers.get("ETag")
        const next = { version: 1, categories: [{ id: "one", name: "Shared", board: { direction: "row", wrap: "wrap", gap: 24, placements: [], removedToolIds: [] } }], tools: [] }
        const put = (body, tag = revision, source = origin) => fetch(origin, { method: "PUT", headers: { "Content-Type": "application/json", "If-Match": tag, Origin: source }, body })
        assert.equal((await put(JSON.stringify(next), revision, "https://other.example")).status, 403)
        assert.equal((await put("{broken")).status, 400)
        assert.equal(await readFile(file, "utf8"), initial)
        const saved = await put(JSON.stringify(next))
        assert.equal(saved.status, 200)
        assert.deepEqual(JSON.parse(await readFile(file, "utf8")), next)
        assert.equal((await put(initial)).status, 409)
        assert.deepEqual(await (await fetch(origin)).json(), next)
        const tag = saved.headers.get("ETag")
        const removed = { version: 1, categories: [], tools: [] }
        assert.equal((await put(JSON.stringify(removed), tag)).status, 200)
        assert.deepEqual(JSON.parse(await readFile(file, "utf8")), removed)
        await writeFile(file, "{broken")
        assert.equal((await put(initial, tag)).status, 500)
        assert.equal(await readFile(file, "utf8"), "{broken")
    } finally {
        await new Promise(resolve => server.close(resolve))
        await rm(root, { recursive: true, force: true })
    }
})
