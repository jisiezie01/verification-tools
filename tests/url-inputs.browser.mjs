import assert from "node:assert/strict"
import { catalogFixture } from "./catalog-browser-fixture.mjs"
import { connectBrowser } from "./browser-client.mjs"
import { importTypeScript } from "./import-typescript.mjs"

const { createElement } = await importTypeScript("src/screens/CreateTool/functions.ts")
const fixture = await catalogFixture()
const browser = await connectBrowser()
const { navigate, evaluate, fill, click, clickText, waitFor } = browser
const origin = process.env.TEST_ORIGIN ?? "http://127.0.0.1:5173"
function makeTool(id, categoryId, syncWithUrl = true) {
    const tool = { id, categoryId, name: id, elements: [] }
    tool.elements.push({ ...createElement("Text input", tool), id: `${id}-input`, variableName: "name_input", label: `${id} name`, textCase: "none", syncWithUrl })
    tool.elements.push({ ...createElement("Reset button", tool), id: `${id}-reset` })
    return tool
}
const read = id => evaluate(`document.querySelector('[data-runtime-element="${id}-input"] input').value`)
const scope = id => `document.querySelector('[data-tool-content="${id}"]')`

try {
    const source = { ...makeTool("source", "one"), isGlobal: true }
    const peer = makeTool("peer", "one")
    const off = makeTool("off", "one", false)
    const destination = makeTool("destination", "two")
    const consumer = { id: "consumer", categoryId: "one", name: "Global consumer", elements: [] }
    consumer.elements.push({ ...createElement("Output text", consumer), id: "result", generatedText: { default: "Hello ${global.name_input}" } })
    consumer.elements.push({ ...createElement("Generate button", consumer), id: "generate", link: "result" })
    await fixture.seed({ categories: [{ id: "one", name: "One" }, { id: "two", name: "Two" }], tools: [source, peer, off, destination, consumer] })

    // The editor defaults off, and persists an explicitly enabled setting.
    await navigate(`${origin}/create-tool?toolId=off`)
    await click('[data-builder-element="off-input"]')
    const toggle = `Array.from(document.querySelectorAll('label')).find(label => label.textContent.trim() === 'Share value through URL').querySelector('input')`
    assert.equal(await evaluate(`${toggle}.checked`), false)
    await evaluate(`${toggle}.click()`)
    await clickText("Save tool")
    assert.equal((await fixture.read()).tools.find(tool => tool.id === "off").elements[0].syncWithUrl, true)
    await fixture.seed({ categories: [{ id: "one", name: "One" }, { id: "two", name: "Two" }], tools: [source, peer, off, destination, consumer] })

    await navigate(`${origin}/tools?category=one&name_input=Initial%20Name&untouched=keep`)
    assert.equal(await read("source"), "Initial Name")
    assert.equal(await read("peer"), "Initial Name")
    assert.equal(await read("off"), "")
    const historyLength = await evaluate("history.length")
    const value = "John Doe + José & # %"
    await fill("source name", value)
    assert.equal(await evaluate("new URLSearchParams(location.search).get('name_input')"), value)
    assert.equal(await read("peer"), value)
    assert.equal(await evaluate("history.length"), historyLength)
    await fill("off name", "Private")
    assert.equal(await evaluate("new URLSearchParams(location.search).get('name_input')"), value)
    await clickText("Generate", scope("consumer"))
    assert.equal(await evaluate("document.querySelector('[data-runtime-element=result]').textContent"), `Hello ${value}`)
    await clickText("Two")
    assert.equal(await read("destination"), value)
    await navigate()
    assert.equal(await read("destination"), value)
    await evaluate("history.back()")
    await waitFor("!!document.querySelector('[data-tool-content=source]')")
    assert.equal(await read("source"), value)
    await clickText("Manage tools")
    assert.equal(await read("source"), value)
    await clickText("Two")
    assert.equal(await read("destination"), value)
    await clickText("Use tools")
    assert.equal(await read("destination"), value)
    await fill("destination name", "")
    assert.equal(await evaluate("new URLSearchParams(location.search).get('name_input')"), "")
    await clickText("One")
    assert.equal(await read("source"), "")
    await fill("peer name", "Reset me")
    await clickText("Reset", scope("source"))
    assert.equal(await read("peer"), "")
    assert.equal(await evaluate("new URLSearchParams(location.search).has('name_input')"), false)
    assert.equal(await evaluate("new URLSearchParams(location.search).get('untouched')"), "keep")

    await navigate(`${origin}/tools/destination?name_input=Direct%20Link`)
    assert.equal(await read("destination"), "Direct Link")
    await clickText("Open category")
    assert.equal(await read("destination"), "Direct Link")
    assert.deepEqual(browser.runtimeErrors, [])
    console.log("URL input browser checks passed")
} finally {
    await fixture.restore()
    browser.close()
}
