import { readFile, writeFile } from "node:fs/promises"
// Run file-mutating browser suites sequentially; always restore the author's catalog.
export async function catalogFixture() {
    const path = new URL("../public/tool-catalog.json", import.meta.url)
    const original = await readFile(path, "utf8")
    return {
        seed: catalog => writeFile(path, JSON.stringify({ version: 1, ...catalog }, null, 2)),
        corrupt: () => writeFile(path, "{bad json"),
        read: async () => JSON.parse(await readFile(path, "utf8")),
        restore: () => writeFile(path, original),
    }
}
