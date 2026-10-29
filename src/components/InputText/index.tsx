import type { InputTextProps } from "./types"

const InputText = ({ className = "", ...props }: InputTextProps) => {
    return <input className={`min-w-0 w-full rounded-xl border border-slate-200/80 bg-white/65 px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none backdrop-blur-xl placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 aria-invalid:border-red-500 aria-invalid:focus:ring-red-100 ${className}`} type="text" {...props} />
}

export default InputText
