import type { InputRadioProps } from "./types"

const InputRadio = ({ children = null, className = "", ...props }: InputRadioProps) => {
    return (
        <label className={`inline-flex items-center gap-2 text-sm text-slate-700 ${className}`}>
            <input className="size-4 accent-slate-900" type="radio" {...props} />
            {children}
        </label>
    )
}

export default InputRadio
