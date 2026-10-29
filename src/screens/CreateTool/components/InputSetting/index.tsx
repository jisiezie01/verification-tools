import { useId } from "react"
import InputText from "../../../../components/InputText"
import InputDate from "../../../../components/InputDate"
import InputDropdown from "../../../../components/InputDropdown"
import type { InputSettingProps } from "./types"

const InputSetting = ({ label, value, onChange, kind = "text", options = [], hint, placeholder, min, max, step, rows = 4, className = "" }: InputSettingProps) => {
    const id = useId()
    return <div className={`space-y-2 ${className}`}>
        <label htmlFor={id} className="block text-xs font-semibold text-slate-600">{label}</label>
        {kind === "select" ? <InputDropdown id={id} value={value} onChange={event => onChange(event.target.value)} aria-describedby={hint ? `${id}-hint` : undefined}>{options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</InputDropdown>
            : kind === "textarea" ? <textarea id={id} value={value} onChange={event => onChange(event.target.value)} rows={rows} placeholder={placeholder} aria-describedby={hint ? `${id}-hint` : undefined} className="w-full resize-y rounded-xl border border-slate-200/80 bg-white/70 p-3 text-sm leading-6 text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
                : kind === "date" ? <InputDate id={id} value={value} onChange={event => onChange(event.target.value)} aria-describedby={hint ? `${id}-hint` : undefined} />
                    : <InputText id={id} type={kind} value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} min={min} max={max} step={step} aria-describedby={hint ? `${id}-hint` : undefined} className={kind === "color" ? "h-10 cursor-pointer p-1.5" : ""} />}
        {hint && <p id={`${id}-hint`} className="text-xs leading-5 text-slate-500">{hint}</p>}
    </div>
}
export default InputSetting
