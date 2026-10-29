import type { TextConditionType } from "../../../../types"
import Button from "../../../../components/Button"
import InputToggle from "../../../../components/InputToggle"
import { CONDITION_OPERATORS } from "../../data"
import InputSetting from "../InputSetting"
import InputTemplate from "../InputTemplate"
import type { ContainerConditionRuleProps } from "./types"

const ContainerConditionRule = ({ rule, index, count, inputs, onChange, onDelete, onMove, className = "" }: ContainerConditionRuleProps) => {
    const eligible = inputs.filter(input => input.type === "Number input" || input.type === "Date input" || input.type === "Radio button")
    const input = eligible.find(candidate => candidate.id === rule.inputId)
    return <section className={`space-y-3 rounded-2xl border border-slate-200/80 bg-white/45 p-3 ${className}`}>
        <div className="flex items-center justify-between"><h4 className="text-xs font-semibold text-slate-700">Rule {index + 1}</h4><Button variant="ghost" className="px-2 py-1 text-xs" onClick={onDelete} aria-label={`Remove rule ${index + 1}`}>Remove</Button></div>
        <InputSetting label="When variable" kind="select" value={rule.inputId} options={[{ value: "", label: "Choose a variable" }, ...eligible.map(candidate => ({ value: candidate.id, label: candidate.variableName.startsWith("global.") ? `${candidate.variableName} — ${candidate.label}` : candidate.variableName }))]} onChange={inputId => { const chosen = eligible.find(candidate => candidate.id === inputId); onChange({ ...rule, inputId, comparisonInputId: undefined, offset: undefined, operator: "equals", value: chosen?.type === "Radio button" ? chosen.options[0]?.value ?? "" : "" }) }} />
        <InputSetting label="Comparison" kind="select" value={rule.operator} options={input?.type === "Radio button" ? CONDITION_OPERATORS.slice(0, 2) : CONDITION_OPERATORS} onChange={operator => onChange({ ...rule, operator: operator as TextConditionType["operator"] })} />
        {(input?.type === "Date input" || input?.type === "Number input") && <InputSetting label="Compare against" kind="select" value={rule.comparisonInputId === undefined ? "fixed" : "variable"} options={[{ value: "fixed", label: "Specific value" }, { value: "variable", label: "Another variable" }]} onChange={mode => onChange({ ...rule, comparisonInputId: mode === "variable" ? "" : undefined, value: "", offset: undefined })} />}
        {input?.type === "Radio button" ? <InputSetting label="Selected option" kind="select" value={rule.value} options={[{ value: "", label: "Choose an option" }, ...input.options.map(option => ({ value: option.value, label: option.label }))]} onChange={value => onChange({ ...rule, value })} />
            : rule.comparisonInputId !== undefined ? <InputSetting label={input?.type === "Date input" ? "Comparison date" : "Comparison number"} kind="select" value={rule.comparisonInputId} options={[{ value: "", label: "Choose a variable" }, ...eligible.filter(candidate => candidate.type === input?.type && candidate.id !== input.id).map(candidate => ({ value: candidate.id, label: `${candidate.variableName} ? ${candidate.label}` }))]} onChange={comparisonInputId => onChange({ ...rule, comparisonInputId })} />
                : input?.type === "Date input" ? <><InputToggle label="Compare with current date" checked={rule.value === "today"} onChange={enabled => onChange({ ...rule, value: enabled ? "today" : "" })} />{rule.value !== "today" && <InputSetting label="Comparison date" kind="date" value={rule.value} onChange={value => onChange({ ...rule, value })} />}</>
                    : <InputSetting label="Comparison number" kind="number" step="any" value={rule.value} onChange={value => onChange({ ...rule, value })} />}
        {(input?.type === "Date input" || input?.type === "Number input") && <InputSetting label={input.type === "Date input" ? "Offset (days)" : "Offset"} kind="number" step={input.type === "Date input" ? 1 : "any"} value={rule.offset === undefined ? "" : String(rule.offset)} placeholder="0" hint={input.type === "Date input" ? "Add days to the comparison date, e.g. 60 for 60 days after, or -60 for 60 days before." : "Add this amount to the comparison number. Leave blank for no offset."} onChange={value => onChange({ ...rule, offset: value === "" ? undefined : Number(value) })} />}
        <InputTemplate label="Use this text when matched" value={rule.text} inputs={inputs} onChange={text => onChange({ ...rule, text })} />
        <div className="flex gap-2"><Button className="flex-1 px-2 text-xs" disabled={index === 0} onClick={() => onMove(-1)}>Move earlier</Button><Button className="flex-1 px-2 text-xs" disabled={index === count - 1} onClick={() => onMove(1)}>Move later</Button></div>
    </section>
}
export default ContainerConditionRule
