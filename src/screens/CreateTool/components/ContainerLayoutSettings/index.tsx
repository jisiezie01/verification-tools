import InputSetting from "../InputSetting"
import { getDescendantIds } from "../../functions"
import { DIRECTIONS, JUSTIFY_OPTIONS, ORIENTATIONS } from "./data"
import type { ContainerLayoutSettingsProps } from "./types"

const ContainerLayoutSettings = ({ element, elements, onChange, className = "" }: ContainerLayoutSettingsProps) => {
    const descendants = getDescendantIds(elements, element.id)
    const radios = elements.filter(candidate => candidate.type === "Radio button").filter(candidate => !descendants.has(candidate.id))
    const radio = element.type === "Container" ? radios.find(candidate => candidate.id === element.visibility?.inputId) : undefined
    return <div className={`space-y-4 ${className}`}>{element.type === "Container" ? <>
        <InputSetting label="Flex direction" kind="select" value={element.direction} options={DIRECTIONS} onChange={direction => onChange({ ...element, direction: direction === "row" ? "row" : "column" })} />
        <InputSetting label="Justify content" kind="select" value={element.justifyContent ?? (element.direction === "row" ? "space-between" : "flex-start")} options={JUSTIFY_OPTIONS} onChange={value => onChange({ ...element, justifyContent: value === "space-between" ? "space-between" : "flex-start" })} />
        <div className="grid grid-cols-2 gap-3"><InputSetting label="Padding (px)" kind="number" min={0} value={element.padding} onChange={padding => onChange({ ...element, padding: Math.max(0, Number(padding)) })} /><InputSetting label="Gap (px)" kind="number" min={0} value={element.gap} onChange={gap => onChange({ ...element, gap: Math.max(0, Number(gap)) })} /></div>
        <div className="space-y-3 border-t border-slate-200/70 pt-4">
            <InputSetting label="Container visibility" kind="select" value={element.visibility?.mode ?? "always"} options={[{ value: "always", label: "Always show" }, { value: "show", label: "Show when selected" }, { value: "hide", label: "Hide when selected" }]} onChange={mode => onChange({ ...element, visibility: mode === "always" ? undefined : { mode: mode === "hide" ? "hide" : "show", inputId: element.visibility?.inputId ?? "", value: element.visibility?.value ?? "" } })} />
            {element.visibility && <>
                <InputSetting label="Visibility radio group" kind="select" value={element.visibility.inputId} options={[{ value: "", label: "Choose a radio group" }, ...radios.map(candidate => ({ value: candidate.id, label: `${candidate.label} (${candidate.variableName})` }))]} onChange={inputId => onChange({ ...element, visibility: { ...element.visibility!, inputId, value: "" } })} />
                <InputSetting label="Visibility selected option" kind="select" value={element.visibility.value} options={[{ value: "", label: "Choose an option" }, ...(radio?.type === "Radio button" ? radio.options.map(option => ({ value: option.value, label: option.label })) : [])]} onChange={value => onChange({ ...element, visibility: { ...element.visibility!, value } })} />
                {!radios.length && <p className="text-xs leading-5 text-slate-500">Add a radio group outside this container to control its visibility.</p>}
                <p className="text-xs leading-5 text-slate-500">Applies to this container and everything inside it when using the tool. Contents stay visible while editing. Hidden fields keep their values.</p>
            </>}
        </div>
    </> : <InputSetting label="Orientation" kind="select" value={element.orientation} options={ORIENTATIONS} onChange={orientation => onChange({ ...element, orientation: orientation === "vertical" ? "vertical" : "horizontal" })} />}</div>
}
export default ContainerLayoutSettings
