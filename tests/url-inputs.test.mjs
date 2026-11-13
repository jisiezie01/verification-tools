import assert from "node:assert/strict"
import test from "node:test"
import { importTypeScript } from "./import-typescript.mjs"
import { makeCatalog } from "./fixtures/tools.mjs"

const { urlInputValues, updateUrlInputs, withCategory } = await importTypeScript("src/data/toolUrlInputs/functions.ts")
const { createSavedTool, validateTool } = await importTypeScript("src/screens/CreateTool/functions.ts")
const { createRuntimeState } = await importTypeScript("src/components/ToolRenderer/functions.ts")

test("sharing is opt-in and saved settings use variable names rather than generated IDs", () => {
    const tool = makeCatalog().tools[0]
    const input = tool.elements[0]
    const params = new URLSearchParams("name_input=John%20Doe&category=references")
    assert.deepEqual(urlInputValues(tool, params), {})
    assert.equal(updateUrlInputs(params, [input], { [input.id]: "Other" }).get("name_input"), "John Doe")
    input.syncWithUrl = true
    const saved = JSON.parse(JSON.stringify(createSavedTool(tool)))
    assert.equal(saved.elements[0].syncWithUrl, true)
    assert.deepEqual(urlInputValues(saved, params), { [input.id]: "John Doe" })
    const other = { ...saved, elements: [{ ...input, id: "another-id" }] }
    assert.deepEqual(urlInputValues(other, params), { "another-id": "John Doe" })
})

test("URL edits preserve unrelated parameters and encode entered text literally", () => {
    const input = { ...makeCatalog().tools[0].elements[0], syncWithUrl: true }
    const original = new URLSearchParams("category=references&unrelated=keep")
    const value = "John Doe + José & = ? # % / ${name}"
    const updated = updateUrlInputs(original, [input], { [input.id]: value })
    assert.equal(new URLSearchParams(updated.toString()).get("name_input"), value)
    assert.equal(updated.get("unrelated"), "keep")
    assert.equal(original.has("name_input"), false)
    const navigated = withCategory(updated, "formatters")
    assert.equal(navigated.get("name_input"), value)
    assert.equal(navigated.get("category"), "formatters")
    assert.equal(updateUrlInputs(navigated, [input]).has("name_input"), false)
    assert.equal(updateUrlInputs(navigated, [input]).get("unrelated"), "keep")
})

test("empty and zero values override defaults; reset restores defaults and retains other shared values", () => {
    const input = { ...makeCatalog().tools[0].elements.find(element => element.type === "Number input"), syncWithUrl: true, defaultValue: 18 }
    const tool = { elements: [input] }
    let params = new URLSearchParams("name_input=John")
    assert.equal(urlInputValues(tool, params)[input.id], "18")
    for (const value of ["", "0", '["10","20",""]']) {
        params = updateUrlInputs(params, [input], { [input.id]: value })
        assert.equal(urlInputValues(tool, params)[input.id], value)
    }
    params = updateUrlInputs(params, [input])
    assert.equal(urlInputValues(tool, params)[input.id], "18")
    assert.equal(params.get("name_input"), "John")
})

test("navigation parameter names cannot be enabled for sharing", () => {
    for (const variableName of ["category", "categoryId", "toolId"]) {
        const tool = makeCatalog().tools[1]
        Object.assign(tool.elements[0], { variableName, syncWithUrl: true })
        assert.ok(validateTool(tool).some(error => error.includes("reserved for navigation")))
        const params = new URLSearchParams(`${variableName}=original`)
        assert.deepEqual(urlInputValues(tool, params), {})
        assert.equal(updateUrlInputs(params, tool.elements).get(variableName), "original")
    }
})

test("initial visible output renders restored URL values", () => {
    const tool = makeCatalog().tools[0]
    tool.elements[0].syncWithUrl = true
    const output = tool.elements.find(element => element.type === "Output text")
    Object.assign(output, { initiallyHidden: false, conditions: [], generatedText: { default: "Hello ${name_input}" } })
    const values = urlInputValues(tool, new URLSearchParams("name_input=John%20Doe"))
    assert.equal(createRuntimeState(tool, undefined, values).outputs[output.id], "Hello John Doe")
})
