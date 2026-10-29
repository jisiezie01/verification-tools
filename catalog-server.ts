import { createHash, randomUUID } from "node:crypto"
import { readFile, rename, writeFile, unlink } from "node:fs/promises"
import { resolve } from "node:path"
import type { Plugin } from "vite"
import { parseToolCatalog } from "./src/data/toolCatalog/functions"

const etag = (text: string) => `"${createHash("sha256").update(text).digest("hex")}"`

export const catalogFilePlugin = (): Plugin => ({
    name: "catalog-file",
    configureServer(server) {
        const file = resolve(server.config.root, "public/tool-catalog.json")
        // Saving content must not reload the editor while its request is in flight.
        void server.watcher.unwatch(file)
        let queue: Promise<unknown> = Promise.resolve()
        server.middlewares.use("/__catalog", (request, response) => {
            const run = async () => {
                response.setHeader("Content-Type", "application/json")
                response.setHeader("Cache-Control", "no-store")
                try {
                    const original = await readFile(file, "utf8")
                    // Refuse to overwrite a broken file, even if a client sends valid data.
                    parseToolCatalog(JSON.parse(original))
                    if (request.method === "GET") {
                        response.setHeader("ETag", etag(original))
                        response.end(original)
                        return
                    }
                    if (request.method !== "PUT") { response.statusCode = 405; response.end(JSON.stringify({ error: "Method not allowed." })); return }
                    const origin = request.headers.origin
                    if (!origin || new URL(origin).host !== request.headers.host || request.headers["content-type"] !== "application/json") {
                        response.statusCode = 403; response.end(JSON.stringify({ error: "Only same-origin JSON writes are allowed." })); return
                    }
                    if (request.headers["if-match"] !== etag(original)) {
                        response.statusCode = 409; response.end(JSON.stringify({ error: "The catalog changed in another tab or on disk. Reload before saving again." })); return
                    }
                    let body = ""
                    for await (const chunk of request) {
                        body += chunk.toString()
                        if (Buffer.byteLength(body) > 10 * 1024 * 1024) { response.statusCode = 413; response.end(JSON.stringify({ error: "The catalog exceeds the 10 MB limit." })); return }
                    }
                    let data
                    try { data = parseToolCatalog(JSON.parse(body)) }
                    catch { response.statusCode = 400; response.end(JSON.stringify({ error: "Invalid catalog JSON. The saved file has not been changed." })); return }
                    const serialized = JSON.stringify({ version: 1, ...data }, null, 2) + "\n"
                    const temporary = `${file}.${randomUUID()}.tmp`
                    try {
                        await writeFile(temporary, serialized, "utf8")
                        await rename(temporary, file)
                    } finally { await unlink(temporary).catch(() => {}) }
                    response.setHeader("ETag", etag(serialized))
                    response.end(serialized)
                } catch (error) {
                    response.statusCode = 500
                    response.end(JSON.stringify({ error: `The catalog file could not be read or saved: ${error instanceof Error ? error.message : "unknown error"}` }))
                }
            }
            queue = queue.then(run, run)
        })
    },
})
