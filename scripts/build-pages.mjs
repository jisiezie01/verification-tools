import { mkdir, readFile, writeFile } from "node:fs/promises"
import { resolve, sep } from "node:path"

// GitHub Pages serves files, so emit a real entry for every published app URL.
const app = await readFile("dist/tools/index.html", "utf8")
const catalog = JSON.parse(await readFile("dist/tool-catalog.json", "utf8"))
const routes = ["create-tool", "manage-tools", ...catalog.tools.map(tool => `tools/${encodeURIComponent(tool.id)}`)]
for (const route of routes) {
    const directory = resolve("dist", route)
    if (!directory.startsWith(resolve("dist") + sep)) throw new Error("Invalid page path")
    await mkdir(directory, { recursive: true })
    await writeFile(resolve(directory, "index.html"), app)
}
await writeFile("dist/.nojekyll", "")
await writeFile("dist/sitemap.xml", '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://jisiezie01.github.io/verification-tools/</loc></url></urlset>\n')
console.log(`Created ${routes.length + 1} GitHub Pages app entries and landing-page sitemap.`)
