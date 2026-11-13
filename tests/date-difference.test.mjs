import assert from "node:assert/strict"
import test from "node:test"
import { importTypeScript } from "./import-typescript.mjs"
import { makeDateOffsetCatalog } from "./fixtures/date-offsets.mjs"

const runtime = await importTypeScript("src/components/ToolRenderer/functions.ts")
const builder = await importTypeScript("src/screens/CreateTool/functions.ts")
const { calculateExpression, analyzeExpression } = await importTypeScript("src/data/toolCalculations/expression.ts")
const { getSharedScope } = await importTypeScript("src/data/toolVariables/functions.ts")
const expression = unit => `date.diff(start_date, end_date, "${unit}")`
const calculate = (start, end, unit) => calculateExpression(expression(unit), new Map([["start_date", start], ["end_date", end]]), new Set(), new Set(["start_date", "end_date"]))
function setup() {
    const catalog = makeDateOffsetCatalog()
    const tool = catalog.tools[0]
    tool.elements.find(element => element.id === "move-in").variableName = "start_date"
    tool.elements.find(element => element.id === "move-out").variableName = "end_date"
    const output = tool.elements.find(element => element.id === "result")
    output.conditions = []
    output.generatedText.default = ['days', 'weeks', 'months', 'years'].map(unit => '${' + expression(unit) + '}').join(' / ')
    return { catalog, tool, output }
}

test("date differences use midnight calendar days, fractional weeks and completed clamped periods", () => {
    for (const [start, end, unit, expected] of [
        ["2024-03-09", "2024-03-11", "days", 2],
        ["11/02/2024", "11/04/2024", "days", 2],
        ["2024-02-28", "2024-03-01", "days", 2],
        ["2024-01-01", "2024-01-11", "weeks", 10 / 7],
        ["2023-01-31", "2023-02-28", "months", 1],
        ["2024-01-31", "2024-02-28", "months", 0],
        ["2024-01-31", "2024-02-29", "months", 1],
        ["2024-01-31", "2024-03-30", "months", 1],
        ["2024-02-29", "2025-02-28", "years", 1],
        ["2024-02-29", "2025-02-27", "years", 0],
        ["2020-05-10", "2024-05-09", "years", 3],
        ["0099-12-31", "0100-01-31", "months", 1],
    ]) {
        assert.equal(calculate(start, end, unit).value, expected, `${start} to ${end} in ${unit}`)
        assert.equal(calculate(end, start, unit).value, -expected || 0)
        assert.equal(calculate(start, start, unit).value, 0)
    }
})

test("default text generates and copies all four date units; missing and invalid dates preserve results", () => {
    const { tool } = setup()
    const state = { ...runtime.createRuntimeState(tool), values: { "move-in": "01/01/2023", "move-out": "01/01/2024" } }
    const generated = runtime.generateRuntimeState(tool, state, "result")
    assert.equal(generated.message, "")
    assert.equal(generated.outputs.result, `365 / ${365 / 7} / 12 / 1`)
    assert.equal(runtime.getCopyValue("result", tool, generated), generated.outputs.result)
    for (const value of ["", "2024-02-30", "bad", "2024-01-01T23:00:00Z"]) {
        const failed = runtime.generateRuntimeState(tool, { ...generated, values: { ...state.values, "move-out": value } }, "result")
        assert.ok(failed.message)
        assert.ok(failed.errors["move-out"])
        assert.deepEqual(failed.outputs, generated.outputs)
    }
    assert.deepEqual(builder.validateTool(tool), [])
    assert.deepEqual(builder.createSavedTool(tool).elements.find(element => element.id === "result").generatedText, tool.elements.find(element => element.id === "result").generatedText)
})

test("date expressions reject wrong types, unknown inputs, invalid syntax and unsupported units", () => {
    const { tool, output } = setup()
    for (const invalid of ['date.diff(start_date, missing, "days")', 'date.diff(start_date, end_date, "hours")', 'date.diff(start_date, end_date)', 'date.diff(start_date, end_date, days)', 'date.diff(start_date, end_date, "days") + 1', 'date.diff(start_date, end_date, "days"); alert(1)']) {
        output.generatedText.default = '${' + invalid + '}'
        assert.ok(builder.validateTool(tool).length, invalid)
        assert.ok(runtime.outputCalculationError(tool, "result", { "move-in": "2024-01-01", "move-out": "2024-02-01" }), invalid)
    }
    output.generatedText.default = '${date.diff(start_date, end_date, "days")}'
    tool.elements.find(element => element.id === "move-out").type = "Text input"
    assert.ok(builder.validateTool(tool).some(error => error.includes("must be a date input")))
    assert.equal(analyzeExpression("date.diff( global.start_date , end_date , 'weeks' )").inputType, "Date input")
    assert.deepEqual(analyzeExpression('date.diff(start_date, start_date, "days")').variableNames, ["start_date"])
})

test("conditional templates only require date inputs when selected", () => {
    const { tool, output } = setup()
    output.conditions = [{ id: "date", inputId: "months", operator: "equals", value: "1", text: output.generatedText.default }]
    output.generatedText.default = "No dates required"
    const state = { ...runtime.createRuntimeState(tool), values: { months: "0" } }
    assert.equal(runtime.generateRuntimeState(tool, state, "result").outputs.result, "No dates required")
    const needed = runtime.generateRuntimeState(tool, { ...state, values: { months: "1" } }, "result")
    assert.ok(needed.errors["move-in"])
    assert.ok(needed.errors["move-out"])
})

test("Global dates participate in dependency validation and date calculations", () => {
    const { tool, output } = setup()
    const source = { ...tool, id: "shared", isGlobal: true, elements: tool.elements.filter(element => element.type === "Date input").map(element => ({ ...element, toolId: "shared", containerId: undefined })) }
    tool.elements = tool.elements.filter(element => element.type !== "Date input")
    output.generatedText.default = '${date.diff(global.start_date, global.end_date, "days")}'
    assert.deepEqual(builder.validateTool(tool, undefined, [source, tool]), [])
    const scope = getSharedScope(tool, [source, tool], { shared: { "move-in": "2024-01-01", "move-out": "2024-01-15" } })
    assert.equal(runtime.generateRuntimeState(tool, runtime.createRuntimeState(tool), "result", scope).outputs.result, "14")
    assert.match(runtime.generateRuntimeState(tool, runtime.createRuntimeState(tool), "result").message, /shared variable is unavailable/)
    const missing = getSharedScope(tool, [source, tool], { shared: { "move-in": "2024-01-01" } })
    assert.match(runtime.generateRuntimeState(tool, runtime.createRuntimeState(tool), "result", missing).message, /Please enter/)
})

test("renaming and duplication remap date operands without changing literal text or the unit", () => {
    const original = 'start_date ${date.diff(start_date, end_date, "days")} ${date.diff(global.start_date, end_date, "days")}'
    assert.equal(builder.replaceTemplateVariable(original, "start_date", "arrival"), 'start_date ${date.diff(arrival, end_date, "days")} ${date.diff(global.start_date, end_date, "days")}')
    const { tool } = setup()
    const copy = builder.duplicateContainer(tool.elements, "date-group")
    const duplicated = { ...tool, elements: copy.elements }
    assert.deepEqual(builder.validateTool(duplicated), [])
    const output = duplicated.elements.find(element => element.id === "result_1")
    assert.ok(output.generatedText.default.includes('date.diff(start_date_1, end_date_1, "days")'))
    assert.equal(runtime.generateOutput(output.id, duplicated, { "move-in_1": "2023-01-01", "move-out_1": "2024-01-01" }), `365 / ${365 / 7} / 12 / 1`)
})
