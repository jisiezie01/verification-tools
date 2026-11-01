import assert from "node:assert/strict"
import { startPagesServer, pagesPrefix } from "./static-pages-server.mjs"
import { connectBrowser } from "./browser-client.mjs"
import { makeCatalog } from "./fixtures/tools.mjs"

const fixture = makeCatalog()
fixture.categories[0].board = { direction: "column", wrap: "nowrap", gap: 31, placements: [{ toolId: "phone", width: 580 }], removedToolIds: ["agreement"] }
const prefix = pagesPrefix
const server = await startPagesServer(4175, fixture)
const browser = await connectBrowser()
try {
    await browser.send("Page.navigate", { url: "about:blank" })
    await browser.waitFor("location.href === 'about:blank'")
    await browser.navigate(`http://127.0.0.1:4175${prefix}#/tools?category=references`)
    await browser.waitFor("!!document.querySelector('[data-tools-board]')")
    assert.equal(await browser.evaluate("document.querySelectorAll('[data-published-tool]').length"), 1)
    assert.equal(await browser.evaluate("getComputedStyle(document.querySelector('[data-tools-board]')).gap"), "31px")
    assert.equal(await browser.evaluate("getComputedStyle(document.querySelector('[data-tools-board]')).flexDirection"), "column")
    await browser.evaluate("localStorage.setItem('verification-tools.tools.v1', 'broken'); localStorage.setItem('verification-tools.categories.v1','[]')")
    await browser.navigate()
    assert.equal(await browser.evaluate("document.querySelector('[data-published-tool]').dataset.publishedTool"), "phone")
    assert.equal(await browser.evaluate("Array.from(document.querySelectorAll('button')).some(b => b.textContent === 'Manage tools')"), false)
    await browser.navigate(`http://127.0.0.1:4175${prefix}create-tool/`)
    await browser.waitFor("location.pathname === '/verification-tools/tools'")
    assert.deepEqual(browser.runtimeErrors, [])
    console.log("Published browser checks passed: nested Pages path, shared JSON layout, refresh, local-storage independence, read-only routes.")
} finally {
    browser.close()
    await new Promise(resolve => server.close(resolve))
}
