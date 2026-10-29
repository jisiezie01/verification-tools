import assert from "node:assert/strict"
import { test } from "node:test"
import { importTypeScript } from "./import-typescript.mjs"
import { makeCatalog } from "./fixtures/tools.mjs"

const runtime = await importTypeScript("src/components/ToolRenderer/functions.ts")

test("only referenced inputs are required, whitespace is empty, and errors preserve previous outputs", () => {
    const tool = makeCatalog().tools[0]
    const output = tool.elements.find(e => e.id === "agreement-output")
    output.conditions = []
    output.generatedText.default = "Hello ${name_input}: ${consent}"
    const state = { ...runtime.createRuntimeState(tool), values: { "agreement-name": "  " }, outputs: { [output.id]: "Previous result" }, visibleOutputIds: [output.id] }
    const result = runtime.generateRuntimeState(tool, state, output.id)
    assert.equal(result.errors["agreement-name"], "Please enter Full name.")
    assert.equal(result.errors["agreement-consent"], "Please select an option.")
    assert.equal(result.errors["agreement-email"], undefined)
    assert.match(result.message, /Please enter Full name/)
    assert.deepEqual(result.outputs, state.outputs)
    assert.deepEqual(result.visibleOutputIds, state.visibleOutputIds)
    state.values = { "agreement-name": "jane doe", "agreement-consent": "yes" }
    const valid = runtime.generateRuntimeState(tool, state, output.id)
    assert.equal(valid.message, "")
    assert.deepEqual(valid.errors, {})
    assert.equal(valid.outputs[output.id], "Hello Jane Doe: yes")
})

test("conditional requirements follow evaluated rules and selected text, including numeric zero", () => {
    const tool = makeCatalog().tools[0]
    const output = tool.elements.find(e => e.id === "agreement-output")
    output.conditions = [{ id: "yes", inputId: "agreement-consent", operator: "equals", value: "yes", text: "Hello ${name_input}" }]
    output.generatedText.default = "Age: ${age}"
    const state = runtime.createRuntimeState(tool)
    assert.equal(runtime.generateRuntimeState(tool, state, output.id).errors["agreement-consent"], "Please select an option.")
    state.values = { "agreement-consent": "yes", "agreement-name": "Jane" }
    assert.equal(runtime.generateRuntimeState(tool, state, output.id).message, "")
    state.values = { "agreement-consent": "no", "agreement-age": "0" }
    const generated = runtime.generateRuntimeState(tool, state, output.id)
    assert.equal(generated.message, "")
    assert.equal(generated.outputs[output.id], "Age: 0")
})

test("phone formatting limits digits and remains editable at punctuation boundaries", () => {
    assert.equal(runtime.formatPhone("1"), "(1")
    assert.equal(runtime.formatPhone("123"), "(123")
    assert.equal(runtime.formatPhone("1234"), "(123) 4")
    assert.equal(runtime.formatPhone("1234567"), "(123) 456-7")
    assert.equal(runtime.formatPhone("(123) 456-789012"), "(123) 456-7890")
    assert.equal(runtime.formatPhone("abc"), "")
    assert.equal(runtime.toPascalCase("jane doe"), "Jane Doe")
    assert.equal(runtime.toPascalCase("JaneDoe"), "JaneDoe")
    assert.equal(runtime.toPascalCase("jANE DOE"), "Jane Doe")
    assert.equal(runtime.toPascalCase("  jane   doe  "), "  Jane   Doe  ")
    assert.equal(runtime.toPascalCase("jane\tdoe\nsmith"), "Jane\tDoe\nSmith")
    assert.equal(runtime.toPascalCase("mary-jane o'neil"), "Mary-Jane O'Neil")
})
test("email, phone, numeric limits, steps, and date boundaries validate while empty inputs remain optional", () => {
    const tool = makeCatalog().tools[0]
    const email = tool.elements.find(input => input.type === "Email input")
    const phone = tool.elements.find(input => input.type === "Phone input")
    const number = tool.elements.find(input => input.type === "Number input")
    const date = tool.elements.find(input => input.type === "Date input")
    assert.ok(runtime.inputError(email, "wrong@"))
    assert.equal(runtime.inputError(email, "jane+test@example.com"), "")
    assert.ok(runtime.inputError(phone, "(123) 45"))
    assert.equal(runtime.inputError(phone, "(123) 456-7890"), "")
    assert.ok(runtime.inputError(number, "101"))
    assert.ok(runtime.inputError(number, "-1"))
    assert.ok(runtime.inputError(number, "1.5"))
    assert.equal(runtime.inputError({ ...number, step: 0.1 }, "0.3"), "")
    assert.ok(runtime.inputError(date, "2026-02-30"))
    assert.ok(runtime.inputError({ ...date, max: { mode: "today", value: "" } }, "2999-01-01"))
    for (const input of [email, phone, number, date]) assert.equal(runtime.inputError(input, ""), "")
})
test("conditional generation uses first matching radio, numeric or date rule with a default fallback", () => {
    const tool = makeCatalog().tools[0]
    assert.equal(runtime.generateOutput("agreement-output", tool, { "agreement-consent": "yes", "agreement-name": "jane doe", "agreement-age": "30" }), "I, Jane Doe agree")
    assert.equal(runtime.generateOutput("agreement-output", tool, { "agreement-consent": "no", "agreement-age": "30", "agreement-name": "jane" }), "Adult: Jane")
    assert.equal(runtime.generateOutput("agreement-output", tool, { "agreement-date": "2000-01-01" }), "Earlier date: 2000-01-01")
    assert.equal(runtime.generateOutput("agreement-output", tool, {}), "I disagree")
    assert.equal(runtime.matchesCondition({ inputId: "agreement-age", operator: "not-equals", value: "18" }, tool, {}), false)
    assert.equal(runtime.matchesCondition({ inputId: "agreement-age", operator: "greater-than", value: "9" }, tool, { "agreement-age": "10" }), true)
    assert.equal(runtime.matchesCondition({ inputId: "agreement-date", operator: "equals", value: "today" }, tool, { "agreement-date": runtime.localDate() }), true)
})
test("templates treat inserted data as literal text and never evaluate expressions", () => {
    const tool = makeCatalog().tools[0]
    assert.equal(runtime.resolveTemplate("Hello ${name_input}", tool, { "agreement-name": "${consent}<script>alert(1)</script>" }), "Hello ${consent}<script>alert(1)</script>")
    assert.equal(runtime.resolveTemplate("${globalThis.process.exit()} / ${missing}", tool, {}), " / ")
})
test("generation, visibility, reset, and copy operate on isolated runtime state", () => {
    const tool = makeCatalog().tools[0]
    const output = tool.elements.find(element => element.id === "agreement-output")
    const copy = tool.elements.find(element => element.id === "agreement-copy")
    const initial = runtime.createRuntimeState(tool)
    assert.equal(runtime.canShowElement(output, initial, tool), false)
    assert.equal(runtime.canShowElement(copy, initial, tool), false)
    const generated = runtime.generateRuntimeState(tool, { ...initial, values: { "agreement-name": "jane doe", "agreement-consent": "yes" } }, output.id)
    assert.equal(runtime.canShowElement(copy, generated, tool), true)
    assert.equal(runtime.getCopyValue(output.id, tool, generated), "I, Jane Doe agree")
    assert.equal(runtime.getCopyValue("agreement-name", tool, generated), "Jane Doe")
    assert.deepEqual(initial.values, {})
    const reset = runtime.resetRuntimeState()
    assert.equal(runtime.canShowElement(copy, reset, tool), false)
    assert.deepEqual(reset.outputs, {})
    assert.deepEqual(reset.values, {})
    output.initiallyHidden = false
    assert.equal(runtime.canShowElement(output, runtime.createRuntimeState(tool), tool), true)
    assert.equal(runtime.canShowElement(output, reset, tool), false)
})
test("invalid values block generation and are reported beside the corresponding inputs", () => {
    const tool = makeCatalog().tools[0]
    const next = runtime.generateRuntimeState(tool, { ...runtime.createRuntimeState(tool), values: { "agreement-email": "bad" } }, "agreement-output")
    assert.ok(next.errors["agreement-email"])
    assert.ok(next.message)
    assert.deepEqual(next.visibleOutputIds, [])
    assert.throws(() => runtime.getCopyValue("missing", tool, next))
})

test("comparison variables and offsets use matching types and calendar days", () => {
    const tool = makeCatalog().tools[0]
    const date = tool.elements.find(e => e.id === "agreement-date")
    const number = tool.elements.find(e => e.id === "agreement-age")
    tool.elements.push({ ...date, id: "other-date" }, { ...number, id: "other-number" })
    const rule = { inputId: date.id, comparisonInputId: "other-date", value: "", offset: 60, operator: "equals" }
    const values = { [date.id]: "2024-03-01", "other-date": "2024-01-01" }
    assert.equal(runtime.matchesCondition(rule, tool, values), true)
    assert.equal(runtime.matchesCondition(rule, tool, { [date.id]: "2024-03-01" }), false)
    assert.equal(runtime.matchesCondition({ ...rule, offset: 59 }, tool, values), false)
    assert.equal(runtime.matchesCondition({ ...rule, offset: 0.5 }, tool, values), false)
    assert.equal(runtime.matchesCondition({ ...rule, comparisonInputId: "other-number" }, tool, { ...values, "other-number": "60" }), false)
    assert.equal(runtime.matchesCondition({ ...rule, comparisonInputId: undefined, value: "2024-04-30", offset: -60 }, tool, values), true)
    assert.equal(runtime.matchesCondition({ inputId: number.id, comparisonInputId: "other-number", value: "", operator: "equals", offset: 5 }, tool, { [number.id]: "65", "other-number": "60" }), true)
    const output = tool.elements.find(e => e.id === "agreement-output")
    output.conditions = [{ ...rule, text: "Match" }]
    assert.deepEqual(runtime.requiredOutputInputs(tool, [output.id], { [date.id]: "2024-03-01" }).map(e => e.id).sort(), [date.id, "other-date"].sort())
})
