import { seedCatalog } from "./catalog-fixture.mjs"
import assert from "node:assert/strict"
import { test } from "node:test"
import { importTypeScript } from "./import-typescript.mjs"

const builder = await importTypeScript("src/screens/CreateTool/functions.ts")
const { PALETTE_ITEMS } = await importTypeScript("src/screens/CreateTool/data.ts")
const { insertTemplateVariable } = await importTypeScript("src/screens/CreateTool/components/InputTemplate/functions.ts")
const { validateCategoryName } = await importTypeScript("src/components/InputToolCategory/components/ContainerCategoryModal/functions.ts")
const { resizeElement } = await importTypeScript("src/screens/CreateTool/components/ButtonResizeElement/functions.ts")

function tool() { return { id: "tool-1", categoryId: "category-1", name: "Reference", elements: [] } }
function add(state, type, containerId) {
    const element = builder.createElement(type, state, containerId)
    state.elements.push(element)
    return element
}

test("all palette elements have independent defaults, IDs, and unique input variables", () => {
    const state = tool()
    for (const item of PALETTE_ITEMS) add(state, item.type)
    assert.equal(state.elements.length, 13)
    assert.equal(new Set(state.elements.map(element => element.id)).size, 13)
    const text = state.elements.find(element => element.type === "Text input")
    assert.equal(text.textCase, "pascal")
    assert.equal(text.copyButton.enabled, true)
    assert.equal(add(state, "Text input").variableName, "text_input_2")
    assert.equal(state.elements.find(element => element.type === "Number input").min, undefined)
    assert.equal(state.elements.find(element => element.type === "Phone input").maxDigits, 10)
    assert.equal(state.elements.find(element => element.type === "Date input").min.mode, "none")
    assert.equal(state.elements.find(element => element.type === "Radio button").options.length, 1)
    assert.equal(state.elements.find(element => element.type === "Output text").generatedText.default, "Lorem ipsum dolor sit amet.")
})

test("generated buttons auto-link in either insertion order and copy visibility follows its target", () => {
    let state = builder.createBuilderState(tool())
    state = builder.builderReducer(state, { type: "drop", item: { source: "palette", elementType: "Generate button" } })
    state = builder.builderReducer(state, { type: "drop", item: { source: "palette", elementType: "Output text" } })
    assert.equal(state.tool.elements[0].link, state.tool.elements[1].id)
    assert.equal(builder.createElement("Generate button", state.tool).link, state.tool.elements[1].id)
    assert.equal(builder.createElement("Copy button", state.tool).visibility, "when-target-visible")
    const inputTool = tool()
    const input = add(inputTool, "Text input")
    const copy = add(inputTool, "Copy button")
    assert.equal(copy.link, input.id)
    assert.equal(copy.visibility, "always")
})

test("moving a container preserves children, supports reparenting, and rejects cycles", () => {
    const state = tool()
    const outer = add(state, "Container")
    const inner = add(state, "Container", outer.id)
    const child = add(state, "Text input", inner.id)
    const sibling = add(state, "Text")
    assert.equal(builder.canMoveElement(state.elements, outer.id, inner.id), false)
    assert.deepEqual(builder.moveElement(state.elements, outer.id, inner.id), state.elements)
    const moved = builder.moveElement(state.elements, inner.id, undefined, sibling.id)
    assert.equal(moved.find(element => element.id === inner.id).containerId, undefined)
    assert.equal(moved.find(element => element.id === child.id).containerId, inner.id)
    assert.deepEqual(moved.filter(element => !element.containerId).map(element => element.id), [outer.id, inner.id, sibling.id])
    const reordered = builder.moveElement(moved, sibling.id, undefined, outer.id)
    assert.deepEqual(reordered.filter(element => !element.containerId).map(element => element.id), [sibling.id, outer.id, inner.id])
})

test("deleting a subtree clears links and invalidates affected conditions and variables", () => {
    const state = tool()
    const container = add(state, "Container")
    const number = add(state, "Number input", container.id)
    const output = add(state, "Output text", container.id)
    const generate = add(state, "Generate button")
    const surviving = add(state, "Output text")
    surviving.generatedText.default = "${number_input}"
    surviving.conditions = [{ id: "rule", inputId: number.id, operator: "equals", value: "1", text: "One" }]
    state.elements = builder.removeElement(state.elements, container.id)
    assert.equal(state.elements.some(element => element.id === output.id), false)
    assert.equal(state.elements.find(element => element.id === generate.id).link, "")
    assert.equal(state.elements.find(element => element.id === surviving.id).conditions[0].inputId, "")
    assert.ok(builder.validateTool(state).some(message => message.includes("unknown variable")))
    assert.ok(builder.validateTool(state).some(message => message.includes("choose a number, date, or radio")))
})

test("renaming variables updates default and conditional templates without changing literal text", () => {
    const state = tool()
    const name = add(state, "Text input")
    const output = add(state, "Output text")
    output.generatedText.default = "${text_input}, text_input"
    output.conditions = [{ id: "r", inputId: "radio", operator: "equals", value: "yes", text: "I, ${text_input} agree" }]
    const updated = builder.updateElement(state.elements, { ...name, variableName: "name_input" }).find(element => element.id === output.id)
    assert.equal(updated.generatedText.default, "${name_input}, text_input")
    assert.equal(updated.conditions[0].text, "I, ${name_input} agree")
    assert.deepEqual(insertTemplateVariable("Hello world!", "name_input", 6, 11), { text: "Hello ${name_input}!", caret: 19 })
})

test("save validation rejects invalid category, duplicate variables, links, dates, numbers, radio values and conditions", () => {
    const state = tool()
    const number = add(state, "Number input")
    number.min = 5; number.max = 1
    const second = add(state, "Text input"); second.variableName = number.variableName
    const date = add(state, "Date input")
    date.min = { mode: "fixed", value: "2030-01-01" }; date.max = { mode: "fixed", value: "2020-01-01" }
    const radio = add(state, "Radio button"); radio.options = []
    add(state, "Generate button")
    const output = add(state, "Output text")
    output.conditions = [{ id: "r", inputId: number.id, operator: "equals", value: "oops", text: "" }]
    const errors = builder.validateTool(state, [])
    for (const fragment of ["category", "unique", "minimum", "earliest", "option", "linked", "number to compare"]) assert.ok(errors.some(error => error.includes(fragment)), fragment)
    assert.throws(() => builder.createSavedTool(state))
})

test("save returns an independent ToolType in tree order and updates an existing JSON record", async () => {
    const storage = await seedCatalog({ categories: [{ id: "category-1", name: "References" }], tools: [] })
    const state = tool()
    const container = add(state, "Container")
    const text = add(state, "Text")
    const input = add(state, "Email input", container.id)
    state.name = "  Saved tool  "
    const saved = await builder.saveTool(state)
    assert.equal(saved.name, "Saved tool")
    assert.deepEqual(saved.elements.map(element => element.id), [container.id, input.id, text.id])
    assert.ok(saved.elements.every(element => element.toolId === state.id && element.categoryId === state.categoryId))
    saved.elements[0].padding = 99
    assert.equal(container.padding, 0)
    state.name = "Renamed"
    await builder.saveTool(state)
    const records = storage.data.tools
    assert.equal(records.length, 1)
    assert.equal(records[0].name, "Renamed")
})

test("resizing respects percentage widths and parent bounds; category names are trimmed and unique", () => {
    const element = builder.createElement("Text input", tool())
    const resized = resizeElement(element, { x: 0, y: 0, width: 200, height: 50, parentWidth: 400 }, 1000, 20)
    assert.deepEqual(resized.size.width, { unit: "%", value: 100 })
    assert.deepEqual(resized.size.height, { unit: "px", value: 70 })
    assert.ok(validateCategoryName("  ", []))
    assert.ok(validateCategoryName(" formatters ", [{ id: "x", name: "Formatters" }]))
    assert.equal(validateCategoryName("New", []), "")
})

test("serialization rejects impossible dates, nonfinite limits, and missing or cyclic containers", () => {
    const state = tool()
    const date = add(state, "Date input")
    date.min = { mode: "fixed", value: "2026-02-30" }
    const number = add(state, "Number input"); number.max = Infinity
    const orphan = add(state, "Text", "")
    const first = add(state, "Container")
    const second = add(state, "Container", first.id)
    first.containerId = second.id
    const errors = builder.validateTool(state)
    assert.ok(errors.some(error => error.includes("valid fixed date")))
    assert.ok(errors.some(error => error.includes("finite")))
    assert.ok(errors.some(error => error.includes("invalid container")))
    assert.throws(() => builder.createSavedTool(state))
    assert.equal(builder.isCalendarDate("2028-02-29"), true)
    assert.equal(builder.isCalendarDate("2026-02-29"), false)
    assert.equal(builder.canMoveElement(state.elements, orphan.id, "missing-container"), false)
})

test("comparison variables must match types and date offsets must be whole days", () => {
    const state = tool()
    const first = add(state, "Date input")
    const second = add(state, "Date input")
    const number = add(state, "Number input")
    const output = add(state, "Output text")
    const rule = { id: "comparison", inputId: first.id, comparisonInputId: second.id, value: "", offset: 60, operator: "equals", text: "Match" }
    output.conditions = [rule]
    assert.ok(!builder.validateTool(state).some(error => error.includes("rule 1")))
    rule.comparisonInputId = number.id
    assert.ok(builder.validateTool(state).some(error => error.includes("same type")))
    rule.comparisonInputId = second.id
    rule.offset = 0.5
    assert.ok(builder.validateTool(state).some(error => error.includes("whole days")))
})
