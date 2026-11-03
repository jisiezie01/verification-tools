import assert from "node:assert/strict"
import test from "node:test"
import { importTypeScript } from "./import-typescript.mjs"
import { makeDateOffsetCatalog } from "./fixtures/date-offsets.mjs"
import { seedCatalog } from "./catalog-fixture.mjs"

const runtime = await importTypeScript("src/components/ToolRenderer/functions.ts")
const builder = await importTypeScript("src/screens/CreateTool/functions.ts")
const { getSharedScope, sharedInputId } = await importTypeScript("src/data/toolVariables/functions.ts")

function setup() {
    const catalog = makeDateOffsetCatalog()
    const tool = catalog.tools[0]
    const output = tool.elements.find(element => element.id === "result")
    const rule = output.conditions[0]
    rule.additionalOffsetDays = -15
    const state = { ...runtime.createRuntimeState(tool), values: { "move-in": "07/25/2022", "move-out": "07/10/2023", months: "12" } }
    return { catalog, tool, output, rule, state }
}

test("extra days allow exactly a 15-day shortfall after the required calendar months", () => {
    const { tool, rule, state } = setup()
    for (const [date, matches] of [["07/09/2023", false], ["07/10/2023", true], ["07/11/2023", true], ["07/25/2023", true], ["11/03/2023", true]]) {
        state.values["move-out"] = date
        const generated = runtime.generateRuntimeState(tool, state, "result")
        assert.equal(generated.message, "")
        assert.equal(generated.outputs.result, matches ? "Requirement met." : "Requirement not met.", date)
    }
    state.values["move-out"] = "07/10/2023"
    state.values.months = "13"
    assert.equal(runtime.generateRuntimeState(tool, state, "result").outputs.result, "Requirement not met.")
    state.values.months = "12"
    for (const adjustment of [undefined, 0]) {
        rule.additionalOffsetDays = adjustment
        assert.equal(runtime.generateRuntimeState(tool, state, "result").outputs.result, "Requirement not met.")
        assert.equal(runtime.generateRuntimeState(tool, { ...state, values: { ...state.values, "move-out": "07/25/2023" } }, "result").outputs.result, "Requirement met.")
    }
})

test("day adjustments follow calendar clamping for fixed month and year offsets", () => {
    const { tool, rule } = setup()
    delete rule.comparisonInputId
    delete rule.offsetInputId
    rule.operator = "equals"
    rule.offset = 1
    for (const [start, unit, adjustment, expected] of [
        ["2024-01-31", "months", -15, "2024-02-14"],
        ["2024-01-31", "months", 15, "2024-03-15"],
        ["2024-02-29", "years", -15, "2025-02-13"],
        ["2024-03-01", "days", -2, "2024-02-29"],
    ]) {
        Object.assign(rule, { value: start, offsetUnit: unit, additionalOffsetDays: adjustment })
        assert.equal(runtime.matchesCondition(rule, tool, { "move-out": expected }), true, `${start} + 1 ${unit} + ${adjustment} days`)
        const previous = new Date(`${expected}T00:00:00Z`)
        previous.setUTCDate(previous.getUTCDate() - 1)
        assert.equal(runtime.matchesCondition(rule, tool, { "move-out": previous.toISOString().slice(0, 10) }), false)
    }
    Object.assign(rule, { value: "today", offset: 0, additionalOffsetDays: -15 })
    const cutoff = new Date(`${runtime.localDate()}T00:00:00Z`)
    cutoff.setUTCDate(cutoff.getUTCDate() - 15)
    assert.equal(runtime.matchesCondition(rule, tool, { "move-out": cutoff.toISOString().slice(0, 10) }), true)
})

test("additional days work with Global comparison dates and month inputs", () => {
    const { catalog, tool, rule, state } = setup()
    const shared = { id: "shared", categoryId: tool.categoryId, name: "Shared dates", isGlobal: true, elements: tool.elements.filter(element => ["move-in", "months"].includes(element.id)).map(element => ({ ...element, toolId: "shared", containerId: undefined })) }
    tool.elements = tool.elements.filter(element => !["move-in", "months"].includes(element.id))
    catalog.tools.push(shared)
    rule.comparisonInputId = sharedInputId(shared.id, "move-in")
    rule.offsetInputId = sharedInputId(shared.id, "months")
    assert.deepEqual(builder.validateTool(tool, catalog.categories, catalog.tools), [])
    const scope = getSharedScope(tool, catalog.tools, { shared: { "move-in": "2022-07-25", months: "12" } })
    assert.equal(runtime.generateRuntimeState(tool, state, "result", scope).outputs.result, "Requirement met.")
    rule.operator = "less-than"
    rule.text = "Adjusted: ${date.remainingDays}. Original: ${date.remainingDaysBeforeAdjustment}."
    state.values["move-out"] = "07/09/2023"
    assert.deepEqual(builder.validateTool(tool, catalog.categories, catalog.tools), [])
    assert.equal(runtime.generateRuntimeState(tool, state, "result", scope).outputs.result, "Adjusted: 1. Original: 16.")
    const missing = getSharedScope(tool, catalog.tools, { shared: { "move-in": "2022-07-25" } })
    assert.match(runtime.generateRuntimeState(tool, state, "result", missing).message, /Please enter Required months/)
})

test("invalid day adjustments cannot save or silently generate fallback text", () => {
    const { tool, rule, state } = setup()
    state.outputs.result = "Previous result"
    for (const adjustment of [0.5, NaN, Infinity, "15", null]) {
        rule.additionalOffsetDays = adjustment
        assert.throws(() => builder.createSavedTool(tool), /additional offset must be a whole number of days/)
        const generated = runtime.generateRuntimeState(tool, state, "result")
        assert.match(generated.message, /additional offset must be a whole number of days/)
        assert.deepEqual(generated.outputs, state.outputs)
        assert.equal(runtime.matchesCondition(rule, tool, runtime.getRuntimeValues(tool, state.values)), false)
    }
    Object.assign(rule, { inputId: "months", comparisonInputId: undefined, offsetInputId: undefined, value: "12", additionalOffsetDays: -15 })
    assert.throws(() => builder.createSavedTool(tool), /additional day offsets require a date condition/)
    assert.match(runtime.generateRuntimeState(tool, state, "result").message, /additional day offsets require a date condition/)
})

test("day adjustments survive save/reload and container duplication", async () => {
    const { catalog, tool, rule, state } = setup()
    rule.text = "Days remaining: ${date.remainingDays}. Original: ${date.remainingDaysBeforeAdjustment}."
    const storage = await seedCatalog(catalog)
    await builder.saveTool(tool)
    const reloaded = JSON.parse(JSON.stringify(storage.data.tools[0]))
    assert.deepEqual(reloaded.elements.find(element => element.id === "result").conditions[0], rule)
    assert.equal(runtime.generateRuntimeState(reloaded, state, "result").outputs.result, "Days remaining: 0. Original: 15.")
    const duplicate = { ...tool, elements: builder.duplicateContainer(tool.elements, "date-group").elements }
    assert.deepEqual(builder.validateTool(duplicate), [])
    const copiedRule = duplicate.elements.find(element => element.id === "result_1").conditions[0]
    assert.equal(copiedRule.additionalOffsetDays, -15)
    assert.equal(runtime.generateRuntimeState(duplicate, { ...state, values: { "move-in_1": "07/25/2022", "move-out_1": "07/10/2023", months_1: "12" } }, "result_1").outputs.result_1, "Days remaining: 0. Original: 15.")
})

test("date templates show remaining days including both offsets and never negative counts", () => {
    const { tool, output, rule, state } = setup()
    rule.operator = "less-than"
    rule.text = "Days still needed: ${date.remainingDays}."
    output.conditions.push({ ...rule, id: "met", operator: "at-least", text: "Complete. Days still needed: ${date.remainingDays}." })
    assert.deepEqual(builder.validateTool(tool), [])
    for (const [date, expected] of [
        ["07/01/2023", "Days still needed: 9."],
        ["07/09/2023", "Days still needed: 1."],
        ["07/10/2023", "Complete. Days still needed: 0."],
        ["07/11/2023", "Complete. Days still needed: 0."],
        ["11/03/2023", "Complete. Days still needed: 0."],
    ]) {
        state.values["move-out"] = date
        const generated = runtime.generateRuntimeState(tool, state, "result")
        assert.equal(generated.message, "")
        assert.equal(generated.outputs.result, expected, date)
        assert.equal(runtime.getCopyValue("result", tool, generated), expected)
    }
    state.values["move-out"] = "07/09/2023"
    state.values.months = "13"
    assert.equal(runtime.generateRuntimeState(tool, state, "result").outputs.result, "Days still needed: 32.")
    state.values.months = "12"
    rule.additionalOffsetDays = undefined
    assert.equal(runtime.generateRuntimeState(tool, state, "result").outputs.result, "Days still needed: 16.")
    rule.additionalOffsetDays = 15
    assert.equal(runtime.generateRuntimeState(tool, state, "result").outputs.result, "Days still needed: 31.")
})

test("remaining days use the same calendar cutoff as fixed date and today comparisons", () => {
    const { tool, rule, state } = setup()
    delete rule.comparisonInputId
    delete rule.offsetInputId
    rule.operator = "less-than"
    rule.text = "Days: ${date.remainingDays}"
    for (const [start, unit, offset, adjustment, actual, expected] of [
        ["2024-01-31", "months", 1, -15, "2024-02-13", 1],
        ["2024-01-31", "months", 1, 0, "2024-02-27", 2],
        ["2024-02-29", "years", 1, -15, "2025-02-12", 1],
        ["2024-03-09", "days", 2, 0, "2024-03-09", 2],
        ["2024-11-02", "days", 2, 0, "2024-11-02", 2],
    ]) {
        Object.assign(rule, { value: start, offsetUnit: unit, offset, additionalOffsetDays: adjustment })
        state.values["move-out"] = actual
        assert.equal(runtime.generateRuntimeState(tool, state, "result").outputs.result, `Days: ${expected}`)
    }
    Object.assign(rule, { value: "today", offsetUnit: "days", offset: 5, additionalOffsetDays: -2 })
    state.values["move-out"] = runtime.localDate()
    assert.equal(runtime.generateRuntimeState(tool, state, "result").outputs.result, "Days: 3")
})

test("remaining days belong to their own date rule and require date-rule text", () => {
    const { tool, output, rule, state } = setup()
    rule.operator = "less-than"
    rule.text = "First: ${date.remainingDays}"
    output.conditions.push({ ...rule, id: "later", additionalOffsetDays: 0, text: "Later: ${date.remainingDays}" })
    state.values["move-out"] = "07/09/2023"
    assert.equal(runtime.generateRuntimeState(tool, state, "result").outputs.result, "First: 1")
    state.values["move-out"] = "07/10/2023"
    assert.equal(runtime.generateRuntimeState(tool, state, "result").outputs.result, "Later: 15")
    const other = { ...output, id: "other-output", conditions: [{ ...rule, id: "other-rule", additionalOffsetDays: 0 }] }
    tool.elements.push(other)
    state.values["move-out"] = "07/09/2023"
    assert.deepEqual(runtime.generateRuntimeState(tool, state, [output.id, other.id]).outputs, { result: "First: 1", "other-output": "First: 16" })
    output.generatedText.default = "Days: ${date.remainingDays}"
    assert.throws(() => builder.createSavedTool(tool), /only available in text for a date condition/)
    output.generatedText.default = "No match"
    Object.assign(rule, { inputId: "months", comparisonInputId: undefined, offsetInputId: undefined, additionalOffsetDays: undefined, value: "12" })
    assert.throws(() => builder.createSavedTool(tool), /only available in text for a date condition/)
    rule.inputId = "move-out"
    rule.calculation = { operation: "sum", inputIds: ["months", "months"] }
    assert.throws(() => builder.createSavedTool(tool), /only available in text for a date condition/)
})

test("missing or invalid date operands preserve results instead of displaying zero remaining days", () => {
    const { tool, rule, state } = setup()
    rule.operator = "less-than"
    rule.text = "Days: ${date.remainingDays} / ${date.remainingDaysBeforeAdjustment}"
    state.values["move-out"] = "07/09/2023"
    state.outputs.result = "Previous result"
    for (const [id, value] of [["move-in", ""], ["move-out", ""], ["months", ""], ["move-in", "02/30/2023"], ["move-out", "invalid"], ["months", "12.5"]]) {
        const result = runtime.generateRuntimeState(tool, { ...state, values: { ...state.values, [id]: value } }, "result")
        assert.ok(result.message)
        assert.deepEqual(result.outputs, state.outputs)
    }
    const input = { ...builder.createElement("Text input", tool), id: "note", variableName: "note", textCase: "none" }
    tool.elements.push(input)
    rule.text = "${note} / ${date.remainingDays} / ${date.remainingDaysBeforeAdjustment}"
    state.values.note = "${date.remainingDaysBeforeAdjustment}"
    assert.equal(runtime.generateRuntimeState(tool, state, "result").outputs.result, "${date.remainingDaysBeforeAdjustment} / 1 / 16")
})

test("original shortfall stays positive when the grace allowance makes a date rule match", () => {
    const { tool, output, rule, state } = setup()
    rule.text = "Original: ${date.remainingDaysBeforeAdjustment}. Adjusted: ${date.remainingDays}."
    output.conditions.unshift({ ...rule, id: "full-requirement", additionalOffsetDays: undefined, text: "Full requirement met." })
    state.values["move-in"] = "10/10/2022"
    assert.deepEqual(builder.validateTool(tool), [])
    for (const [date, expected] of [
        ["09/24/2023", "Requirement not met."],
        ["09/25/2023", "Original: 15. Adjusted: 0."],
        ["09/30/2023", "Original: 10. Adjusted: 0."],
        ["10/09/2023", "Original: 1. Adjusted: 0."],
        ["10/10/2023", "Full requirement met."],
    ]) {
        state.values["move-out"] = date
        const generated = runtime.generateRuntimeState(tool, state, "result")
        assert.equal(generated.message, "")
        assert.equal(generated.outputs.result, expected)
        assert.equal(runtime.getCopyValue("result", tool, generated), expected)
    }
    output.conditions = [rule]
    for (const date of ["10/10/2023", "10/11/2023"]) {
        state.values["move-out"] = date
        assert.equal(runtime.generateRuntimeState(tool, state, "result").outputs.result, "Original: 0. Adjusted: 0.")
    }
    rule.operator = "less-than"
    state.values["move-out"] = "09/30/2023"
    for (const adjustment of [undefined, 0, 15]) {
        rule.additionalOffsetDays = adjustment
        assert.equal(runtime.generateRuntimeState(tool, state, "result").outputs.result, `Original: 10. Adjusted: ${10 + (adjustment ?? 0)}.`)
    }
    state.values.months = "13"
    assert.equal(runtime.generateRuntimeState(tool, state, "result").outputs.result, "Original: 41. Adjusted: 56.")
})

test("original remaining days retain the main calendar offset for fixed dates and today", () => {
    const { tool, rule, state } = setup()
    delete rule.comparisonInputId
    delete rule.offsetInputId
    rule.operator = "not-equals"
    rule.text = "${date.remainingDaysBeforeAdjustment} / ${date.remainingDays}"
    for (const [start, unit, offset, adjustment, actual, expected] of [
        ["2024-01-31", "months", 1, -15, "2024-02-20", "9 / 0"],
        ["2024-01-31", "months", 1, 15, "2024-03-01", "0 / 14"],
        ["2024-02-29", "years", 1, -15, "2025-02-20", "8 / 0"],
        ["2024-07-01", "days", 12, -15, "2024-07-05", "8 / 0"],
        ["today", "days", 5, -2, runtime.localDate(), "5 / 3"],
    ]) {
        Object.assign(rule, { value: start, offsetUnit: unit, offset, additionalOffsetDays: adjustment })
        state.values["move-out"] = actual
        assert.equal(runtime.generateRuntimeState(tool, state, "result").outputs.result, expected)
    }
})

test("original remaining days are only accepted in date-rule text", () => {
    const { tool, output, rule } = setup()
    const placeholder = "${date.remainingDaysBeforeAdjustment}"
    output.generatedText.default = placeholder
    assert.throws(() => builder.createSavedTool(tool), /date.remainingDaysBeforeAdjustment.*only available in text for a date condition/)
    output.generatedText.default = "No match"
    rule.text = placeholder
    assert.doesNotThrow(() => builder.createSavedTool(tool))
    Object.assign(rule, { inputId: "months", comparisonInputId: undefined, offsetInputId: undefined, additionalOffsetDays: undefined, value: "12" })
    assert.throws(() => builder.createSavedTool(tool), /date.remainingDaysBeforeAdjustment.*only available in text for a date condition/)
    rule.inputId = "move-out"
    rule.calculation = { operation: "sum", inputIds: ["months", "months"] }
    assert.throws(() => builder.createSavedTool(tool), /date.remainingDaysBeforeAdjustment.*only available in text for a date condition/)
})
