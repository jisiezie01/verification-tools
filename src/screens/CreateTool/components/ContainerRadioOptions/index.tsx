import Button from "../../../../components/Button"
import InputSetting from "../InputSetting"
import { createRadioOption } from "./functions"
import type { ContainerRadioOptionsProps } from "./types"

const ContainerRadioOptions = ({ element, onChange, className = "" }: ContainerRadioOptionsProps) => {
    return <section className={`space-y-3 ${className}`}><h3 className="text-xs font-semibold text-slate-600">Radio options</h3>
        {element.options.map((option, index) => <div key={option.id} className="space-y-3 rounded-2xl border border-slate-200/70 bg-white/40 p-3"><InputSetting label={`Option ${index + 1} label`} value={option.label} onChange={label => onChange({ ...element, options: element.options.map(candidate => candidate.id === option.id ? { ...candidate, label } : candidate) })} /><InputSetting label={`Option ${index + 1} value`} value={option.value} onChange={value => onChange({ ...element, options: element.options.map(candidate => candidate.id === option.id ? { ...candidate, value } : candidate) })} /><Button variant="ghost" className="w-full text-xs" disabled={element.options.length === 1} onClick={() => onChange({ ...element, options: element.options.filter(candidate => candidate.id !== option.id) })}>Remove option {index + 1}</Button></div>)}
        <Button className="w-full text-xs" onClick={() => onChange({ ...element, options: [...element.options, createRadioOption(element.options)] })}>Add radio option</Button>
    </section>
}
export default ContainerRadioOptions
