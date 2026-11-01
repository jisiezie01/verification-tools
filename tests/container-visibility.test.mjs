import assert from "node:assert/strict"
import test from "node:test"
import { importTypeScript } from "./import-typescript.mjs"

const builder = await importTypeScript("src/screens/CreateTool/functions.ts")
const runtime = await importTypeScript("src/components/ToolRenderer/functions.ts")
function fixture() {
    const tool = { id: "visibility", categoryId: "category", name: "Conditional container", elements: [] }
    const add = (type, id, changes = {}) => {
        const element = { ...builder.createElement(type, tool), id, ...changes }
        tool.elements.push(element)
        return element
    }
    const radio = add("Radio button", "radio", { options: [{ id: "yes", label: "Yes", value: "yes" }, { id: "no", label: "No", value: "no" }] })
    const container = add("Container", "container", { visibility: { mode: "show", inputId: radio.id, value: "yes" } })
    const nested = add("Container", "nested", { containerId: container.id })
    const input = add("Email input", "email", { containerId: nested.id })
    const output = add("Output text", "output")
    const copy = add("Copy button", "copy", { link: input.id, visibility: "when-target-visible" })
    return { tool, radio, container, nested, input, output, copy }
}
test("radio option controls the complete subtree, copy visibility, and reset", () => {
    const { tool, container, nested, input, copy } = fixture()
    const state = runtime.createRuntimeState(tool)
    for (const element of [container, nested, input, copy]) assert.equal(runtime.canShowElement(element, state, tool), false)
    state.values.radio = "yes"
    state.values.email = "saved@example.com"
    for (const element of [container, nested, input, copy]) assert.equal(runtime.canShowElement(element, state, tool), true)
    state.values.radio = "no"
    assert.equal(runtime.canShowElement(input, state, tool), false)
    assert.equal(state.values.email, "saved@example.com")
    container.visibility.mode = "hide"
    assert.equal(runtime.canShowElement(container, state, tool), true)
    state.values.radio = "yes"
    assert.equal(runtime.canShowElement(container, state, tool), false)
    assert.equal(runtime.canShowElement(container, runtime.resetRuntimeState(), tool), true)
    delete container.visibility
    assert.equal(runtime.canShowElement(container, runtime.resetRuntimeState(), tool), true)
})
test("hidden input errors do not block generation and are validated when shown again", () => {
    const { tool, output } = fixture()
    const state = runtime.createRuntimeState(tool)
    state.values.email = "invalid"
    assert.equal(runtime.generateRuntimeState(tool, state, output.id).message, "")
    state.values.radio = "yes"
    assert.ok(runtime.generateRuntimeState(tool, state, output.id).errors.email)
})
test("visibility survives serialization and rejects missing, removed, or descendant radio dependencies", () => {
    const { tool, radio, container, nested } = fixture()
    assert.deepEqual(builder.validateTool(tool), [])
    assert.deepEqual(JSON.parse(JSON.stringify(builder.createSavedTool(tool))).elements.find(e => e.id === container.id).visibility, container.visibility)
    radio.containerId = nested.id
    assert.ok(builder.validateTool(tool).some(error => error.includes("outside this container")))
    delete radio.containerId
    radio.options = radio.options.filter(option => option.value !== "yes")
    assert.ok(builder.validateTool(tool).some(error => error.includes("valid radio option")))
    assert.equal(runtime.canShowElement(container, runtime.createRuntimeState(tool), tool), false)
    tool.elements = builder.removeElement(tool.elements, radio.id)
    assert.equal(tool.elements.find(e => e.id === container.id).visibility.inputId, "")
    assert.ok(builder.validateTool(tool).some(error => error.includes("radio group for visibility")))
})


test("radio-controlled output reveals current text, follows selection and parent visibility, and resets", () => {
    const { tool, output, copy, container } = fixture()
    output.visibility = { mode: "show", inputId: "radio", value: "yes" }
    output.generatedText.default = "Selected: ${radio_group}"
    copy.link = output.id
    let state = runtime.createRuntimeState(tool)
    assert.equal(runtime.canShowElement(output, state, tool), false)
    state.values.radio = "yes"
    state = runtime.resolveRadioOutputs(tool, state)
    assert.equal(runtime.canShowElement(output, state, tool), true)
    assert.equal(runtime.getCopyValue(output.id, tool, state), "Selected: yes")
    assert.equal(runtime.canShowElement(copy, state, tool), true)
    state.values.radio = "no"
    assert.equal(runtime.canShowElement(output, state, tool), false)
    assert.equal(runtime.canShowElement(copy, state, tool), false)
    assert.equal(runtime.canShowElement(output, runtime.resetRuntimeState(), tool), false)
    state.values.radio = "yes"
    output.containerId = container.id
    container.visibility.value = "no"
    assert.equal(runtime.canShowElement(output, state, tool), false)
})

test("output visibility persists and validates deleted radios and options", () => {
    const { tool, output, radio } = fixture()
    output.visibility = { mode: "show", inputId: radio.id, value: "yes" }
    assert.deepEqual(builder.validateTool(tool), [])
    assert.deepEqual(builder.createSavedTool(tool).elements.find(e => e.id === output.id).visibility, output.visibility)
    output.visibility.value = "missing"
    assert.ok(builder.validateTool(tool).some(error => error.includes("valid radio option")))
    tool.elements = builder.removeElement(tool.elements, radio.id)
    assert.equal(tool.elements.find(e => e.id === output.id).visibility.inputId, "")
    assert.ok(builder.validateTool(tool).some(error => error.includes("radio group for visibility")))
})
