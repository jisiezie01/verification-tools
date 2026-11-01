import { createServer } from "node:http"
import { readFile, stat } from "node:fs/promises"
import { resolve, extname, sep } from "node:path"

export const pagesPrefix = "/verification-tools/"
export async function startPagesServer(port, catalog) {
    const root = resolve("dist")
    const server = createServer(async (req, res) => {
        const url = new URL(req.url, "http://localhost")
        if (url.pathname === pagesPrefix.slice(0, -1)) { res.writeHead(301, { Location: pagesPrefix + url.search }).end(); return }
        if (!url.pathname.startsWith(pagesPrefix)) { res.writeHead(404).end(); return }
        let path = resolve(root, decodeURIComponent(url.pathname.slice(pagesPrefix.length)))
        if (path !== root && !path.startsWith(root + sep)) { res.writeHead(404).end(); return }
        try {
            if ((await stat(path)).isDirectory()) {
                if (!url.pathname.endsWith("/")) { res.writeHead(301, { Location: url.pathname + "/" + url.search }).end(); return }
                path = resolve(path, "index.html")
            }
            const data = catalog && url.pathname === pagesPrefix + "tool-catalog.json" ? JSON.stringify({ version: 1, ...catalog }) : await readFile(path)
            res.setHeader("Content-Type", ({ ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".html": "text/html", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".xml": "application/xml" })[extname(path).toLowerCase()] || "application/octet-stream")
            res.end(data)
        } catch {
            res.writeHead(404, { "Content-Type": "text/html" }).end(await readFile(resolve(root, "404.html")))
        }
    })
    await new Promise(resolve => server.listen(port, "127.0.0.1", resolve))
    return server
}
