import type { InputDateProps } from "./types"

const InputDate = ({ className = "", ...props }: InputDateProps) => {
    return <input className={`min-w-0 w-full rounded-xl border border-slate-200/80 bg-white/65 px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none backdrop-blur-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-100 ${className}`} type="date" {...props} />
}

export default InputDate
