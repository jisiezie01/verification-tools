import assert from "node:assert/strict"
import test from "node:test"
import { importTypeScript } from "./import-typescript.mjs"
import { makeCatalog } from "./fixtures/tools.mjs"
const builder = await importTypeScript("src/screens/CreateTool/functions.ts")
const runtime = await importTypeScript("src/components/ToolRenderer/functions.ts")
function fixture() {
    const tool = makeCatalog().tools[0]
    const second = { ...builder.createElement("Output text", tool), id: "summary", generatedText: { default: "Summary: ${name_input}" } }
    tool.elements.push(second)
    const button = tool.elements.find(e => e.type === "Generate button")
    button.link = ["agreement-output", "summary"]
    return { tool, button, second }
}
test("multiple outputs generate together with their own templates and conditions", () => {
    const { tool, button } = fixture()
    const state = runtime.createRuntimeState(tool)
    state.values = { "agreement-name": "jane doe", "agreement-consent": "yes" }
    const generated = runtime.generateRuntimeState(tool, state, [...button.link, "summary"])
    assert.equal(generated.outputs["agreement-output"], "I, Jane Doe agree")
    assert.equal(generated.outputs.summary, "Summary: Jane Doe")
    assert.deepEqual(generated.visibleOutputIds, ["agreement-output", "summary"])
    assert.deepEqual(state.outputs, {})
    assert.deepEqual(runtime.resetRuntimeState().outputs, {})
    assert.deepEqual(runtime.generateRuntimeState(tool, state, "summary").visibleOutputIds, ["summary"])
})
test("invalid inputs, missing targets and missing shared variables never partially generate", () => {
    const { tool, button, second } = fixture()
    const state = runtime.createRuntimeState(tool)
    state.outputs.summary = "Previous snapshot"
    for (const targets of [[], ["summary", "missing"], ["summary", "agreement-name"]]) {
        const result = runtime.generateRuntimeState(tool, state, targets)
        assert.ok(result.message)
        assert.deepEqual(result.outputs, state.outputs)
    }
    state.values["agreement-email"] = "invalid"
    assert.deepEqual(runtime.generateRuntimeState(tool, state, button.link).outputs, state.outputs)
    state.values = {}
    second.generatedText.default = "${global.missing}"
    const result = runtime.generateRuntimeState(tool, state, button.link)
    assert.match(result.message, /shared variable/)
    assert.deepEqual(result.outputs, state.outputs)
})
test("renaming updates all multi-target and legacy links, preserves selection and rejects collisions", () => {
    const { tool, button } = fixture()
    tool.elements.push({ ...builder.createElement("Generate button", tool), id: "legacy", link: "agreement-output" })
    const output = tool.elements.find(e => e.id === "agreement-output")
    const state = { ...builder.createBuilderState(tool), selectedId: output.id }
    const updated = builder.builderReducer(state, { type: "change", previousId: output.id, element: { ...output, id: "letter" } })
    assert.equal(updated.selectedId, "letter")
    assert.deepEqual(updated.tool.elements.find(e => e.id === button.id).link, ["letter", "summary"])
    assert.equal(updated.tool.elements.find(e => e.id === "legacy").link, "letter")
    assert.equal(updated.tool.elements.find(e => e.type === "Copy button").link, "letter")
    assert.equal(updated.revision, 1)
    assert.deepEqual(builder.validateTool(updated.tool), [])
    const saved = JSON.parse(JSON.stringify(builder.createSavedTool(updated.tool)))
    assert.deepEqual(saved.elements.find(e => e.id === button.id).link, ["letter", "summary"])
    for (const id of ["", "bad id", "summary", "agreement-name"]) {
        assert.ok(builder.outputIdError(tool.elements, output.id, id))
        assert.equal(builder.builderReducer(state, { type: "change", previousId: output.id, element: { ...output, id } }), state)
    }
})
test("deleting one target keeps remaining links and deleting all targets requires a replacement", () => {
    const { tool, button } = fixture()
    tool.elements = builder.removeElement(tool.elements, "summary")
    assert.deepEqual(tool.elements.find(e => e.id === button.id).link, ["agreement-output"])
    assert.deepEqual(builder.validateTool(tool), [])
    tool.elements = builder.removeElement(tool.elements, "agreement-output")
    assert.deepEqual(tool.elements.find(e => e.id === button.id).link, [])
    assert.ok(builder.validateTool(tool).some(error => error.includes("linked generated text")))
})
