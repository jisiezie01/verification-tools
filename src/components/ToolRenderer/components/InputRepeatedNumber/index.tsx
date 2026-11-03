import { useId } from "react"
import Button from "../../../Button"
import InputText from "../../../InputText"
import { numberInputEntries, numberInputError, numberInputLabel, numberInputValue } from "../../../../data/toolNumberInputs/functions"
import type { InputRenderedElementProps } from "../InputRenderedElement/types"

const InputRepeatedNumber = ({ element, state, onInput, onBlur, className = "" }: InputRenderedElementProps) => {
    const id = useId()
    if (element.type !== "Number input") return null
    const raw = state.values[element.id] ?? ""
    const entries = numberInputEntries(element, raw)
    const error = state.errors[element.id]
    const total = numberInputError(element, raw) ? "" : numberInputValue(element, raw)
    const focusField = (index: number) => requestAnimationFrame(() => document.getElementById(`${id}-${index}`)?.focus())
    return <div className={`min-w-[180px] space-y-3 ${className}`} role="group" aria-label={element.label || element.variableName}>
        {entries.map((value, index) => <div key={index} className="space-y-2">
            {element.showLabel && <label htmlFor={`${id}-${index}`} className="block text-sm font-medium text-slate-700">{numberInputLabel(element, index)}</label>}
            <div className="flex items-start gap-2">
                <InputText id={`${id}-${index}`} type="number" inputMode="decimal" value={value} min={element.min} max={element.max} step={element.step}
                    placeholder={element.placeholder} aria-label={!element.showLabel ? numberInputLabel(element, index) : undefined}
                    aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined}
                    onChange={event => onInput(element, JSON.stringify(entries.map((entry, position) => position === index ? event.target.value : entry)))}
                    onBlur={() => onBlur(element)} />
                {entries.length > 1 && <Button className="shrink-0" aria-label={`Remove ${numberInputLabel(element, index)}`} onClick={() => {
                    onInput(element, JSON.stringify(entries.filter((_entry, position) => position !== index)))
                    focusField(Math.min(index, entries.length - 2))
                }}>Remove</Button>}
            </div>
        </div>)}
        <Button onClick={() => {
            onInput(element, JSON.stringify([...entries, ""]))
            focusField(entries.length)
        }}>{element.repeatable?.buttonText || "Add field"}</Button>
        {error && <p id={`${id}-error`} role="alert" className="text-xs leading-5 text-red-600">{error}</p>}
    </div>
}
export default InputRepeatedNumber
