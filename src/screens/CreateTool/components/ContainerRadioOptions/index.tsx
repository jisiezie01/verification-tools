import Button from "../../../../components/Button"
import InputSetting from "../InputSetting"
import { RADIO_ALIGN_CONTENT, RADIO_DIRECTIONS, RADIO_JUSTIFY_CONTENT, RADIO_WRAPS } from "./data"
import { createRadioOption } from "./functions"
import type { ContainerRadioOptionsProps } from "./types"

const ContainerRadioOptions = ({ element, onChange, className = "" }: ContainerRadioOptionsProps) => {
    return <section className={`space-y-3 ${className}`}><h3 className="text-xs font-semibold text-slate-600">Radio options</h3>
        <InputSetting label="Flex direction" kind="select" value={element.direction ?? "column"} options={RADIO_DIRECTIONS} onChange={direction => onChange({ ...element, direction: direction as typeof element.direction })} />
        <InputSetting label="Flex wrap" kind="select" value={element.wrap ?? "nowrap"} options={RADIO_WRAPS} onChange={wrap => onChange({ ...element, wrap: wrap as typeof element.wrap })} />
        <InputSetting label="Justify content" kind="select" value={element.justifyContent ?? "flex-start"} options={RADIO_JUSTIFY_CONTENT} onChange={justifyContent => onChange({ ...element, justifyContent })} />
        <InputSetting label="Align content" kind="select" value={element.alignContent ?? "stretch"} options={RADIO_ALIGN_CONTENT} hint="Aligns wrapped lines when there is extra space across the flex direction." onChange={alignContent => onChange({ ...element, alignContent })} />
        <InputSetting label="Gap (px)" kind="number" min={0} value={element.gap ?? 8} onChange={gap => onChange({ ...element, gap: Math.max(0, Number(gap) || 0) })} />
        {element.options.map((option, index) => <div key={option.id} className="space-y-3 rounded-2xl border border-slate-200/70 bg-white/40 p-3"><InputSetting label={`Option ${index + 1} label`} value={option.label} onChange={label => onChange({ ...element, options: element.options.map(candidate => candidate.id === option.id ? { ...candidate, label } : candidate) })} /><InputSetting label={`Option ${index + 1} value`} value={option.value} onChange={value => onChange({ ...element, options: element.options.map(candidate => candidate.id === option.id ? { ...candidate, value } : candidate) })} /><Button variant="ghost" className="w-full text-xs" disabled={element.options.length === 1} onClick={() => onChange({ ...element, options: element.options.filter(candidate => candidate.id !== option.id) })}>Remove option {index + 1}</Button></div>)}
        <Button className="w-full text-xs" onClick={() => onChange({ ...element, options: [...element.options, createRadioOption(element.options)] })}>Add radio option</Button>
    </section>
}
export default ContainerRadioOptions
