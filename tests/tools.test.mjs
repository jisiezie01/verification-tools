import assert from "node:assert/strict"
import test from "node:test"
import { importTypeScript } from "./import-typescript.mjs"
import { makeCatalog } from "./fixtures/tools.mjs"

const { getToolsWorkspace } = await importTypeScript("src/screens/Tools/functions.ts")
const { getGlobalInputs, getSharedScope, sharedInputId } = await importTypeScript("src/data/toolVariables/functions.ts")
const { createElement, builderReducer, createBuilderState, createSavedTool, validateTool } = await importTypeScript("src/screens/CreateTool/functions.ts")
const { createRuntimeState, generateRuntimeState, generateOutput, resetRuntimeState } = await importTypeScript("src/components/ToolRenderer/functions.ts")

function sharedFixture() {
    const catalog = makeCatalog()
    const source = catalog.tools[0]
    source.isGlobal = true
    const consumer = { id: "consumer", name: "Shared agreement", categoryId: source.categoryId, elements: [] }
    const local = { ...createElement("Text input", consumer), id: "local-name", variableName: "name_input" }
    const output = { ...createElement("Output text", consumer), id: "shared-output", generatedText: { default: "${global.name_input} / ${name_input}" } }
    consumer.elements.push(local, output, { ...createElement("Generate button", consumer), link: output.id })
    catalog.tools.push(consumer)
    const values = { [source.id]: { "agreement-name": "jane doe", "agreement-email": "jane@example.com", "agreement-phone": "1234567890", "agreement-age": "29", "agreement-date": "2020-10-19", "agreement-consent": "yes" } }
    return { catalog, source, consumer, output, values }
}

test("missing shared variables report their source and block generation", () => {
    const { catalog, consumer, output, values } = sharedFixture()
    values.agreement["agreement-name"] = "   "
    const state = { ...createRuntimeState(consumer), values: { "local-name": "local" } }
    const result = generateRuntimeState(consumer, state, output.id, getSharedScope(consumer, catalog.tools, values))
    assert.match(result.message, /Agreement generator: Please enter Full name/)
    assert.deepEqual(result.outputs, {})
    assert.deepEqual(result.visibleOutputIds, [])
})

test("tools workspace honors saved layout, sizes and removals while excluding archives and foreign placements", () => {
    const { categories, tools } = makeCatalog()
    categories.push({ id: "archived-category", name: "Archived category", archived: true })
    categories[0].board = { direction: "row-reverse", wrap: "nowrap", gap: 28, removedToolIds: ["agreement"], placements: [{ toolId: "phone", width: 580, height: 320 }, { toolId: "archived" }, { toolId: "dates" }] }
    const workspace = getToolsWorkspace(categories, tools, "references")
    assert.deepEqual(workspace.tools.map(tool => tool.id), ["phone"])
    assert.deepEqual(workspace.board.placements, [{ toolId: "phone", width: 580, height: 320 }])
    assert.equal(workspace.board.direction, "row-reverse")
    assert.equal(workspace.board.wrap, "nowrap")
    assert.equal(workspace.board.gap, 28)
    assert.equal(workspace.categories.length, 2)
    assert.equal(getToolsWorkspace(categories, tools, "archived-category").category.id, "references")
    assert.equal(getToolsWorkspace(categories.map(category => ({ ...category, archived: true })), tools).category, undefined)
})

test("Global inputs share all input types, keep local variables independent, and preserve literal values", () => {
    const { catalog, consumer, output, values } = sharedFixture()
    const scope = getSharedScope(consumer, catalog.tools, values)
    assert.equal(scope.inputs.length, 6)
    assert.equal(generateOutput(output.id, consumer, { "local-name": "local" }, scope), "Jane Doe / Local")
    output.generatedText.default = "${global.email_input} | ${global.phone_input} | ${global.age} | ${global.reference_date} | ${global.consent}"
    assert.equal(generateOutput(output.id, consumer, {}, scope), "jane@example.com | (123) 456-7890 | 29 | 2020-10-19 | yes")
    const text = catalog.tools[0].elements.find(element => element.id === "agreement-name")
    text.textCase = "none"
    values.agreement["agreement-name"] = "<b>${global.age}</b>"
    output.generatedText.default = "${global.name_input}"
    assert.equal(generateOutput(output.id, consumer, {}, getSharedScope(consumer, catalog.tools, values)), "<b>${global.age}</b>")
})

test("shared number, date and radio conditions compare source values and survive serialization", () => {
    const { catalog, consumer, output, values } = sharedFixture()
    output.conditions = [
        { id: "consent", inputId: sharedInputId("agreement", "agreement-consent"), operator: "equals", value: "yes", text: "${global.name_input} agrees" },
        { id: "age", inputId: sharedInputId("agreement", "agreement-age"), operator: "at-least", value: "18", text: "Adult" },
        { id: "date", inputId: sharedInputId("agreement", "agreement-date"), operator: "less-than", value: "today", text: "Past date" },
    ]
    assert.deepEqual(validateTool(consumer, catalog.categories, catalog.tools), [])
    const saved = createSavedTool(consumer, catalog.tools)
    assert.equal(generateOutput(output.id, saved, {}, getSharedScope(saved, catalog.tools, values)), "Jane Doe agrees")
    values.agreement["agreement-consent"] = "no"
    assert.equal(generateOutput(output.id, saved, {}, getSharedScope(saved, catalog.tools, values)), "Adult")
    values.agreement["agreement-age"] = "12"
    assert.equal(generateOutput(output.id, saved, {}, getSharedScope(saved, catalog.tools, values)), "Past date")
    assert.deepEqual(saved.elements.find(element => element.id === output.id).conditions, output.conditions)
})

test("sharing excludes private, archived and other-category sources and reports missing references", () => {
    const { catalog, source, consumer, output, values } = sharedFixture()
    for (const changes of [{ isGlobal: false }, { archived: true }, { categoryId: "formatters" }]) {
        const tools = catalog.tools.map(tool => tool.id === source.id ? { ...tool, ...changes } : tool)
        assert.equal(getGlobalInputs(consumer, tools).length, 0)
        const result = generateRuntimeState(consumer, createRuntimeState(consumer), output.id, getSharedScope(consumer, tools, values))
        assert.match(result.message, /shared variable is unavailable/)
        assert.deepEqual(result.visibleOutputIds, [])
        assert.ok(validateTool(consumer, catalog.categories, tools).some(error => error.includes("unknown variable")))
    }
    assert.equal(getGlobalInputs(source, catalog.tools).length, 0, "a publisher uses its local names for its own inputs")
})

test("invalid shared values block only dependent outputs; snapshots and reset remain tool scoped", () => {
    const { catalog, consumer, output, values } = sharedFixture()
    values.agreement["agreement-email"] = "invalid"
    const scope = getSharedScope(consumer, catalog.tools, values)
    const generated = generateRuntimeState(consumer, { ...createRuntimeState(consumer), values: { "local-name": "local" } }, output.id, scope)
    assert.equal(generated.message, "", "unused invalid global email must not block this tool")
    assert.equal(generated.outputs[output.id], "Jane Doe / Local")
    values.agreement["agreement-name"] = "changed"
    assert.equal(generated.outputs[output.id], "Jane Doe / Local", "generated outputs are snapshots")
    assert.equal(resetRuntimeState().visibleOutputIds.length, 0)
    assert.equal(values.agreement["agreement-name"], "changed", "consumer reset does not clear publisher inputs")
    output.generatedText.default = "${global.email_input}"
    const invalid = generateRuntimeState(consumer, createRuntimeState(consumer), output.id, scope)
    assert.match(invalid.message, /Agreement generator.*valid email/)
    assert.deepEqual(invalid.visibleOutputIds, [])
})

test("duplicate Global names are rejected within a category and explicit space-between alignment is saved", () => {
    const { catalog, source, consumer, output } = sharedFixture()
    consumer.isGlobal = true
    assert.ok(validateTool(consumer, catalog.categories, catalog.tools).some(error => error.includes("already published")))
    output.generatedText.default = "Local"
    consumer.categoryId = "formatters"
    assert.deepEqual(validateTool(consumer, catalog.categories, catalog.tools), [])
    const container = createElement("Container", source)
    assert.equal(container.padding, 0)
    assert.equal(container.justifyContent, undefined)
    container.justifyContent = "space-between"
    source.elements.push(container)
    const saved = createSavedTool(source, catalog.tools)
    assert.equal(saved.isGlobal, true)
    assert.equal(saved.elements.at(-1).justifyContent, "space-between")
    const changed = builderReducer(createBuilderState(source), { type: "metadata", isGlobal: false })
    assert.equal(changed.tool.isGlobal, false)
    assert.equal(changed.revision, 1)
    delete container.justifyContent
    assert.deepEqual(validateTool(source, catalog.categories, catalog.tools), [])
})
