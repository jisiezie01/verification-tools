import { generatedTextIds } from "../../../../data/toolLinks/functions"
import InputToggle from "../../../../components/InputToggle"
import { getElementName, isInputElement } from "../../functions"
import InputSetting from "../InputSetting"
import { COPY_VISIBILITY_OPTIONS } from "./data"
import type { ContainerButtonSettingsProps } from "./types"

const ContainerButtonSettings = ({ element, elements, onChange, className = "" }: ContainerButtonSettingsProps) => {
    const targets = elements.filter(candidate => candidate.type === "Output text" || (element.type === "Copy button" && isInputElement(candidate) && candidate.type !== "Radio button"))
    return <div className={`space-y-4 ${className}`}>
        <InputSetting label="Button text" value={element.text} onChange={text => onChange({ ...element, text })} />
        <div className="grid grid-cols-2 gap-3"><InputSetting label="Text color" kind="color" value={element.style.color ?? "#ffffff"} onChange={color => onChange({ ...element, style: { ...element.style, color } })} /><InputSetting label="Background color" kind="color" value={element.style.backgroundColor ?? "#3b82f6"} onChange={backgroundColor => onChange({ ...element, style: { ...element.style, backgroundColor } })} /></div>
        {element.type === "Generate button" && <fieldset className="space-y-3">
            <legend className="mb-2 text-xs font-semibold text-slate-600">Linked generated text</legend>
            {targets.map(target => <InputToggle key={target.id} className="[&>span]:min-w-0 [&>span]:break-all" label={target.id} checked={generatedTextIds(element.link).includes(target.id)} onChange={checked => onChange({ ...element, link: checked ? [...generatedTextIds(element.link), target.id] : generatedTextIds(element.link).filter(id => id !== target.id) })} />)}
            <p className="text-xs leading-5 text-slate-500">{targets.length ? "Select one or more generated text elements. All selected outputs generate together." : "Add a generated text element to the canvas first."}</p>
        </fieldset>}
        {element.type === "Copy button" && <InputSetting label="Copy from" kind="select" value={element.link} options={[{ value: "", label: "Choose an element" }, ...targets.map(target => ({ value: target.id, label: `${getElementName(target)} (${target.id})` }))]} hint="The linked value will be copied to the clipboard." onChange={link => onChange({ ...element, link, visibility: elements.find(target => target.id === link)?.type === "Output text" ? "when-target-visible" : "always" })} />}
        {element.type === "Copy button" && <>
            <InputSetting label="Visibility" kind="select" value={element.visibility} options={COPY_VISIBILITY_OPTIONS} onChange={visibility => onChange({ ...element, visibility: visibility === "always" ? "always" : "when-target-visible" })} />
            <InputToggle label="Show confirmation alert" checked={element.confirmCopy} onChange={confirmCopy => onChange({ ...element, confirmCopy })} />
            {element.confirmCopy && <InputSetting label="Confirmation message" value={element.confirmationMessage} onChange={confirmationMessage => onChange({ ...element, confirmationMessage })} />}
        </>}
        {element.type === "Reset button" && <p className="rounded-xl bg-red-50/70 p-3 text-xs leading-5 text-red-700">Clears all input values and radio selections, then clears and hides every generated text element in this tool.</p>}
    </div>
}
export default ContainerButtonSettings
