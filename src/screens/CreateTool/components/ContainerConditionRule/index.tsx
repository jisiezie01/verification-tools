import type { TextConditionType } from "../../../../types"
import Button from "../../../../components/Button"
import InputToggle from "../../../../components/InputToggle"
import { CONDITION_OPERATORS } from "../../data"
import { CALCULATION_OPERATIONS } from "../../../../data/toolCalculations/data"
import { CONDITION_SOURCES } from "./data"
import { calculationExpression, moveCalculationInput } from "./functions"
import InputSetting from "../InputSetting"
import InputTemplate from "../InputTemplate"
import type { ContainerConditionRuleProps } from "./types"

const ContainerConditionRule = ({ rule, index, count, inputs, onChange, onDelete, onMove, className = "" }: ContainerConditionRuleProps) => {
    const eligible = inputs.filter(input => input.type === "Number input" || input.type === "Date input" || input.type === "Radio button")
    const input = eligible.find(candidate => candidate.id === rule.inputId)
    const numbers = inputs.filter(candidate => candidate.type === "Number input")
    const calculation = rule.calculation
    const inputType = calculation ? "Number input" : input?.type
    const numberOptions = [{ value: "", label: "Choose a number input" }, ...numbers.map(candidate => ({ value: candidate.id, label: `${candidate.variableName} (${candidate.label})` }))]
    return <section className={`space-y-3 rounded-2xl border border-slate-200/80 bg-white/45 p-3 ${className}`}>
        <div className="flex items-center justify-between"><h4 className="text-xs font-semibold text-slate-700">Rule {index + 1}</h4><Button variant="ghost" className="px-2 py-1 text-xs" onClick={onDelete} aria-label={`Remove rule ${index + 1}`}>Remove</Button></div>
        <InputSetting label="Condition source" kind="select" value={calculation ? "calculation" : "variable"} options={CONDITION_SOURCES} onChange={source => onChange({ ...rule, inputId: "", calculation: source === "calculation" ? { operation: "sum", inputIds: [numbers[0]?.id ?? "", numbers[1]?.id ?? ""] } : undefined, comparisonInputId: undefined, offset: undefined, offsetInputId: undefined, operator: "equals", value: "" })} />
        {calculation ? <div className="space-y-3 rounded-xl bg-blue-50/60 p-3">
            <InputSetting label="Operation" kind="select" value={calculation.operation} options={[...CALCULATION_OPERATIONS]} onChange={operation => onChange({ ...rule, calculation: { ...calculation, operation: operation as typeof calculation.operation } })} />
            {calculation.inputIds.map((id, position) => <div key={position} className="space-y-2">
                <InputSetting label={`Number ${position + 1}`} kind="select" value={id} options={numberOptions} onChange={inputId => onChange({ ...rule, calculation: { ...calculation, inputIds: calculation.inputIds.map((current, currentPosition) => currentPosition === position ? inputId : current) } })} />
                <div className="flex flex-wrap gap-1">
                    <Button variant="ghost" className="px-2 py-1 text-xs" aria-label={`Move number ${position + 1} earlier`} disabled={position === 0} onClick={() => onChange({ ...rule, calculation: { ...calculation, inputIds: moveCalculationInput(calculation.inputIds, position, -1) } })}>Earlier</Button>
                    <Button variant="ghost" className="px-2 py-1 text-xs" aria-label={`Move number ${position + 1} later`} disabled={position === calculation.inputIds.length - 1} onClick={() => onChange({ ...rule, calculation: { ...calculation, inputIds: moveCalculationInput(calculation.inputIds, position, 1) } })}>Later</Button>
                    <Button variant="ghost" className="px-2 py-1 text-xs" aria-label={`Remove number ${position + 1}`} disabled={calculation.inputIds.length <= 2} onClick={() => onChange({ ...rule, calculation: { ...calculation, inputIds: calculation.inputIds.filter((_, currentPosition) => currentPosition !== position) } })}>Remove</Button>
                </div>
            </div>)}
            <Button className="w-full text-xs" disabled={!numbers.length} onClick={() => onChange({ ...rule, calculation: { ...calculation, inputIds: [...calculation.inputIds, ""] } })}>Add number input</Button>
            <p className="break-words font-mono text-xs text-blue-800">{calculationExpression(calculation, numbers)}</p>
            <p className="text-xs leading-5 text-slate-500">Calculates from first to last. Difference subtracts each later number; quotient divides by each later number. All selected numbers are required.</p>
            {!numbers.length && <p className="text-xs text-slate-500">Add number inputs to this tool, or use a Global tool in this category.</p>}
        </div> : <InputSetting label="When variable" kind="select" value={rule.inputId} options={[{ value: "", label: "Choose a variable" }, ...eligible.map(candidate => ({ value: candidate.id, label: candidate.variableName.startsWith("global.") ? `${candidate.variableName} — ${candidate.label}` : candidate.variableName }))]} onChange={inputId => { const chosen = eligible.find(candidate => candidate.id === inputId); onChange({ ...rule, inputId, comparisonInputId: undefined, offset: undefined, offsetInputId: undefined, operator: "equals", value: chosen?.type === "Radio button" ? chosen.options[0]?.value ?? "" : "" }) }} />}
        <InputSetting label="Comparison" kind="select" value={rule.operator} options={inputType === "Radio button" ? CONDITION_OPERATORS.slice(0, 2) : CONDITION_OPERATORS} onChange={operator => onChange({ ...rule, operator: operator as TextConditionType["operator"] })} />
        {(inputType === "Date input" || inputType === "Number input") && <InputSetting label="Compare against" kind="select" value={rule.comparisonInputId === undefined ? "fixed" : "variable"} options={[{ value: "fixed", label: "Specific value" }, { value: "variable", label: "Another variable" }]} onChange={mode => onChange({ ...rule, comparisonInputId: mode === "variable" ? "" : undefined, value: "", offset: undefined, offsetInputId: undefined })} />}
        {!calculation && input?.type === "Radio button" ? <InputSetting label="Selected option" kind="select" value={rule.value} options={[{ value: "", label: "Choose an option" }, ...input.options.map(option => ({ value: option.value, label: option.label }))]} onChange={value => onChange({ ...rule, value })} />
            : rule.comparisonInputId !== undefined ? <InputSetting label={inputType === "Date input" ? "Comparison date" : "Comparison number"} kind="select" value={rule.comparisonInputId} options={[{ value: "", label: "Choose a variable" }, ...eligible.filter(candidate => candidate.type === inputType && (calculation || candidate.id !== input?.id)).map(candidate => ({ value: candidate.id, label: `${candidate.variableName} (${candidate.label})` }))]} onChange={comparisonInputId => onChange({ ...rule, comparisonInputId })} />
                : inputType === "Date input" ? <><InputToggle label="Compare with current date" checked={rule.value === "today"} onChange={enabled => onChange({ ...rule, value: enabled ? "today" : "" })} />{rule.value !== "today" && <InputSetting label="Comparison date" kind="date" value={rule.value} onChange={value => onChange({ ...rule, value })} />}</>
                    : <InputSetting label="Comparison number" kind="number" step="any" value={rule.value} onChange={value => onChange({ ...rule, value })} />}
        {inputType === "Date input" && <><InputSetting label="Offset unit" kind="select" value={rule.offsetUnit ?? "days"} options={[{ value: "days", label: "Days" }, { value: "months", label: "Months" }, { value: "years", label: "Years" }]} onChange={offsetUnit => onChange({ ...rule, offsetUnit: offsetUnit as NonNullable<TextConditionType["offsetUnit"]> })} /><InputSetting label={`Offset (${rule.offsetUnit ?? "days"}) source`} kind="select" value={rule.offsetInputId === undefined ? "fixed" : "variable"} options={[{ value: "fixed", label: `Specific number of ${rule.offsetUnit ?? "days"}` }, { value: "variable", label: "Number input" }]} onChange={mode => onChange({ ...rule, offset: undefined, offsetInputId: mode === "variable" ? "" : undefined })} />{rule.offsetInputId !== undefined
            ? <InputSetting label={`Offset (${rule.offsetUnit ?? "days"}) variable`} kind="select" value={rule.offsetInputId} options={[{ value: "", label: "Choose a number input" }, ...numbers.map(candidate => ({ value: candidate.id, label: candidate.variableName.startsWith("global.") ? `${candidate.variableName} — ${candidate.label}` : candidate.variableName }))]} onChange={offsetInputId => onChange({ ...rule, offsetInputId })} />
            : <InputSetting label={`Offset (${rule.offsetUnit ?? "days"})`} kind="number" step={1} value={rule.offset === undefined ? "" : String(rule.offset)} placeholder="0" hint={`Add ${rule.offsetUnit ?? "days"} to the comparison date; negative values move earlier.`} onChange={value => onChange({ ...rule, offset: value === "" ? undefined : Number(value) })} />}</>}
        {inputType === "Number input" && <InputSetting label="Offset" kind="number" step="any" value={rule.offset === undefined ? "" : String(rule.offset)} placeholder="0" hint="Add this amount to the comparison number. Leave blank for no offset." onChange={value => onChange({ ...rule, offset: value === "" ? undefined : Number(value) })} />}
        <InputTemplate label="Use this text when matched" value={rule.text} inputs={inputs} calculationResult={!!calculation} onChange={text => onChange({ ...rule, text })} />
        {calculation && <p className="text-xs leading-5 text-slate-500">Insert ${"{calc.result}"} above to include this rule’s calculated number in its generated text.</p>}
        <div className="flex gap-2"><Button className="flex-1 px-2 text-xs" disabled={index === 0} onClick={() => onMove(-1)}>Move earlier</Button><Button className="flex-1 px-2 text-xs" disabled={index === count - 1} onClick={() => onMove(1)}>Move later</Button></div>
    </section>
}
export default ContainerConditionRule
