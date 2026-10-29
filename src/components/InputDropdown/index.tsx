import type { InputDropdownProps } from "./types"

const InputDropdown = ({ className = "", children, ...props }: InputDropdownProps) => {
    return <select className={`min-w-0 w-full rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 ${className}`} {...props}>{children}</select>
}
export default InputDropdown
