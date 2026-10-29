import { useId } from "react"
import Button from "../../../Button"
import InputText from "../../../InputText"
import InputDate from "../../../InputDate"
import InputRadio from "../../../InputRadio"
import { dateBoundary, inputError, localDate } from "../../functions"
import { COPY_BUTTON_STYLE } from "./data"
import type { InputRenderedElementProps } from "./types"

const InputRenderedElement = ({ element, state, onInput, onBlur, onCopy, className = "" }: InputRenderedElementProps) => {
    const id = useId()
    const value = state.values[element.id] ?? ""
    const error = state.errors[element.id]
    return <div className={`min-w-[180px] space-y-2 ${className}`}>
        {element.showLabel && <label id={`${id}-label`} htmlFor={element.type === "Radio button" ? undefined : id} className="block text-sm font-medium text-slate-700">{element.label}</label>}
        {element.type === "Radio button" ? <div role="radiogroup" aria-label={element.label || element.variableName} className="flex flex-col gap-2">{element.options.map(option => <InputRadio key={option.id} name={id} value={option.value} checked={value === option.value} onChange={() => onInput(element, option.value)}>{option.label}</InputRadio>)}</div> : <div className="flex items-start gap-2">
            {element.type === "Date input" ? <InputDate id={id} aria-label={!element.showLabel ? element.label || element.variableName : undefined} value={value} onChange={event => onInput(element, event.target.value)} onBlur={() => onBlur(element)} min={dateBoundary(element.min)} max={dateBoundary(element.max)} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} className="min-w-[160px] aria-invalid:border-red-500" />
                : <InputText id={id} aria-label={!element.showLabel ? element.label || element.variableName : undefined} value={value} placeholder={element.placeholder} onChange={event => onInput(element, event.target.value)} onBlur={() => onBlur(element)} type={element.type === "Number input" ? "number" : element.type === "Email input" ? "email" : element.type === "Phone input" ? "tel" : "text"} min={element.type === "Number input" ? element.min : undefined} max={element.type === "Number input" ? element.max : undefined} step={element.type === "Number input" ? element.step : undefined} inputMode={element.type === "Phone input" ? "tel" : element.type === "Number input" ? "decimal" : undefined} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} className="min-w-[160px]" />}
            {"copyButton" in element && element.copyButton.enabled && <Button style={COPY_BUTTON_STYLE} className="shrink-0" aria-label={`Copy ${element.label || element.variableName}`} onClick={() => onCopy(element.id, element.copyButton.confirmCopy, element.copyButton.confirmationMessage)}>{element.copyButton.text}</Button>}
            {element.type === "Date input" && element.todayButton.enabled && <Button className="shrink-0" disabled={!!inputError(element, localDate())} title={inputError(element, localDate()) || "Use the current date"} onClick={() => onInput(element, localDate())}>{element.todayButton.text}</Button>}
        </div>}
        {error && <p id={`${id}-error`} role="alert" className="text-xs leading-5 text-red-600">{error}</p>}
    </div>
}
export default InputRenderedElement
