import assert from "node:assert/strict"
import test from "node:test"
import { readFile } from "node:fs/promises"
import vm from "node:vm"
import ts from "typescript"

async function load(file, globals, production = true) {
    let source = ts.transpileModule(await readFile(file, "utf8"), {
        compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
    }).outputText
    source = source.replace(/^import .*$/gm, "").replace(/export /g, "")
        .replaceAll("import.meta.env.PROD", String(production)).replaceAll("import.meta.env.BASE_URL", '"/verification-tools/"')
    const context = vm.createContext({ ...globals })
    vm.runInContext(source, context)
    return expression => vm.runInContext(expression, context)
}

test("tool metadata and action clicks exclude form content and remain safe without analytics", async () => {
    const calls = []
    const window = { gtag: (...args) => calls.push(args) }
    const tool = { id: "tool-1", name: "Calculator", categoryId: "calculators", elements: [{ value: "PRIVATE SENTINEL" }] }
    const evaluate = await load("src/analytics.ts", { window, tool, context: { categoryName: "Calculators", source: "workspace" } })
    for (const event of ["tool_view", "tool_use", "tool_generate", "tool_copy", "tool_reset"]) {
        assert.equal(evaluate(`trackToolEvent('${event}', tool, context)`), true)
    }
    for (const action of ["generate", "copy", "reset"]) evaluate(`trackToolEvent('tool_action_click', tool, context, '${action}')`)
    assert.equal(calls.length, 8)
    assert.deepEqual(calls.slice(5).map(call => call[2].tool_action), ["generate", "copy", "reset"])
    assert.equal(JSON.stringify(calls).includes("PRIVATE SENTINEL"), false)
    assert.deepEqual(Object.keys(calls[0][2]).sort(), ["tool_category", "tool_category_id", "tool_id", "tool_name", "tool_source"])
    assert.equal(evaluate("trackToolEvent('tool_view', tool)"), false, "Editor previews have no analytics context")
    window.gtag = undefined
    assert.equal(evaluate("trackToolEvent('tool_copy', tool, context)"), false)
    window.gtag = () => { throw new Error("Blocked") }
    assert.equal(evaluate("trackToolEvent('tool_copy', tool, context)"), false)
    const dev = await load("src/analytics.ts", { window, tool, context: {} }, false)
    assert.equal(dev("trackToolEvent('tool_view', tool, context)"), false)
})

test("views require continuous visibility, pause in hidden tabs, deduplicate, and clean up", async () => {
    const timers = new Map()
    const listeners = new Map()
    const element = {}
    let nextId = 0, observer, views = 0
    const document = {
        visibilityState: "visible",
        addEventListener: (name, callback) => listeners.set(name, callback),
        removeEventListener: name => listeners.delete(name),
    }
    const evaluate = await load("src/data/analytics/functions.ts", {
        document, element, onView: () => { views++; return true },
        setTimeout: (callback, ms) => { assert.equal(ms, 1000); timers.set(++nextId, callback); return nextId },
        clearTimeout: id => timers.delete(id),
        IntersectionObserver: class {
            constructor(callback) { this.callback = callback; observer = this }
            observe(target) { assert.equal(target, element) }
            disconnect() { this.disconnected = true }
        },
    })
    const tick = () => { const pending = [...timers.values()]; timers.clear(); pending.forEach(callback => callback()) }
    const visible = value => observer.callback([{ target: element, isIntersecting: value, intersectionRect: { width: 100, height: value ? 80 : 0 } }])
    evaluate("const cleanup = observeVisibleOnce(element, onView)")
    tick(); assert.equal(views, 0)
    visible(true); visible(false); tick(); assert.equal(views, 0, "Scrolling past too quickly does not count")
    visible(true); document.visibilityState = "hidden"; listeners.get("visibilitychange")(); tick(); assert.equal(views, 0)
    document.visibilityState = "visible"; listeners.get("visibilitychange")(); tick(); assert.equal(views, 1)
    visible(false); visible(true); tick(); assert.equal(views, 1, "A return to the same mounted view does not count twice")
    assert.equal(observer.disconnected, true)
    assert.equal(listeners.size, 0)
    evaluate("cleanup()")
    assert.equal(timers.size, 0)
    evaluate("const cleanup2 = observeVisibleOnce(element, onView)")
    visible(true); evaluate("cleanup2()"); tick(); assert.equal(views, 1, "Unmount cancels pending views")
})

test("guide views and navigation report section names without URL queries", async () => {
    const calls = [], observations = [], listeners = new Map()
    const heading = { textContent: "5. Check whether a stay reaches the required months" }
    const section = { id: "rental-history", querySelector: () => heading, closest: () => section }
    const location = new URL("https://example.test/verification-tools/guide/?private=PRIVATE")
    const document = {
        querySelector: () => ({}), querySelectorAll: () => [section], getElementById: () => section,
        addEventListener: (name, callback) => listeners.set(name, callback),
    }
    class Element {
        constructor(link) { this.link = link }
        closest() { return this.link }
    }
    const window = { gtag: (...args) => calls.push(args) }
    const globals = { window, document, location, URL, Element, observeVisibleOnce: (_element, callback) => observations.push(callback) }
    await load("src/guide.ts", globals)
    observations.forEach(callback => callback())
    assert.deepEqual(calls.map(call => call[1]), ["guide_view", "guide_section_view"])
    const click = href => listeners.get("click")({ target: new Element({ href, textContent: "Rental-history dates", closest: selector => selector === ".guide-nav" ? {} : null }) })
    click("https://example.test/verification-tools/guide/?private=PRIVATE#rental-history")
    assert.equal(calls.at(-1)[1], "guide_click")
    assert.equal(calls.at(-1)[2].guide_target, "section:rental-history")
    assert.equal(calls.at(-1)[2].guide_section_id, "rental-history")
    assert.equal(calls.at(-1)[2].guide_click_source, "contents")
    click("https://example.test/verification-tools/tools/?private=PRIVATE")
    assert.equal(calls.at(-1)[2].guide_target, "workspace")
    assert.equal(JSON.stringify(calls).includes("PRIVATE"), false)
    window.gtag = () => { throw new Error("Blocked") }
    assert.doesNotThrow(() => click("https://example.test/verification-tools/"))
    observations.length = 0
    await load("src/guide.ts", globals, false)
    assert.equal(observations.length, 0, "Development mode does not register custom impressions")
})
