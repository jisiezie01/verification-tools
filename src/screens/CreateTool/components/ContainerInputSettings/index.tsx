import InputToggle from "../../../../components/InputToggle"
import InputSetting from "../InputSetting"
import InputDateLimit from "../InputDateLimit"
import ContainerRadioOptions from "../ContainerRadioOptions"
import { TEXT_CASE_OPTIONS } from "./data"
import type { ContainerInputSettingsProps } from "./types"

const ContainerInputSettings = ({ element, elements, onChange, className = "" }: ContainerInputSettingsProps) => {
    return <div className={`space-y-4 ${className}`}>
        <InputSetting label="Variable name" value={element.variableName} onChange={variableName => onChange({ ...element, variableName })} hint="Use letters, numbers, and underscores. Renaming updates existing templates." />
        <InputSetting label="Label" value={element.label} onChange={label => onChange({ ...element, label })} />
        <InputToggle label="Show label above input" checked={element.showLabel} onChange={showLabel => onChange({ ...element, showLabel })} />
        {element.type !== "Radio button" && element.type !== "Date input" && <InputSetting label="Placeholder" value={element.placeholder} onChange={placeholder => onChange({ ...element, placeholder })} />}
        {(element.type === "Text input" || element.type === "Name input") && <InputSetting label="Text formatting" kind="select" value={element.textCase} options={TEXT_CASE_OPTIONS} onChange={textCase => onChange({ ...element, textCase: textCase === "pascal" ? "pascal" : "none" })} hint="Capitalizes words while preserving spaces: jane doe becomes Jane Doe." />}
        {element.type === "Number input" && <><div className="grid grid-cols-2 gap-3"><InputSetting label="Minimum number" kind="number" step="any" value={element.min ?? ""} placeholder="No minimum" onChange={value => onChange({ ...element, min: value === "" ? undefined : Number(value) })} /><InputSetting label="Maximum number" kind="number" step="any" value={element.max ?? ""} placeholder="No maximum" onChange={value => onChange({ ...element, max: value === "" ? undefined : Number(value) })} /></div><InputSetting label="Step" kind="number" step="any" min={0.000001} value={element.step} onChange={step => onChange({ ...element, step: Number(step) })} /></>}
        {(element.type === "Email input" || element.type === "Phone input") && <><p className="rounded-xl bg-blue-50/70 p-3 text-xs leading-5 text-blue-700">{element.type === "Phone input" ? "Formats up to 10 digits as (123) 456-7890. Invalid entries get a red border and an error below." : "Invalid email addresses get a red border and an error below the input."}</p><InputSetting label="Validation message" value={element.validation.message} onChange={message => {
            if (element.type === "Email input") onChange({ ...element, validation: { kind: "email", message } })
            else onChange({ ...element, validation: { kind: "phone", message } })
        }} /></>}
        {"copyButton" in element && <div className="space-y-3 border-t border-slate-200/70 pt-4"><InputToggle label="Paired copy button" checked={element.copyButton.enabled} onChange={enabled => onChange({ ...element, copyButton: { ...element.copyButton, enabled } })} />{element.copyButton.enabled && <><InputSetting label="Copy button text" value={element.copyButton.text} onChange={text => onChange({ ...element, copyButton: { ...element.copyButton, text } })} /><InputToggle label="Copy confirmation alert" checked={element.copyButton.confirmCopy} onChange={confirmCopy => onChange({ ...element, copyButton: { ...element.copyButton, confirmCopy } })} />{element.copyButton.confirmCopy && <InputSetting label="Copy confirmation message" value={element.copyButton.confirmationMessage} onChange={confirmationMessage => onChange({ ...element, copyButton: { ...element.copyButton, confirmationMessage } })} />}</>}</div>}
        {element.type === "Date input" && <><InputToggle label="Paired Today button" checked={element.todayButton.enabled} onChange={enabled => onChange({ ...element, todayButton: { ...element.todayButton, enabled } })} />{element.todayButton.enabled && <InputSetting label="Today button text" value={element.todayButton.text} onChange={text => onChange({ ...element, todayButton: { ...element.todayButton, text } })} />}<InputDateLimit label="Earliest date" limit={element.min} onChange={min => onChange({ ...element, min })} /><InputDateLimit label="Latest date" limit={element.max} onChange={max => onChange({ ...element, max })} /><p className="text-xs leading-5 text-slate-500">Current-date limits are evaluated when the tool is used. Today fills the local current date within these limits.</p></>}
        {element.type === "Radio button" && <ContainerRadioOptions element={element} elements={elements} onChange={onChange} />}
    </div>
}
export default ContainerInputSettings
