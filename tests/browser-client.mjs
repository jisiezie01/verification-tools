import assert from "node:assert/strict"
import { mkdir, writeFile } from "node:fs/promises"

export async function connectBrowser() {
    const targets = await (await fetch("http://127.0.0.1:9223/json/list")).json()
    const target = targets.find(item => item.type === "page")
    assert.ok(target, "Start an isolated Chromium profile with --remote-debugging-port=9223")
    const socket = new WebSocket(target.webSocketDebuggerUrl)
    await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once: true }); socket.addEventListener("error", reject, { once: true }) })
    let sequence = 0
    let acceptUnload = true
    const pending = new Map()
    const runtimeErrors = []
    const dialogs = []
    socket.addEventListener("message", event => {
        const message = JSON.parse(event.data)
        if (message.method === "Runtime.exceptionThrown") runtimeErrors.push(message.params.exceptionDetails.exception?.description ?? message.params.exceptionDetails.text)
        if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") runtimeErrors.push(message.params.args.map(arg => arg.value ?? arg.description).join(" "))
        if (message.method === "Page.javascriptDialogOpening") {
            dialogs.push(message.params)
            void send("Page.handleJavaScriptDialog", { accept: message.params.type === "beforeunload" ? acceptUnload : true }).catch(error => runtimeErrors.push(error.message))
        }
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
            pending.set(id, { resolve, reject, timeout }); socket.send(JSON.stringify({ id, method, params }))
        })
    }
    async function evaluate(expression) {
    if (expression.includes("await fetch")) expression = `(async () => (${expression}))()`
        const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true, userGesture: true })
        if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text)
        return result.result.value
    }
    async function waitFor(expression) {
        const end = Date.now() + 10000
        while (Date.now() < end) { if (await evaluate(expression)) return; await new Promise(resolve => setTimeout(resolve, 50)) }
        throw new Error(`Condition failed: ${expression}`)
    }
    async function settle() { await evaluate("new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))") }
    async function navigate(url) {
        const loaded = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => { socket.removeEventListener("message", listener); reject(new Error("Page did not load")) }, 15000)
            function listener(event) { if (JSON.parse(event.data).method === "Page.loadEventFired") { clearTimeout(timeout); socket.removeEventListener("message", listener); resolve() } }
            socket.addEventListener("message", listener)
        })
        await send(url ? "Page.navigate" : "Page.reload", url ? { url } : {})
        await loaded
        await waitFor("!!document.querySelector('main') && !document.body.textContent.includes('Loading tools')")
        await settle()
    }
    async function click(selector) { await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`); await settle() }
    async function clickText(text, scope = "document") {
        await evaluate(`(() => { const button = Array.from(${scope}.querySelectorAll('button')).find(button => button.textContent.trim() === ${JSON.stringify(text)}); if (!button) throw new Error('Missing button: ' + ${JSON.stringify(text)}); button.click(); })()`); await settle()
    }
    async function fill(labelText, value, occurrence = 0) {
        await evaluate(`(() => {
            const label = Array.from(document.querySelectorAll('label')).filter(item => item.textContent.trim() === ${JSON.stringify(labelText)})[${occurrence}];
            if (!label) throw new Error('Missing field: ' + ${JSON.stringify(labelText)});
            const input = document.getElementById(label.htmlFor);
            const prototype = input.tagName === 'SELECT' ? HTMLSelectElement.prototype : input.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
            Object.getOwnPropertyDescriptor(prototype, 'value').set.call(input, ${JSON.stringify(String(value))});
            input.dispatchEvent(new Event(input.tagName === 'SELECT' ? 'change' : 'input', {bubbles:true}));
        })()`); await settle()
    }
    async function drag(source, destination) {
        await evaluate(`(() => { window.testTransfer = new DataTransfer(); document.querySelector(${JSON.stringify(source)}).dispatchEvent(new DragEvent('dragstart', {bubbles:true,cancelable:true,dataTransfer:window.testTransfer})); })()`); await settle()
        await evaluate(`(() => { const destination = document.querySelector(${JSON.stringify(destination)}); for (const type of ['dragenter','dragover','drop']) destination.dispatchEvent(new DragEvent(type,{bubbles:true,cancelable:true,dataTransfer:window.testTransfer})); document.querySelector(${JSON.stringify(source)})?.dispatchEvent(new DragEvent('dragend',{bubbles:true,dataTransfer:window.testTransfer})); })()`); await settle()
    }
    async function screenshot(name) {
        await mkdir(".artifacts", { recursive: true })
        const result = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true })
        await writeFile(`.artifacts/${name}.png`, Buffer.from(result.data, "base64"))
    }
    await send("Runtime.enable"); await send("Page.enable")
    return { send, evaluate, waitFor, settle, navigate, click, clickText, fill, drag, screenshot, runtimeErrors, dialogs, setUnloadDecision: accept => { acceptUnload = accept }, close: () => socket.close() }
}
