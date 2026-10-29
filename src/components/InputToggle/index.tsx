import type { InputToggleProps } from "./types"

const InputToggle = ({ label, checked, onChange, description, className = "" }: InputToggleProps) => {
    return <label className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/80 bg-white/45 p-3 ${className}`}><span className="text-xs font-medium text-slate-700">{label}{description && <span className="mt-1 block text-xs font-normal leading-5 text-slate-500">{description}</span>}</span><input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} className="size-4 shrink-0 cursor-pointer accent-blue-600" /></label>
}
export default InputToggle
