import { useId, useRef } from "react"
import { insertTemplateVariable } from "./functions"
import type { InputTemplateProps } from "./types"

const InputTemplate = ({ label, value, inputs, onChange, className = "" }: InputTemplateProps) => {
    const id = useId()
    const textarea = useRef<HTMLTextAreaElement>(null)
    return <div className={`space-y-2 ${className}`}>
        <label htmlFor={id} className="text-xs font-semibold text-slate-600">{label}</label>
        <textarea ref={textarea} id={id} value={value} rows={5} onChange={event => onChange(event.target.value)} className="w-full resize-y rounded-xl border border-slate-200/80 bg-white/75 p-3 text-sm leading-6 text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
        <p className="text-[11px] leading-5 text-slate-500">Insert a variable at your cursor, or type its placeholder.</p>
        {inputs.length ? <div className="flex flex-wrap gap-1.5">{inputs.map(input => <button key={input.id} type="button" title={input.label} onClick={() => {
            const result = insertTemplateVariable(value, input.variableName, textarea.current?.selectionStart ?? value.length, textarea.current?.selectionEnd ?? value.length)
            onChange(result.text)
            requestAnimationFrame(() => { textarea.current?.focus(); textarea.current?.setSelectionRange(result.caret, result.caret) })
        }} className="max-w-full break-all rounded-lg border border-blue-100 bg-blue-50/80 px-2 py-1 text-left font-mono text-[10px] text-blue-700 hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-blue-500">{"${" + input.variableName + "}"}</button>)}</div> : <p className="text-xs text-slate-400">Add inputs to make variables available.</p>}
    </div>
}
export default InputTemplate
