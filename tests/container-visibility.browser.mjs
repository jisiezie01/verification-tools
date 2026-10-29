import assert from "node:assert/strict"
import { connectBrowser } from "./browser-client.mjs"
import { catalogFixture } from "./catalog-browser-fixture.mjs"
import { makeCatalog } from "./fixtures/tools.mjs"
import { importTypeScript } from "./import-typescript.mjs"
const { createElement } = await importTypeScript("src/screens/CreateTool/functions.ts")
const file = await catalogFixture()
const browser = await connectBrowser()
const { navigate, waitFor, click, clickText, fill, evaluate } = browser
try {
    const catalog = makeCatalog()
    const tool = catalog.tools[0]
    tool.elements.push({ ...createElement("Container", tool), id: "details" })
    tool.elements.push({ ...createElement("Container", tool), id: "nested-details", containerId: "details" })
    tool.elements.find(e => e.id === "agreement-email").containerId = "nested-details"
    await file.seed(catalog)
    await navigate("http://127.0.0.1:5173/create-tool?toolId=agreement")
    await click('[data-builder-element="details"]')
    await fill("Container visibility", "show")
    await fill("Visibility radio group", "agreement-consent")
    await fill("Visibility selected option", "yes")
    assert.equal(await evaluate("!!document.querySelector('[data-builder-element=\"agreement-email\"]')"), true)
    await clickText("Save tool")
    await waitFor("document.body.textContent.includes('Ready to publish')")
    assert.deepEqual((await file.read()).tools.find(tool => tool.id === "agreement").elements.find(e => e.id === "details").visibility, { mode: "show", inputId: "agreement-consent", value: "yes" })
    await navigate("http://127.0.0.1:5173/tools?category=references")
    assert.equal(await evaluate("!!document.querySelector('[data-runtime-element=\"details\"]')"), false)
    await click('[data-runtime-element="agreement-consent"] input[value="yes"]')
    assert.equal(await evaluate("!!document.querySelector('[data-runtime-element=\"agreement-email\"]')"), true)
    await fill("Email", "saved@example.com")
    await click('[data-runtime-element="agreement-consent"] input[value="no"]')
    assert.equal(await evaluate("!!document.querySelector('[data-runtime-element=\"nested-details\"]')"), false)
    await click('[data-runtime-element="agreement-consent"] input[value="yes"]')
    assert.equal(await evaluate("document.querySelector('[data-runtime-element=\"agreement-email\"] input').value"), "saved@example.com")
    await click('[data-runtime-element="agreement-reset"] button')
    assert.equal(await evaluate("!!document.querySelector('[data-runtime-element=\"details\"]')"), false)
    await navigate("http://127.0.0.1:5173/create-tool?toolId=agreement")
    await click('[data-builder-element="details"]')
    await fill("Container visibility", "hide")
    await clickText("Save tool")
    await waitFor("document.body.textContent.includes('Ready to publish')")
    await navigate("http://127.0.0.1:5173/manage-tools?category=references")
    assert.equal(await evaluate("!!document.querySelector('[data-runtime-element=\"details\"]')"), true)
    await click('[data-runtime-element="agreement-consent"] input[value="yes"]')
    assert.equal(await evaluate("!!document.querySelector('[data-runtime-element=\"details\"]')"), false)
    await click('[data-runtime-element="agreement-reset"] button')
    assert.equal(await evaluate("!!document.querySelector('[data-runtime-element=\"details\"]')"), true)
    assert.deepEqual(browser.runtimeErrors, [])
    console.log("Container visibility browser checks passed: editor settings, JSON persistence, nested contents, radio switching, retained values, reset, tools and manager.")
} finally { browser.close(); await file.restore() }
