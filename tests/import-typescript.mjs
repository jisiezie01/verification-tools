import { readFile } from "node:fs/promises"
import { resolve, dirname, extname } from "node:path"
import ts from "typescript"

const modules = new Map()

// Load the project's pure TypeScript modules with the already installed compiler.
// Browser dependencies and type-only imports are not required by these tests.
export async function importTypeScript(file) {
    const url = await moduleUrl(resolve(file))
    return import(url)
}

async function moduleUrl(file) {
    if (modules.has(file)) return modules.get(file)
    let source = ts.transpileModule(await readFile(file, "utf8"), {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    }).outputText
    for (const match of [...source.matchAll(/from ["'](\.[^"']+)["']/g)]) {
        const dependency = resolve(dirname(file), match[1] + (extname(match[1]) ? "" : ".ts"))
        source = source.replace(match[0], `from "${await moduleUrl(dependency)}"`)
    }
    const url = `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
    modules.set(file, url)
    return url
}
