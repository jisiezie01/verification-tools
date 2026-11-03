import assert from "node:assert/strict"
import { connectBrowser } from "./browser-client.mjs"
import { pagesPrefix, startPagesServer } from "./static-pages-server.mjs"
import { makeDateOffsetCatalog } from "./fixtures/date-offsets.mjs"

const server = await startPagesServer(4176, makeDateOffsetCatalog())
let browser
try {
    browser = await connectBrowser()
    const { navigate, waitFor, click, clickText, fill, evaluate } = browser
    const result = () => evaluate("document.querySelector('[data-runtime-element=\"result\"]')?.textContent ?? ''")
    const fieldValue = label => evaluate(`(() => { const label = Array.from(document.querySelectorAll('label')).find(item => item.textContent === ${JSON.stringify(label)}); return label ? document.getElementById(label.htmlFor).value : null; })()`)
    const saveAndUse = async () => {
        await clickText("Save tool")
        await waitFor("document.body.textContent.includes('Applied to this demo only')")
        await clickText("Manage tools")
        await clickText("Use tools")
        await waitFor("!!document.querySelector('[data-tools-board]')")
    }
    const editRule = async () => {
        await clickText("Manage tools")
        await click('[aria-label="Edit Rental history"]')
        await click('[data-builder-element="result"]')
    }
    await browser.send("Network.enable")
    await browser.send("Network.setBlockedURLs", { urls: ["*googletagmanager.com/*", "*google-analytics.com/*", "*analytics.google.com/*", "*doubleclick.net/*"] })
    await browser.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1050, deviceScaleFactor: 1, mobile: false })
    await navigate(`http://127.0.0.1:4176${pagesPrefix}create-tool/?toolId=date-offset`)
    await click('[data-builder-element="result"]')
    assert.equal(await fieldValue("Additional offset (days)"), "")
    await fill("Additional offset (days)", "0.5")
    await clickText("Save tool")
    await waitFor("document.body.textContent.includes('additional offset must be a whole number of days')")
    await click('[data-builder-element="result"]')
    await fill("Additional offset (days)", "-15")
    await saveAndUse()
    await fill("Move in date", "07/25/2022")
    for (const [date, expected] of [["07/09/2023", "Requirement not met."], ["07/10/2023", "Requirement met."], ["11/03/2023", "Requirement met."]]) {
        await fill("Move out date", date)
        await clickText("Generate")
        assert.equal(await result(), expected, date)
    }
    await editRule()
    assert.equal(await fieldValue("Additional offset (days)"), "-15", "The saved adjustment must reopen unchanged")
    assert.equal(await fieldValue("Offset unit"), "months")
    assert.equal(await fieldValue("Offset (months) variable"), "months")
    await fill("Additional offset (days)", "")
    await saveAndUse()
    await fill("Move in date", "07/25/2022")
    await fill("Move out date", "07/10/2023")
    await clickText("Generate")
    assert.equal(await result(), "Requirement not met.", "Clearing the adjustment restores the full month requirement")
    await fill("Move out date", "07/25/2023")
    await clickText("Generate")
    assert.equal(await result(), "Requirement met.")
    await editRule()
    assert.equal(await evaluate("Array.from(document.querySelectorAll('button')).filter(button => button.textContent === '${date.remainingDays}').length"), 1, "Only the date rule offers remaining days, not the default template")
    await fill("Comparison", "less-than")
    await fill("Additional offset (days)", "-15")
    await fill("Default generated text", "Requirement met.")
    await fill("Use this text when matched", "Days still needed: ")
    await clickText("${date.remainingDays}")
    assert.equal(await fieldValue("Use this text when matched"), "Days still needed: ${date.remainingDays}")
    await fill("Use this text when matched", "Days still needed: ${date.remainingDays}.")
    await saveAndUse()
    await fill("Move in date", "07/25/2022")
    for (const [date, expected] of [["07/09/2023", "Days still needed: 1."], ["07/01/2023", "Days still needed: 9."], ["07/10/2023", "Requirement met."]]) {
        await fill("Move out date", date)
        await clickText("Generate")
        assert.equal(await result(), expected, date)
    }
    await editRule()
    assert.equal(await fieldValue("Use this text when matched"), "Days still needed: ${date.remainingDays}.")
    await fill("Comparison", "at-least")
    await saveAndUse()
    await fill("Move in date", "07/25/2022")
    for (const date of ["07/10/2023", "07/11/2023"]) {
        await fill("Move out date", date)
        await clickText("Generate")
        assert.equal(await result(), "Days still needed: 0.")
    }
    await editRule()
    assert.equal(await evaluate("Array.from(document.querySelectorAll('button')).filter(button => button.textContent === '${date.remainingDaysBeforeAdjustment}').length"), 1)
    await fill("Use this text when matched", "Original shortfall: ")
    await clickText("${date.remainingDaysBeforeAdjustment}")
    assert.equal(await fieldValue("Use this text when matched"), "Original shortfall: ${date.remainingDaysBeforeAdjustment}")
    await fill("Use this text when matched", "Original shortfall: ${date.remainingDaysBeforeAdjustment}. Adjusted: ${date.remainingDays}.")
    await saveAndUse()
    await fill("Move in date", "10/10/2022")
    for (const [date, originalDays] of [["09/30/2023", 10], ["09/25/2023", 15], ["10/10/2023", 0], ["10/11/2023", 0]]) {
        await fill("Move out date", date)
        await clickText("Generate")
        assert.equal(await result(), `Original shortfall: ${originalDays}. Adjusted: 0.`)
    }
    await editRule()
    assert.equal(await fieldValue("Use this text when matched"), "Original shortfall: ${date.remainingDaysBeforeAdjustment}. Adjusted: ${date.remainingDays}.")
    await fill("Additional offset (days)", "-15")
    await fill("When variable", "months")
    assert.equal(await fieldValue("Additional offset (days)"), null, "Day adjustments only apply to date conditions")
    assert.equal(await evaluate("Array.from(document.querySelectorAll('button')).some(button => button.textContent === '${date.remainingDays}')"), false)
    assert.equal(await evaluate("Array.from(document.querySelectorAll('button')).some(button => button.textContent === '${date.remainingDaysBeforeAdjustment}')"), false)
    await fill("When variable", "move-out")
    assert.equal(await fieldValue("Additional offset (days)"), "", "Switching condition inputs clears the adjustment")
    await fill("Additional offset (days)", "-15")
    await fill("Condition source", "calculation")
    assert.equal(await fieldValue("Additional offset (days)"), null)
    await fill("Condition source", "variable")
    await fill("When variable", "move-out")
    assert.equal(await fieldValue("Additional offset (days)"), "")
    assert.deepEqual(browser.runtimeErrors, [])
    console.log("Date offset browser checks passed: whole-day validation, negative adjustment, exact cutoff, original and adjusted remaining-days insertion and generation, save/reopen, clearing, and condition-source changes.")
} finally {
    if (browser) {
        await browser.send("Page.navigate", { url: "about:blank" })
        await browser.send("Network.setBlockedURLs", { urls: [] })
        browser.close()
    }
    server.closeAllConnections()
    await new Promise(resolve => server.close(resolve))
}
