import { importTypeScript } from "./import-typescript.mjs"
const storage = await importTypeScript("src/data/toolCatalog/functions.ts")
export async function seedCatalog(catalog, writable = true) {
    const state = { data: { version: 1, ...structuredClone(catalog) }, fail: false, revision: 1 }
    globalThis.fetch = async (_url, options = {}) => {
        if (options.method === "PUT") {
            if (state.fail) return Response.json({ error: "Disk write failed" }, { status: 500 })
            if (options.headers["If-Match"] !== String(state.revision)) return Response.json({ error: "Catalog changed; reload" }, { status: 409 })
            state.data = JSON.parse(options.body)
            state.revision++
        }
        return Response.json(state.data, { headers: { ETag: String(state.revision) } })
    }
    await storage.initializeToolCatalog("/catalog", writable)
    return state
}
