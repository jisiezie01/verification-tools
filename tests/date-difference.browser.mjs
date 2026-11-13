import assert from "node:assert/strict"
import { catalogFixture } from "./catalog-browser-fixture.mjs"
import { connectBrowser } from "./browser-client.mjs"
import { makeDateOffsetCatalog } from "./fixtures/date-offsets.mjs"

const fixture = await catalogFixture()
const browser = await connectBrowser()
const { navigate, click, clickText, fill, evaluate } = browser
const origin = process.env.TEST_ORIGIN ?? "http://127.0.0.1:5173"
try {
    const catalog = makeDateOffsetCatalog()
    const tool = catalog.tools[0]
    Object.assign(tool.elements.find(element => element.id === "move-in"), { variableName: "start_date", label: "Start date" })
    Object.assign(tool.elements.find(element => element.id === "move-out"), { variableName: "end_date", label: "End date" })
    const output = tool.elements.find(element => element.id === "result")
    output.conditions = []
    output.generatedText.default = "Enter a template"
    await fixture.seed(catalog)
    await navigate(`${origin}/create-tool?toolId=${tool.id}`)
    await click('[data-builder-element="result"]')
    const template = 'Days: ${date.diff(start_date, end_date, "days")}; weeks: ${date.diff(start_date, end_date, "weeks")}; months: ${date.diff(start_date, end_date, "months")}; years: ${date.diff(start_date, end_date, "years")}.'
    await fill("Default generated text", template)
    await clickText("Save tool")
    assert.equal((await fixture.read()).tools[0].elements.find(element => element.id === "result").generatedText.default, template)
    await click('[data-builder-element="move-in"]')
    await fill("Variable name", "arrival_date")
    await clickText("Save tool")
    assert.ok((await fixture.read()).tools[0].elements.find(element => element.id === "result").generatedText.default.includes("date.diff(arrival_date,"))
    await navigate(`${origin}/tools/${tool.id}`)
    await fill("Start date", "01/01/2023")
    await fill("End date", "01/01/2024")
    await clickText("Generate")
    const expected = `Days: 365; weeks: ${365 / 7}; months: 12; years: 1.`
    assert.equal(await evaluate("document.querySelector('[data-runtime-element=result]').textContent"), expected)
    await fill("End date", "")
    await clickText("Generate")
    assert.equal(await evaluate("document.querySelector('[data-runtime-element=result]').textContent"), expected)
    assert.ok(await evaluate("document.body.textContent.includes('Please enter End date')"))
    assert.deepEqual(browser.runtimeErrors, [])
    console.log("Date difference browser checks passed")
} finally {
    await fixture.restore()
    browser.close()
}
