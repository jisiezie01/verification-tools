import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { connectBrowser } from "./browser-client.mjs"
import { makeCatalog } from "./fixtures/tools.mjs"
import { pagesPrefix, startPagesServer } from "./static-pages-server.mjs"

const fixture = makeCatalog()
// Use an emitted tool URL to exercise a full page load with a controlled catalog.
const published = JSON.parse(await readFile("dist/tool-catalog.json", "utf8"))
const agreement = fixture.tools[0]
agreement.id = published.tools[0].id
agreement.elements.forEach(element => { element.toolId = agreement.id })
const dates = fixture.tools.find(tool => tool.id === "dates")
// A static output also supports use starting with Copy or Generate, without typing.
for (const id of ["agreement-output", "agreement-generate", "agreement-copy", "agreement-reset"]) {
    const element = structuredClone(agreement.elements.find(item => item.id === id))
    element.id = id.replace("agreement", "dates")
    element.toolId = dates.id
    element.categoryId = dates.categoryId
    delete element.containerId
    if (element.type === "Output text") Object.assign(element, { generatedText: { default: "Static example" }, conditions: [], initiallyHidden: false })
    if ("link" in element) element.link = "dates-output"
    dates.elements.push(element)
}
const scope = `document.querySelector('[data-tool-content="${agreement.id}"]')`
const server = await startPagesServer(4176, fixture)
const browser = await connectBrowser()
const allEvents = () => browser.evaluate("(window.dataLayer ?? []).filter(item => item[0] === 'event').map(item => Array.from(item))")
const events = async () => (await allEvents()).filter(event => !["tool_view", "tool_action_click"].includes(event[1]))
const count = async name => (await events()).filter(event => event[1] === name).length
const mockClipboard = () => browser.evaluate("window.copied = []; Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async value => { window.copied.push(value) } } })")

try {
    // Keep synthetic test traffic out of the real GA4 property, while using the HTML's gtag queue.
    await browser.send("Network.enable")
    await browser.send("Network.setBlockedURLs", { urls: ["*googletagmanager.com/*", "*google-analytics.com/*", "*analytics.google.com/*", "*doubleclick.net/*"] })
    await browser.navigate(`http://127.0.0.1:4176${pagesPrefix}tools/`)
    await browser.waitFor("!!document.querySelector('[data-tools-board]')")
    assert.deepEqual(await events(), [], "Rendering tools must not count as use")
    await browser.clickText("Generate", scope)
    assert.deepEqual(await events(), [], "Failed validation must not count as generation or use")
    assert.equal((await allEvents()).filter(event => event[1] === "tool_action_click" && event[2].tool_action === "generate").length, 1, "Failed validation still counts as a button click")
    await browser.evaluate(`${scope}.scrollIntoView({ block: 'start' })`)
    await browser.waitFor(`(window.dataLayer ?? []).some(event => event[1] === 'tool_view' && event[2].tool_id === ${JSON.stringify(agreement.id)})`)

    await browser.fill("Full name", "Private Sentinel")
    await browser.fill("Full name", "Private Sentinel Updated")
    await browser.click('[data-runtime-element="agreement-consent"] input[value="yes"]')
    assert.equal(await count("tool_use"), 1, "Typing and selecting options should count only once per use cycle")
    await browser.clickText("Generate", scope)
    assert.equal(await count("tool_generate"), 1)
    assert.equal(await count("tool_use"), 1)

    await browser.evaluate("Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('Clipboard denied') } } })")
    await browser.clickText("Copy result", scope)
    assert.equal(await count("tool_copy"), 0, "A rejected clipboard write must not count as a copy")
    assert.equal((await allEvents()).filter(event => event[1] === "tool_action_click" && event[2].tool_action === "copy").length, 1)
    await mockClipboard()
    await browser.clickText("Copy result", scope)
    await browser.waitFor("window.copied.length === 1")
    assert.equal(await count("tool_copy"), 1)
    assert.equal(await browser.evaluate("window.copied[0]"), "I, Private Sentinel Updated agree")
    assert.equal(await count("tool_use"), 1)

    for (const [command, name, parameters] of await events()) {
        assert.equal(command, "event")
        assert.ok(["tool_use", "tool_generate", "tool_copy"].includes(name))
        assert.deepEqual(parameters, {
            tool_id: agreement.id, tool_name: "Agreement generator",
            tool_category_id: "references", tool_category: "Reference tools", tool_source: "workspace",
        }, "Only catalog metadata may reach GA4; never form values or generated text")
    }

    await browser.clickText("Reset", scope)
    assert.equal(await count("tool_reset"), 1)
    assert.equal((await allEvents()).filter(event => event[1] === "tool_action_click" && event[2].tool_action === "reset").length, 1)
    await browser.fill("Full name", "Another private entry")
    assert.equal(await count("tool_use"), 2, "Reset starts a new use cycle")
    await browser.fill("Phone to format", "4155550123")
    assert.equal(await count("tool_use"), 3, "Sibling tools have independent use cycles")
    assert.equal((await events()).at(-1)[2].tool_name, "Phone formatter")
    await browser.clickText("Copy", "document.querySelector('[data-tool-content=\"phone\"]')")
    assert.equal(await count("tool_copy"), 2, "Input copy buttons also report successful copies")

    await browser.clickText("Formatters")
    await browser.clickText("Copy result")
    assert.equal(await count("tool_use"), 4, "Copying an initially visible output starts use without typing")
    await browser.fill("Date to copy", "2026-10-01")
    assert.equal((await events()).at(-1)[2].tool_category, "Formatters")
    assert.equal(await count("tool_use"), 4)
    await browser.clickText("Reset")
    await browser.clickText("Generate")
    assert.equal(await count("tool_use"), 5, "Generating static text starts use without typing")
    assert.equal(await count("tool_generate"), 2)
    const beforePreview = await allEvents()
    await browser.clickText("Manage tools")
    await browser.waitFor("!!document.querySelector('[data-category-board]')")
    await browser.fill("Date to copy", "2026-10-02")
    assert.deepEqual(await allEvents(), beforePreview, "Management previews must not report views, clicks, or usage")

    await browser.navigate(`http://127.0.0.1:4176${pagesPrefix}tools/${encodeURIComponent(agreement.id)}/`)
    await browser.fill("Full name", "Standalone private entry")
    assert.equal(await count("tool_use"), 1)
    assert.equal((await events())[0][2].tool_source, "tool_page")
    await browser.click('[data-runtime-element="agreement-consent"] input[value="yes"]')
    await browser.clickText("Generate", scope)
    assert.equal(await count("tool_generate"), 1)

    // Missing or broken analytics must leave the tools fully usable.
    await browser.evaluate("window.gtag = undefined")
    await browser.clickText("Reset", scope)
    await browser.fill("Full name", "No analytics")
    await browser.click('[data-runtime-element="agreement-consent"] input[value="yes"]')
    await browser.evaluate("window.gtag = () => { throw new Error('Blocked analytics') }")
    await browser.clickText("Generate", scope)
    assert.ok(await browser.evaluate(`${scope}.textContent.includes('I, No Analytics agree')`))
    await mockClipboard()
    await browser.clickText("Copy result", scope)
    assert.equal(await browser.evaluate("window.copied[0]"), "I, No Analytics agree")
    assert.equal(await count("tool_generate"), 1)
    assert.equal(await count("tool_copy"), 0)
    await browser.navigate(`http://127.0.0.1:4176${pagesPrefix}guide/`)
    await browser.waitFor("(window.dataLayer ?? []).some(event => event[1] === 'guide_view')")
    await browser.click('.guide-nav a[href="#rental-history"]')
    await browser.waitFor("(window.dataLayer ?? []).some(event => event[1] === 'guide_section_view' && event[2].guide_section_id === 'rental-history')")
    assert.equal((await allEvents()).filter(event => event[1] === "guide_click" && event[2].guide_target === "section:rental-history").length, 1)
    await browser.click('.guide-nav a[href="#basics"]')
    await browser.click('.guide-nav a[href="#rental-history"]')
    await browser.settle()
    assert.equal((await allEvents()).filter(event => event[1] === "guide_section_view" && event[2].guide_section_id === "rental-history").length, 1)
    assert.deepEqual(browser.runtimeErrors, [])
    console.log("Analytics browser checks passed: real gtag queue, usage deduplication, successful actions, reset cycles, per-tool/category metadata, preview exclusion, direct tool pages, private input exclusion, and missing/broken analytics.")
} finally {
    await browser.send("Network.setBlockedURLs", { urls: [] })
    browser.close()
    await new Promise(resolve => server.close(resolve))
}
