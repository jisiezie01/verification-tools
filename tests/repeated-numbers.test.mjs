import assert from "node:assert/strict"
import test from "node:test"
import { importTypeScript } from "./import-typescript.mjs"
import { makeRepeatedNumberCatalog } from "./fixtures/repeated-numbers.mjs"
import { seedCatalog } from "./catalog-fixture.mjs"

const runtime = await importTypeScript("src/components/ToolRenderer/functions.ts")
const builder = await importTypeScript("src/screens/CreateTool/functions.ts")
const numbers = await importTypeScript("src/data/toolNumberInputs/functions.ts")
const { getSharedScope, sharedInputId } = await importTypeScript("src/data/toolVariables/functions.ts")

function setup(entries = ["4", "5", "3"]) {
    const catalog = makeRepeatedNumberCatalog()
    const tool = catalog.tools[0]
    const input = tool.elements.find(element => element.id === "months")
    const output = tool.elements.find(element => element.id === "result")
    const rule = output.conditions[0]
    const state = { ...runtime.createRuntimeState(tool), values: { required: "12", months: JSON.stringify(entries) } }
    return { catalog, tool, input, output, rule, state }
}

test("repeated address fields use their sum in conditions and text while retaining every entry", () => {
    for (const [entries, expected] of [
        [["4", "5", "3"], "Requirement met: 12 months."],
        [["12", "12", "12"], "Requirement met: 36 months."],
        [["4", "5", "2"], "Below requirement: 11 months."],
        [Array(150).fill("1"), "Requirement met: 150 months."],
    ]) {
        const { tool, state } = setup(entries)
        const generated = runtime.generateRuntimeState(tool, state, "result")
        assert.equal(generated.message, "")
        assert.equal(generated.outputs.result, expected)
        assert.deepEqual(generated.values, state.values)
        assert.equal(runtime.getCopyValue("months", tool, generated), expected.match(/(\d+) months/)[1])
    }
})

test("adding, editing, and removing rows changes the total; blank rows block generation and preserve old output", () => {
    const { tool, state } = setup()
    const previous = runtime.generateRuntimeState(tool, state, "result")
    previous.values.months = '["4","5","3",""]'
    const incomplete = runtime.generateRuntimeState(tool, previous, "result")
    assert.match(incomplete.errors.months, /complete every field.*remove unused/)
    assert.deepEqual(incomplete.outputs, previous.outputs)
    assert.equal(runtime.generateOutput("result", tool, previous.values), "")
    previous.values.months = '["4","5","3","1"]'
    assert.equal(runtime.generateRuntimeState(tool, previous, "result").outputs.result, "Requirement met: 13 months.")
    previous.values.months = '["4","5"]'
    assert.equal(runtime.generateRuntimeState(tool, previous, "result").outputs.result, "Below requirement: 9 months.")
    previous.values = { required: "0", months: '["0","0"]' }
    assert.equal(runtime.generateRuntimeState(tool, previous, "result").outputs.result, "Requirement met: 0 months.")
})

test("limits and step apply to each row, and invalid or overflowing totals cannot generate", () => {
    for (const [raw, error] of [
        ['["4","-1","9"]', /address 2.*at least 0/],
        ['["13","0"]', /address 1.*no greater than 12/],
        ['["4","0.5"]', /address 2.*increments of 1/],
        ['["4","no"]', /address 2.*valid number/],
        ['[]', /valid number/],
        ['[4,5,3]', /valid number/],
        ['["4",null]', /valid number/],
        ['[invalid', /valid number/],
    ]) {
        const { tool, state } = setup()
        state.values.months = raw
        const failed = runtime.generateRuntimeState(tool, state, "result")
        assert.match(failed.errors.months, error)
        assert.deepEqual(failed.outputs, {})
    }
    const { tool, input, state } = setup(["1e308", "1e308"])
    delete input.max
    assert.match(runtime.generateRuntimeState(tool, state, "result").errors.months, /total is too large/)
})

test("the total works in formulas, calculation operands, and another-variable comparisons", () => {
    const { tool, output, rule, state } = setup()
    output.generatedText.default = "Total ${months_stayed_on_addresses}; doubled ${months_stayed_on_addresses * 2}; ${Currency(months_stayed_on_addresses)}."
    output.conditions = []
    assert.equal(runtime.generateRuntimeState(tool, state, "result").outputs.result, "Total 12; doubled 24; $12.00.")
    output.conditions = [{ ...rule, inputId: "", calculation: { operation: "sum", inputIds: ["months", "required"] }, text: "Sum ${calc.result}." }]
    assert.equal(runtime.generateRuntimeState(tool, state, "result").outputs.result, "Sum 24.")
    output.conditions = [{ ...rule, inputId: "required", comparisonInputId: "months", text: "Compared with total." }]
    assert.equal(runtime.generateRuntimeState(tool, state, "result").outputs.result, "Compared with total.")
    state.values.months = '["12","1"]'
    assert.match(runtime.generateRuntimeState(tool, state, "result").outputs.result, /^Total 13;/)
})

test("decimal entries compare and render without ordinary addition round-off", () => {
    const { tool, input, output, rule, state } = setup(["0.1", "0.2"])
    input.step = 0.1
    state.values.required = "0.3"
    tool.elements.find(element => element.id === "required").step = 0.1
    rule.operator = "equals"
    assert.equal(runtime.generateRuntimeState(tool, state, "result").outputs.result, "Requirement met: 0.3 months.")
    output.conditions = []
    input.min = -12
    state.values.months = '["-0.1","0.2"]'
    assert.equal(runtime.generateRuntimeState(tool, state, "result").outputs.result, "Below requirement: 0.1 months.")
})

test("repeated date-offset inputs use the total and still require whole units", () => {
    const { tool, input, output, state } = setup(["5", "7"])
    for (const id of ["move-in", "move-out"]) tool.elements.push({ ...builder.createElement("Date input", tool), id, variableName: id.replaceAll("-", "_") })
    state.values["move-in"] = "2022-10-10"
    state.values["move-out"] = "2023-09-30"
    output.conditions = [{ id: "date", inputId: "move-out", comparisonInputId: "move-in", operator: "at-least", value: "", offsetUnit: "months", offsetInputId: "months", additionalOffsetDays: -15, text: "${months_stayed_on_addresses} months; shortfall ${date.remainingDaysBeforeAdjustment}." }]
    assert.equal(runtime.generateRuntimeState(tool, state, "result").outputs.result, "12 months; shortfall 10.")
    input.step = 0.5
    state.values.months = '["5","7.5"]'
    assert.match(runtime.generateRuntimeState(tool, state, "result").message, /whole number of months/)
})

test("referenced hidden groups and live outputs cannot bypass row validation", () => {
    const { tool, output, state } = setup(["4", ""])
    const radio = { ...builder.createElement("Radio button", tool), id: "show", variableName: "show" }
    tool.elements.push(radio)
    tool.elements.find(element => element.id === "addresses").visibility = { mode: "show", inputId: radio.id, value: radio.options[0].value }
    for (const conditions of [output.conditions, []]) {
        output.conditions = conditions
        assert.match(runtime.generateRuntimeState(tool, state, "result").message, /complete every field/)
        state.values.months = '["-1","12"]'
        assert.match(runtime.generateRuntimeState(tool, state, "result").message, /at least 0/)
        assert.equal(runtime.generateOutput("result", tool, state.values), "")
        state.values.months = '["4",""]'
    }
    output.visibility = { mode: "hide", inputId: radio.id, value: radio.options[0].value }
    const live = runtime.resolveRadioOutputs(tool, state)
    assert.equal(live.outputs.result, "")
    assert.match(live.message, /complete every field/)
})

test("Global tools publish the total and validate referenced entries from their source", () => {
    const { tool, input, output, rule, state } = setup()
    const source = { id: "shared-addresses", categoryId: tool.categoryId, name: "Shared addresses", isGlobal: true, elements: [{ ...input, containerId: undefined }] }
    tool.elements = tool.elements.filter(element => element.id !== input.id)
    rule.inputId = sharedInputId(source.id, input.id)
    rule.text = "Total ${global.months_stayed_on_addresses}; doubled ${global.months_stayed_on_addresses * 2}."
    output.generatedText.default = "Below requirement."
    const values = { [source.id]: { months: state.values.months } }
    delete state.values.months
    const run = () => runtime.generateRuntimeState(tool, state, "result", getSharedScope(tool, [tool, source], values))
    assert.equal(run().message, "")
    assert.equal(run().outputs.result, "Total 12; doubled 24.")
    values[source.id].months = '["4",""]'
    assert.match(run().message, /Shared addresses: Please complete every field/)
    values[source.id].months = '["4","-1"]'
    assert.match(run().message, /Shared addresses.*at least 0/)
})

test("reset restores one default field and ordinary number inputs retain their behavior", () => {
    const { tool, input } = setup()
    input.defaultValue = 6
    assert.deepEqual(numbers.numberInputEntries(input, runtime.createRuntimeState(tool).values.months), ["6"])
    const reset = runtime.resetRuntimeState(tool)
    assert.deepEqual(numbers.numberInputEntries(input, reset.values.months), ["6"])
    assert.deepEqual(reset.outputs, {})
    delete input.defaultValue
    assert.deepEqual(numbers.numberInputEntries(input, runtime.resetRuntimeState(tool).values.months ?? ""), [""])
    input.repeatable.enabled = false
    assert.equal(runtime.inputError(input, "12"), "")
    assert.match(runtime.inputError(input, "13"), /no greater than 12/)
    assert.equal(runtime.resolveTemplate("${months_stayed_on_addresses}", tool, { months: "4" }), "4")
    assert.match(runtime.inputError(input, '["4","5"]'), /valid number/)
})

test("labels increment a suffix or an explicit index without changing variable names", () => {
    const { input } = setup()
    assert.deepEqual([0, 1, 2].map(index => numbers.numberInputLabel(input, index)), ["Months stayed on address 1", "Months stayed on address 2", "Months stayed on address 3"])
    input.label = "Address {index}: months stayed"
    assert.equal(numbers.numberInputLabel(input, 2), "Address 3: months stayed")
    input.label = "Months stayed"
    assert.equal(numbers.numberInputLabel(input, 0), "Months stayed 1")
    assert.equal(input.variableName, "months_stayed_on_addresses")
})

test("repeat settings survive save/reload and container duplication; invalid settings cannot save", async () => {
    const { catalog, tool, input } = setup()
    input.repeatable.buttonText = "Add another address"
    const storage = await seedCatalog(catalog)
    await builder.saveTool(tool)
    assert.deepEqual(storage.data.tools[0].elements.find(element => element.id === "months").repeatable, input.repeatable)
    const copied = builder.duplicateContainer(tool.elements, "addresses")
    assert.deepEqual(copied.elements.find(element => element.id === "months_1").repeatable, input.repeatable)
    assert.deepEqual(builder.validateTool({ ...tool, elements: copied.elements }), [])
    for (const config of [null, { enabled: "yes", buttonText: "Add" }, { enabled: true }, { enabled: true, buttonText: " " }]) {
        input.repeatable = config
        assert.throws(() => builder.createSavedTool(tool), /additional field settings|Add field button text/)
    }
})
