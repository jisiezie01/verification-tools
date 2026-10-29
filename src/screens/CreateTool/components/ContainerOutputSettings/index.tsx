import { useState } from "react"
import InputSetting from "../InputSetting"
import Button from "../../../../components/Button"
import InputToggle from "../../../../components/InputToggle"
import { isInputElement, outputIdError } from "../../functions"
import InputTemplate from "../InputTemplate"
import ContainerConditionRule from "../ContainerConditionRule"
import { createCondition, moveCondition } from "./functions"
import type { ContainerOutputSettingsProps } from "./types"

const ContainerOutputSettings = ({ element, elements, sharedInputs = [], onChange, className = "" }: ContainerOutputSettingsProps) => {
    const [idDraft, setIdDraft] = useState(element.id)
    const idError = outputIdError(elements, element.id, idDraft.trim())
    const inputs = [...elements.filter(isInputElement), ...sharedInputs]
    const eligible = inputs.filter(input => input.type === "Number input" || input.type === "Date input" || input.type === "Radio button")
    return <div className={`space-y-5 ${className}`}>
        <div className="space-y-2">
            <InputSetting label="Generated text ID" value={idDraft} onChange={setIdDraft} hint="Use a unique ID without spaces. Generate and copy links update when you apply it." />
            {idError && <p role="alert" className="text-xs text-red-600">{idError}</p>}
            <Button className="w-full text-xs" disabled={!!idError || idDraft.trim() === element.id} onClick={() => onChange({ ...element, id: idDraft.trim() }, element.id)}>Apply ID</Button>
        </div>
        <InputToggle label="Hide until generated" checked={element.initiallyHidden} onChange={initiallyHidden => onChange({ ...element, initiallyHidden })} />
        <InputTemplate label="Default generated text" value={element.generatedText.default} inputs={inputs} onChange={text => onChange({ ...element, generatedText: { ...element.generatedText, default: text } })} />
        {!!sharedInputs.length && <p className="text-xs leading-5 text-slate-500">Variables starting with global. come from other Global tools in this category. Their tools must be on the board when generating text.</p>}
        <section className="space-y-3 border-t border-slate-200/70 pt-4"><h3 className="text-xs font-semibold text-slate-700">Conditional text</h3><p className="text-xs leading-5 text-slate-500">The first matching rule supplies the text. If none match, the default text is used. Generate asks for missing values needed to evaluate a rule or fill the selected text.</p>
            {element.conditions.map((rule, index) => <ContainerConditionRule key={rule.id} rule={rule} index={index} count={element.conditions.length} inputs={inputs} onChange={updated => onChange({ ...element, conditions: element.conditions.map(candidate => candidate.id === updated.id ? updated : candidate) })} onDelete={() => onChange({ ...element, conditions: element.conditions.filter(candidate => candidate.id !== rule.id) })} onMove={direction => onChange({ ...element, conditions: moveCondition(element.conditions, index, direction) })} />)}
            <Button className="w-full text-xs" disabled={!eligible.length} onClick={() => onChange({ ...element, conditions: [...element.conditions, createCondition(eligible[0])] })}>Add condition</Button>
            {!eligible.length && <p className="text-xs leading-5 text-slate-400">Add a number input, date input, or radio group to create a condition.</p>}
        </section>
    </div>
}
export default ContainerOutputSettings
