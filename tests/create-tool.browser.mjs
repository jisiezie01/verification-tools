import { catalogFixture } from "./catalog-browser-fixture.mjs"
import assert from "node:assert/strict"
import { mkdir, writeFile } from "node:fs/promises"

// Run against an isolated Chromium profile with remote debugging on port 9223.
// The app must already be running on port 5173. No browser library is required.
const targets = await (await fetch("http://127.0.0.1:9223/json/list")).json()
const target = targets.find(item => item.type === "page")
assert.ok(target, "Start a Chromium page with --remote-debugging-port=9223")
const socket = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once: true }); socket.addEventListener("error", reject, { once: true }) })
let sequence = 0
const pending = new Map()
const runtimeErrors = []
socket.addEventListener("message", event => {
    const message = JSON.parse(event.data)
    if (message.method === "Runtime.exceptionThrown") runtimeErrors.push(message.params.exceptionDetails.exception?.description ?? message.params.exceptionDetails.text)
    if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") runtimeErrors.push(message.params.args.map(arg => arg.value ?? arg.description).join(" "))
    if (message.id && pending.has(message.id)) {
        const { resolve, reject, timeout } = pending.get(message.id)
        clearTimeout(timeout); pending.delete(message.id)
        if (message.error) reject(new Error(JSON.stringify(message.error)))
        else resolve(message.result)
    }
})
function send(method, params = {}) {
    return new Promise((resolve, reject) => {
        const id = ++sequence
        const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`Timed out: ${method}`)) }, 15000)
        pending.set(id, { resolve, reject, timeout })
        socket.send(JSON.stringify({ id, method, params }))
    })
}
async function evaluate(expression) {
    if (expression.includes("await fetch")) expression = `(async () => (${expression}))()`
    const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text)
    return result.result.value
}
async function waitFor(expression) {
    const end = Date.now() + 10000
    while (Date.now() < end) {
        if (await evaluate(expression)) return
        await new Promise(resolve => setTimeout(resolve, 50))
    }
    throw new Error(`Condition failed: ${expression}`)
}
async function settle() { await evaluate("new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))") }
async function navigate(method, params = {}) {
    const loaded = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => { socket.removeEventListener("message", listener); reject(new Error("Page did not load")) }, 15000)
        function listener(event) {
            if (JSON.parse(event.data).method === "Page.loadEventFired") {
                clearTimeout(timeout); socket.removeEventListener("message", listener); resolve()
            }
        }
        socket.addEventListener("message", listener)
    })
    await send(method, params)
    await loaded
}
async function click(selector) { await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`); await settle() }
async function clickText(text, scope = "document") {
    await evaluate(`Array.from(${scope}.querySelectorAll('button')).find(button => button.textContent.trim() === ${JSON.stringify(text)}).click()`)
    await settle()
}
async function fill(label, value, occurrence = 0) {
    await evaluate(`(() => {
        const label = Array.from(document.querySelectorAll('label')).filter(item => item.textContent.trim() === ${JSON.stringify(label)})[${occurrence}];
        if (!label) throw new Error('Missing field: ' + ${JSON.stringify(label)});
        const input = document.getElementById(label.htmlFor);
        const prototype = input.tagName === 'SELECT' ? HTMLSelectElement.prototype : input.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        Object.getOwnPropertyDescriptor(prototype, 'value').set.call(input, ${JSON.stringify(String(value))});
        input.dispatchEvent(new Event(input.tagName === 'SELECT' ? 'change' : 'input', {bubbles:true}));
    })()`)
    await settle()
}
async function add(label) { await click(`[aria-label="Add ${label}"]`) }
async function saved() { return evaluate("(await (await fetch('/__catalog')).json()).tools[0]") }
async function dragStart(selector) {
    await evaluate(`(() => { window.testTransfer = new DataTransfer(); document.querySelector(${JSON.stringify(selector)}).dispatchEvent(new DragEvent('dragstart', {bubbles:true,cancelable:true,dataTransfer:window.testTransfer})); })()`)
    await settle()
}
async function dragEnd(source, destination) {
    await evaluate(`(() => {
        const destination = document.querySelector(${JSON.stringify(destination)});
        for (const type of ['dragenter','dragover','drop']) destination.dispatchEvent(new DragEvent(type,{bubbles:true,cancelable:true,dataTransfer:window.testTransfer}));
        document.querySelector(${JSON.stringify(source)})?.dispatchEvent(new DragEvent('dragend',{bubbles:true,dataTransfer:window.testTransfer}));
    })()`)
    await settle()
}

const catalogFile = await catalogFixture()

try {
    await send("Runtime.enable")
    await send("Page.enable")
    await send("Emulation.setDeviceMetricsOverride", { width: 1536, height: 1050, deviceScaleFactor: 1, mobile: false })
    await navigate("Page.navigate", { url: "http://127.0.0.1:5173/create-tool" })
    await waitFor("!!document.querySelector('[aria-label=\"Tool selection\"]')")
    await catalogFile.seed({ categories: [], tools: [] })
    await navigate("Page.reload")
    await waitFor("!!document.querySelector('[aria-label=\"Tool selection\"]')")
    assert.equal(await evaluate("document.querySelectorAll('[aria-label^=\"Add \"]').length"), 13)
    assert.equal(await evaluate("document.querySelectorAll('[aria-label=\"Builder section\"], [aria-label=\"Element selection\"]').length"), 2)
    await clickText("Save tool")
    assert.ok((await evaluate("document.body.textContent")).includes("Give your tool a name."))
    await fill("Tool name", "Reference builder")
    await clickText("Create category")
    await waitFor("!!document.querySelector('dialog[open]')")
    await fill("Category name", "References")
    await clickText("Create category", "document.querySelector('dialog')")
    assert.equal(await evaluate("document.querySelectorAll('dialog[open]').length"), 0)
    await clickText("Create category")
    await fill("Category name", " references ")
    await clickText("Create category", "document.querySelector('dialog')")
    assert.ok((await evaluate("document.querySelector('dialog').textContent")).includes("already exists"))
    await clickText("Cancel", "document.querySelector('dialog')")

    await add("text input")
    await fill("Variable name", "name_input")
    await fill("Label", "Full name")
    await add("radio button group")
    await fill("Variable name", "consent")
    await fill("Label", "Do you agree?")
    await fill("Option 1 label", "Yes")
    await fill("Option 1 value", "yes")
    await clickText("Add radio option")
    await fill("Option 2 label", "No")
    await fill("Option 2 value", "no")
    await add("generated text")
    await fill("Default generated text", "I disagree")
    await clickText("Add condition")
    await fill("Use this text when matched", "I, ${name_input} agree")
    await add("generate button")
    await add("copy button")
    await add("reset button")
    await add("number input")
    await fill("Minimum number", "0")
    await fill("Maximum number", "100")
    await add("email input")
    await add("phone input")
    await add("date input")
    await fill("Latest date", "today")
    const numberId = await evaluate("document.querySelector('[data-element-type=\"Number input\"]').dataset.builderElement")
    const dateId = await evaluate("document.querySelector('[data-element-type=\"Date input\"]').dataset.builderElement")
    await click('[data-element-type="Output text"]')
    await clickText("Add condition")
    await fill("When variable", numberId, 1)
    await fill("Comparison", "at-least", 1)
    await fill("Comparison number", "18")
    await fill("Use this text when matched", "Adult: ${name_input}", 1)
    await clickText("Add condition")
    await fill("When variable", dateId, 2)
    await fill("Comparison", "less-than", 2)
    await evaluate("Array.from(document.querySelectorAll('label')).find(label => label.textContent.trim() === 'Compare with current date').click()")
    await settle()
    await fill("Use this text when matched", "Earlier date: ${date_input}", 2)
    await add("divider")
    await fill("Orientation", "vertical")
    await add("text")
    await fill("Text content", "Consent form")
    await fill("Font size (px)", "24")
    await add("container")
    const containerId = await evaluate("document.querySelector('[data-element-type=\"Container\"]').dataset.builderElement")
    await fill("Flex direction", "row")
    await fill("Gap (px)", "12")
    await dragStart('[aria-label="Add text"]')
    assert.equal(await evaluate("!!document.querySelector('[aria-label=\"Drop to delete element\"]')"), false)
    await dragEnd('[aria-label="Add text"]', `[data-builder-drop="${containerId}"]`)
    assert.equal(await evaluate(`document.querySelector('[data-builder-drop="${containerId}"]').querySelectorAll('[data-builder-element]').length`), 1)
    await clickText("Save tool")
    await waitFor("(await (await fetch('/__catalog')).json()).tools.length > 0")
    let output = await saved()
    assert.equal(output.name, "Reference builder")
    assert.equal(output.elements.length, 14)
    assert.ok(output.elements.every(element => element.categoryId === output.categoryId && element.toolId === output.id))
    const generated = output.elements.find(element => element.type === "Output text")
    assert.equal(generated.generatedText.default, "I disagree")
    assert.equal(generated.conditions[0].text, "I, ${name_input} agree")
    assert.equal(generated.conditions[0].value, "yes")
    assert.deepEqual(generated.conditions.map(rule => [rule.operator, rule.value]), [["equals", "yes"], ["at-least", "18"], ["less-than", "today"]])
    assert.equal(output.elements.find(element => element.type === "Copy button").visibility, "when-target-visible")
    assert.equal(output.elements.find(element => element.type === "Date input").max.mode, "today")
    const nested = output.elements.find(element => element.containerId === containerId)
    const nestedSource = `[data-builder-element="${nested.id}"] [aria-label="Drag text"]`
    await dragStart(nestedSource)
    assert.equal(await evaluate("!!document.querySelector('[aria-label=\"Drop to delete element\"]')"), true)
    const nameId = output.elements.find(element => element.type === "Text input").id
    await dragEnd(nestedSource, `[data-builder-element="${nameId}"]`)
    await clickText("Save tool")
    output = await saved()
    assert.equal(output.elements[0].id, nested.id)
    assert.equal(output.elements[0].containerId, undefined)
    await dragStart(nestedSource)
    await dragEnd(nestedSource, '[aria-label="Drop to delete element"]')
    assert.equal(await evaluate(`!!document.querySelector('[data-builder-element="${nested.id}"]')`), false)
    assert.equal(await evaluate("!!document.querySelector('[aria-label=\"Drop to delete element\"]')"), false)

    await click(`[data-builder-element="${nameId}"]`)
    const resize = await evaluate("(() => { const node = document.querySelector('[aria-label=\"Resize element\"]'); node.scrollIntoView({block:'center'}); const rect = node.getBoundingClientRect(); return {x:rect.x + rect.width / 2,y:rect.y + rect.height / 2}; })()")
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", ...resize })
    await send("Input.dispatchMouseEvent", { type: "mousePressed", ...resize, button: "left", clickCount: 1 })
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: resize.x - 80, y: resize.y + 30, button: "left", buttons: 1 })
    await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: resize.x - 80, y: resize.y + 30, button: "left", clickCount: 1 })
    await settle()
    await clickText("Save tool")
    output = await saved()
    const resized = output.elements.find(element => element.id === nameId)
    assert.equal(resized.size.height.unit, "px")
    assert.ok(resized.size.width.value < 100)
    await click('[aria-label="Builder section"]')
    assert.ok((await evaluate("document.querySelector('[aria-label=\"Element selection\"]').textContent")).includes("Make it yours"))

    await mkdir(".artifacts", { recursive: true })
    await evaluate("document.querySelector('[aria-label=\"Builder section\"]').scrollTop = 0")
    const screenshot = await send("Page.captureScreenshot", { format: "png" })
    await writeFile(".artifacts/create-tool-desktop.png", Buffer.from(screenshot.data, "base64"))
    await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: false })
    await settle()
    assert.equal(await evaluate("document.documentElement.scrollWidth > window.innerWidth"), false, "Mobile layout should not overflow horizontally")
    const mobile = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true })
    await writeFile(".artifacts/create-tool-mobile.png", Buffer.from(mobile.data, "base64"))
    assert.deepEqual(runtimeErrors, [])
    console.log("Browser checks passed: all 13 elements, category modal, templates and conditions, save output, nested drops, reorder, drag-to-delete, pointer resize, selection, responsive layout, and no runtime errors.")
} finally { socket.close(); await catalogFile.restore() }
