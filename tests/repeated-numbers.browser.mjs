import assert from "node:assert/strict"
import { connectBrowser } from "./browser-client.mjs"
import { pagesPrefix, startPagesServer } from "./static-pages-server.mjs"
import { makeRepeatedNumberCatalog } from "./fixtures/repeated-numbers.mjs"

const catalog = makeRepeatedNumberCatalog()
delete catalog.tools[0].elements.find(element => element.id === "months").repeatable
const server = await startPagesServer(4176, catalog)
let browser
try {
    browser = await connectBrowser()
    const { navigate, click, clickText, fill, evaluate, waitFor } = browser
    const rowCount = () => evaluate("document.querySelectorAll('[data-runtime-element=months] input').length")
    const result = () => evaluate("document.querySelector('[data-runtime-element=result]')?.textContent ?? ''")
    await browser.send("Network.enable")
    await browser.send("Network.setBlockedURLs", { urls: ["*googletagmanager.com/*", "*google-analytics.com/*", "*analytics.google.com/*", "*doubleclick.net/*"] })
    await navigate(`http://127.0.0.1:4176${pagesPrefix}create-tool/?toolId=address-months`)
    await click('[data-builder-element="months"]')
    await evaluate("Array.from(document.querySelectorAll('label')).find(label => label.textContent.includes('Allow additional fields')).querySelector('input').click()")
    await browser.settle()
    await fill("Add field button text", "Add another address")
    await clickText("Save tool")
    await waitFor("document.body.textContent.includes('Applied to this demo only')")
    await clickText("Manage tools")
    await click('[aria-label="Edit Address months"]')
    await click('[data-builder-element="months"]')
    assert.equal(await evaluate("Array.from(document.querySelectorAll('label')).find(label => label.textContent.includes('Allow additional fields')).querySelector('input').checked"), true)
    await clickText("Manage tools")
    await clickText("Use tools")
    await waitFor("!!document.querySelector('[data-tools-board]')")
    assert.equal(await rowCount(), 1)
    await fill("Months stayed on address 1", "4")
    await clickText("Add another address")
    await fill("Months stayed on address 2", "5")
    await clickText("Add another address")
    await fill("Months stayed on address 3", "3")
    assert.equal(await rowCount(), 3)
    await clickText("Generate")
    assert.equal(await result(), "Requirement met: 12 months.")
    assert.equal(await rowCount(), 3, "Generation preserves entered fields")
    await clickText("Add another address")
    await clickText("Generate")
    assert.equal(await evaluate("document.body.textContent.includes('complete every field')"), true)
    await click('[aria-label="Remove Months stayed on address 4"]')
    await fill("Months stayed on address 3", "2")
    await clickText("Generate")
    assert.equal(await result(), "Below requirement: 11 months.")
    await click('[aria-label="Remove Months stayed on address 2"]')
    await clickText("Generate")
    assert.equal(await result(), "Below requirement: 6 months.")
    await clickText("Reset")
    assert.equal(await rowCount(), 1)
    assert.equal(await evaluate("document.querySelector('[data-runtime-element=months] input').value"), "")
    assert.equal(await result(), "")
    assert.deepEqual(browser.runtimeErrors, [])
    console.log("Repeated number browser checks passed: builder settings, save/reopen, numbering, add/remove, sum conditions, incomplete rows, and reset.")
} finally {
    if (browser) {
        await browser.send("Page.navigate", { url: "about:blank" })
        await browser.send("Network.setBlockedURLs", { urls: [] })
        browser.close()
    }
    server.closeAllConnections()
    await new Promise(resolve => server.close(resolve))
}
