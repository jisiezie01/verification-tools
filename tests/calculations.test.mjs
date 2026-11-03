import assert from "node:assert/strict"
import test from "node:test"
import { importTypeScript } from "./import-typescript.mjs"
import { makeCalculationCatalog, makeCalculationRule } from "./fixtures/calculations.mjs"
import { seedCatalog } from "./catalog-fixture.mjs"

const runtime = await importTypeScript("src/components/ToolRenderer/functions.ts")
const builder = await importTypeScript("src/screens/CreateTool/functions.ts")
const { getSharedScope, sharedInputId } = await importTypeScript("src/data/toolVariables/functions.ts")

function setup(operation = "sum") {
    const catalog = makeCalculationCatalog()
    const tool = catalog.tools[0]
    const output = tool.elements.find(element => element.id === "result")
    const rule = makeCalculationRule(operation)
    output.conditions = [rule]
    const state = { ...runtime.createRuntimeState(tool), values: { a: "20", b: "5", c: "2", target: "25" } }
    return { catalog, tool, output, rule, state }
}

test("calculations combine every input and choose conditional text for all four operations", () => {
    for (const [operation, expected] of [["sum", 27], ["difference", 13], ["product", 200], ["quotient", 2]]) {
        const { tool, rule, state } = setup(operation)
        rule.value = String(expected)
        const generated = runtime.generateRuntimeState(tool, state, "result")
        assert.equal(generated.message, "", operation)
        assert.equal(generated.outputs.result, `Meets target: ${expected}.`, operation)
        assert.equal(runtime.getCopyValue("result", tool, generated), `Meets target: ${expected}.`)
        assert.deepEqual(generated.values, state.values)
        rule.value = String(expected + 1)
        assert.equal(runtime.generateRuntimeState(tool, state, "result").outputs.result, "Below target.")
    }
})

test("generated text evaluates arithmetic formulas and requests their number inputs", () => {
    const { tool, output, state } = setup()
    output.conditions = []
    output.generatedText.default = "Monthly total: ${((amount_a * amount_b) * 52) / 12}"
    state.values = {}
    const missing = runtime.generateRuntimeState(tool, state, "result")
    assert.match(missing.message, /Please enter Amount A/)
    assert.match(missing.message, /Please enter Amount B/)
    state.values = { a: "20", b: "40" }
    const generated = runtime.generateRuntimeState(tool, state, "result")
    assert.equal(generated.message, "")
    assert.equal(generated.outputs.result, "Monthly total: 3466.6666666666665")
    output.generatedText.default = "USD: ${Currency(((amount_a * amount_b) * 52) / 12)} / JPY: ${Currency(((amount_a * amount_b) * 52) / 12, 'JPY')}"
    assert.equal(runtime.generateRuntimeState(tool, state, "result").outputs.result, "USD: $3,466.67 / JPY: ￥3,466.67")
    output.generatedText.default = "${amount_a / amount_b}"
    state.values.b = "0"
    const failed = runtime.generateRuntimeState(tool, state, "result")
    assert.match(failed.message, /divide by zero/)
    tool.elements.push({ ...builder.createElement("Text input", tool), id: "consent", variableName: "consent" })
    output.generatedText.default = "${amount_a + consent}"
    assert.ok(builder.validateTool(tool).some(message => message.includes("must be a number input")))
    output.generatedText.default = "${amount_a * missing_input}"
    assert.ok(builder.validateTool(tool).some(message => message.includes("unknown variable")))
    output.generatedText.default = "${Currency(amount_a, 'ZZZ')}"
    assert.ok(builder.validateTool(tool).some(message => message.includes("not a supported ISO currency code")))
})

test("conditional text inserts a numbered radio variable selected independently of the condition", () => {
    const { tool, output, state } = setup()
    const trigger = { ...builder.createElement("Radio button", tool), id: "request-source", variableName: "re_open_request_radio_group_1",
        options: [{ id: "staff", label: "Property staff", value: "staff" }, { id: "other", label: "Other", value: "other" }] }
    const selection = { ...builder.createElement("Radio button", tool), id: "verification-type", variableName: "re_open_request_radio_group_2",
        options: [{ id: "rental", label: "Rental", value: "rental" }, { id: "employment", label: "Employment", value: "employment" }] }
    tool.elements.push(trigger, selection)
    output.conditions = [{ id: "request", inputId: trigger.id, operator: "equals", value: "staff", text: "Staff requested to re-open the ${re_open_request_radio_group_2} verification." }]
    output.generatedText.default = "Re-open the ${re_open_request_radio_group_2} verification."
    assert.deepEqual(builder.validateTool(tool), [])
    const saved = builder.createSavedTool(tool)
    for (const value of ["rental", "employment"]) {
        state.values = { [trigger.id]: "staff", [selection.id]: value }
        const generated = runtime.generateRuntimeState(saved, state, output.id)
        assert.equal(generated.message, "")
        assert.equal(generated.outputs.result, `Staff requested to re-open the ${value} verification.`)
        state.values[trigger.id] = "other"
        assert.equal(runtime.generateRuntimeState(saved, state, output.id).outputs.result, `Re-open the ${value} verification.`)
    }
    state.values = { [trigger.id]: "staff" }
    const missing = runtime.generateRuntimeState(saved, state, output.id)
    assert.equal(missing.errors[selection.id], "Please select an option.")
    assert.deepEqual(missing.outputs, {})
    output.conditions[0].text = "${re_open_request_radio_group_2 + 1}"
    assert.ok(builder.validateTool(tool).some(message => message.includes("must be a number input")))
    state.values[selection.id] = "rental"
    assert.match(runtime.generateRuntimeState(tool, state, output.id).message, /must be a number input/)
})

for (const [type, value, expected] of [
    ["Radio button", "option_1", "option_1"],
    ["Text input", "${amount_a + 1}", "${amount_a + 1}"],
    ["Name input", "Jane Doe", "Jane Doe"],
    ["Email input", "jane@example.com", "jane@example.com"],
    ["Phone input", "1234567890", "(123) 456-7890"],
    ["Date input", "2026-11-03", "11/03/2026"],
    ["Number input", "0", "0"],
]) {
    for (const shared of [false, true]) test(`${shared ? "Global" : "local"} ${type} with a numbered name remains a text variable`, () => {
        const { tool, output, state } = setup()
        const source = shared ? { id: "shared", name: "Shared inputs", categoryId: tool.categoryId, isGlobal: true, elements: [] } : tool
        const input = { ...builder.createElement(type, source), id: "value", variableName: "input_2", ...(type === "Text input" ? { textCase: "none" } : {}) }
        source.elements.push(input)
        output.conditions = []
        output.generatedText.default = shared ? "Value: ${global.input_2}" : "Value: ${input_2}"
        const catalog = shared ? [tool, source] : [tool]
        assert.deepEqual(builder.validateTool(tool, undefined, catalog), [])
        state.values = shared ? {} : { value }
        const scope = shared ? getSharedScope(tool, catalog, { [source.id]: { value } }) : undefined
        const generated = runtime.generateRuntimeState(tool, state, output.id, scope)
        assert.equal(generated.message, "")
        assert.equal(generated.outputs.result, `Value: ${expected}`)
        const missing = runtime.generateRuntimeState(tool, { ...state, values: {} }, output.id, shared ? getSharedScope(tool, catalog, {}) : undefined)
        assert.match(missing.message, /Please (enter|select)/)
        assert.deepEqual(missing.outputs, {})
    })
}

test("numbered variables still work in arithmetic and currency formulas alongside numeric literals", () => {
    const { tool, output, state } = setup()
    tool.elements.find(element => element.id === "a").variableName = "amount_2"
    output.conditions = []
    output.generatedText.default = "${amount_2 + 1} / ${Currency(amount_2)} / ${42} / ${1e2}"
    assert.deepEqual(builder.validateTool(tool), [])
    const generated = runtime.generateRuntimeState(tool, state, output.id)
    assert.equal(generated.message, "")
    assert.equal(generated.outputs.result, "21 / $20.00 / 42 / 100")
})

test("difference and quotient follow operand order, including negatives and a zero numerator", () => {
    for (const [operation, expected] of [["difference", -17], ["quotient", 0.125]]) {
        const { tool, rule, state } = setup(operation)
        rule.calculation.inputIds = ["b", "a", "c"]
        rule.value = String(expected)
        assert.equal(runtime.generateRuntimeState(tool, state, "result").outputs.result, `Meets target: ${expected}.`)
    }
    const { tool, rule, state } = setup("quotient")
    state.values.a = "0"
    rule.value = "0"
    assert.equal(runtime.generateRuntimeState(tool, state, "result").outputs.result, "Meets target: 0.")
})

test("decimal round-off does not change equality or boundary comparisons", () => {
    const { tool, rule, state } = setup()
    state.values = { a: "0.1", b: "0.2", c: "0" }
    rule.value = "0.3"
    for (const [operator, matches] of [["equals", true], ["not-equals", false], ["greater-than", false], ["less-than", false], ["at-least", true], ["at-most", true]]) {
        rule.operator = operator
        assert.equal(runtime.matchesCondition(rule, tool, state.values), matches, operator)
    }
    state.values = { a: "1000000000000000", b: "1", c: "0" }
    rule.value = "1000000000000000"
    rule.operator = "equals"
    assert.equal(runtime.matchesCondition(rule, tool, state.values), false, "Distinct integer results must stay distinct")
})

test("calculations compare with another number input plus an offset and require that input", () => {
    const { tool, rule, state } = setup()
    rule.comparisonInputId = "target"
    rule.offset = 2
    rule.value = ""
    assert.equal(runtime.generateRuntimeState(tool, state, "result").outputs.result, "Meets target: 27.")
    delete state.values.target
    const missing = runtime.generateRuntimeState(tool, state, "result")
    assert.match(missing.message, /Target amount/)
    assert.ok(missing.errors.target)
    assert.deepEqual(missing.outputs, {})
})

test("missing and invalid calculation operands block fallback text, including hidden inputs", () => {
    const { tool, rule, state } = setup()
    state.values.b = " "
    const missing = runtime.generateRuntimeState(tool, state, "result")
    assert.ok(missing.errors.b)
    assert.deepEqual(missing.outputs, {})
    assert.equal(runtime.generateOutput("result", tool, state.values), "")
    state.values.b = "invalid"
    assert.ok(runtime.generateRuntimeState(tool, state, "result").errors.b)
    const radio = { ...builder.createElement("Radio button", tool), id: "show" }
    tool.elements.push(radio)
    tool.elements.find(element => element.id === "calculation-group").visibility = { mode: "show", inputId: "show", value: radio.options[0].value }
    const invalid = runtime.generateRuntimeState(tool, state, "result")
    assert.match(invalid.message, /Amount B.*valid number/)
    assert.deepEqual(invalid.outputs, {})
    rule.calculation.inputIds = ["a", "missing"]
    assert.match(runtime.generateRuntimeState(tool, state, "result").message, /available number input/)
})

test("division by zero and overflow preserve previous results and never partially generate", () => {
    const { tool, rule, state } = setup("quotient")
    const extra = { ...builder.createElement("Output text", tool), id: "extra", generatedText: { default: "New text" } }
    tool.elements.push(extra)
    state.outputs = { result: "Previous result", extra: "Previous extra" }
    state.visibleOutputIds = ["result", "extra"]
    for (const zero of ["0", "-0"]) {
        state.values.c = zero
        const failed = runtime.generateRuntimeState(tool, state, ["result", "extra"])
        assert.match(failed.message, /divide by zero/)
        assert.deepEqual(failed.outputs, state.outputs)
        assert.equal(runtime.generateOutput("result", tool, state.values), "")
    }
    rule.calculation.operation = "product"
    state.values = { a: "1e308", b: "1e308", c: "1" }
    const overflow = runtime.generateRuntimeState(tool, state, "result")
    assert.match(overflow.message, /too large/)
    assert.deepEqual(overflow.outputs, state.outputs)
})

test("first matching rule skips later calculations and their required inputs", () => {
    const { tool, output, rule, state } = setup("quotient")
    output.conditions.unshift({ id: "first", inputId: "a", operator: "equals", value: "20", text: "First rule wins" })
    state.values = { a: "20" }
    assert.equal(runtime.generateRuntimeState(tool, state, "result").outputs.result, "First rule wins")
    state.values.a = "21"
    assert.match(runtime.generateRuntimeState(tool, state, "result").message, /Amount B/)
    output.conditions = [rule, { id: "later", inputId: "target", operator: "equals", value: "1", text: "Later" }]
    state.values = { a: "20", b: "0", c: "1" }
    assert.match(runtime.generateRuntimeState(tool, state, "result").message, /divide by zero/, "Show the earlier calculation error before asking for later inputs")
})

test("radio-controlled output applies calculations live and reports arithmetic errors", () => {
    const { tool, output, state } = setup("quotient")
    const radio = { ...builder.createElement("Radio button", tool), id: "show" }
    tool.elements.push(radio)
    output.visibility = { mode: "show", inputId: radio.id, value: radio.options[0].value }
    output.conditions[0].value = "2"
    state.values.show = radio.options[0].value
    assert.equal(runtime.resolveRadioOutputs(tool, state).outputs.result, "Meets target: 2.")
    state.values.c = "0"
    const failed = runtime.resolveRadioOutputs(tool, state)
    assert.equal(failed.outputs.result, "")
    assert.match(failed.message, /divide by zero/)
    assert.equal(runtime.resolveRadioOutputs(tool, runtime.resetRuntimeState()).message, "")
})

test("Global calculation operands are required, validated, and resolved by their source", () => {
    const { catalog, tool, output, rule, state } = setup()
    const source = { id: "global-source", categoryId: tool.categoryId, name: "Shared amounts", isGlobal: true, elements: [] }
    source.elements.push({ ...builder.createElement("Number input", source), id: "shared-number", label: "Shared number", variableName: "shared_number", min: 0 })
    catalog.tools.push(source)
    rule.calculation.inputIds = ["a", sharedInputId(source.id, "shared-number"), "c"]
    const values = { [source.id]: { "shared-number": "5" } }
    const run = () => runtime.generateRuntimeState(tool, state, output.id, getSharedScope(tool, catalog.tools, values))
    assert.equal(run().outputs.result, "Meets target: 27.")
    values[source.id]["shared-number"] = ""
    assert.match(run().message, /Shared amounts: Please enter Shared number/)
    values[source.id]["shared-number"] = "-1"
    assert.match(run().message, /Shared amounts.*at least 0/)
    catalog.tools.pop()
    assert.match(run().message, /shared variable is unavailable/)
})

test("calculation settings survive save/reload; malformed and mismatched rules cannot save", async () => {
    const { catalog, tool, output, rule } = setup()
    const storage = await seedCatalog(catalog)
    await builder.saveTool(tool)
    const reloaded = JSON.parse(JSON.stringify(storage.data.tools[0]))
    assert.deepEqual(reloaded.elements.find(element => element.id === output.id).conditions[0], rule)
    for (const calculation of [
        { operation: "unknown", inputIds: ["a", "b"] },
        { operation: "sum", inputIds: ["a"] },
        { operation: "sum", inputIds: ["a", "missing"] },
        { operation: "sum", inputIds: ["a", "result"] },
        { operation: "sum", inputIds: "a,b" },
    ]) {
        rule.calculation = calculation
        assert.throws(() => builder.createSavedTool(tool), /calculation|number input/)
    }
    rule.calculation = { operation: "sum", inputIds: ["a", "b"] }
    rule.comparisonInputId = "result"
    assert.throws(() => builder.createSavedTool(tool), /comparison variable/)
    delete rule.comparisonInputId
    rule.value = ""
    assert.throws(() => builder.createSavedTool(tool), /number to compare/)
})

test("duplicating and deleting containers preserve calculation order and remap local operands", () => {
    const { tool, rule } = setup()
    rule.calculation.inputIds = ["c", "a", "target", "a"]
    rule.comparisonInputId = "target"
    const duplicate = builder.duplicateContainer(tool.elements, "calculation-group")
    const copiedRule = duplicate.elements.find(element => element.id === "result_1").conditions[0]
    assert.deepEqual(copiedRule.calculation.inputIds, ["c_1", "a_1", "target", "a_1"])
    assert.equal(copiedRule.comparisonInputId, "target")
    assert.deepEqual(rule.calculation.inputIds, ["c", "a", "target", "a"])
    assert.deepEqual(builder.validateTool({ ...tool, elements: duplicate.elements }), [])
    const elements = builder.removeElement(duplicate.elements, "a_1")
    assert.deepEqual(elements.find(element => element.id === "result_1").conditions[0].calculation.inputIds, ["c_1", "", "target", ""])
    assert.throws(() => builder.createSavedTool({ ...tool, elements }), /available number input/)
})
