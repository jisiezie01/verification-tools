import Button from "../../../../components/Button"
import InputText from "../../../../components/InputText"
import InputDate from "../../../../components/InputDate"
import InputRadio from "../../../../components/InputRadio"
import { isInputElement, resolveDateLimit } from "../../functions"
import type { ContainerElementSampleProps } from "./types"

const ContainerElementSample = ({ element, className = "" }: ContainerElementSampleProps) => {
    return <div className={`pointer-events-none h-full min-w-0 ${className}`} aria-hidden="true">
        {(element.type === "Generate button" || element.type === "Reset button" || element.type === "Copy button") && <Button tabIndex={-1} style={element.style} className="h-full w-full">{element.text}</Button>}
        {("text" in element && !element.type.endsWith("button")) && <p style={element.style} className="h-full whitespace-pre-wrap break-words rounded-lg">{element.text || "Your text"}</p>}
        {element.type === "Divider" && <div role="separator" aria-orientation={element.orientation} className={element.orientation === "horizontal" ? "my-3 w-full border-t border-slate-300" : "mx-auto h-full min-h-12 w-px bg-slate-300"} />}
        {element.type === "Output text" && <div className="h-full rounded-xl border border-dashed border-blue-200 bg-blue-50/50 p-4"><p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-blue-500">Generated text{element.visibility ? " - Shown for selected radio option" : element.initiallyHidden ? " · Hidden until generated" : ""}</p><p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">{element.generatedText.default || "Add your generated text template"}</p>{element.conditions.length > 0 && <p className="mt-2 text-xs text-blue-500">{element.conditions.length} conditional {element.conditions.length === 1 ? "rule" : "rules"}</p>}</div>}
        {isInputElement(element) && <div className="flex h-full flex-col gap-2">
            {element.showLabel && <span className="text-sm font-medium text-slate-700">{element.label}</span>}
            {element.type === "Radio button" ? <div className="flex" style={{ flexDirection: element.direction ?? "column", flexWrap: element.wrap ?? "nowrap", justifyContent: element.justifyContent ?? "flex-start", alignContent: element.alignContent ?? "stretch", gap: element.gap ?? 8 }}>{element.options.map(option => <InputRadio key={option.id} name={element.id} tabIndex={-1} checked={false} readOnly>{option.label}</InputRadio>)}</div> : <div className="flex min-h-0 flex-1 items-center gap-2">
                {element.type === "Date input" ? <InputDate tabIndex={-1} readOnly min={resolveDateLimit(element.min)} max={resolveDateLimit(element.max)} className="h-full" /> : <InputText tabIndex={-1} readOnly placeholder={element.placeholder} type={element.type === "Number input" ? "number" : element.type === "Email input" ? "email" : element.type === "Phone input" ? "tel" : "text"} maxLength={element.type === "Phone input" ? 14 : undefined} min={element.type === "Number input" ? element.min : undefined} max={element.type === "Number input" ? element.max : undefined} className="h-full" />}
                {"copyButton" in element && element.copyButton.enabled && <Button tabIndex={-1} style={{ color: "#ffffff", backgroundColor: "#3b82f6" }} className="shrink-0">{element.copyButton.text}</Button>}
                {element.type === "Date input" && element.todayButton.enabled && <Button tabIndex={-1} className="shrink-0">{element.todayButton.text}</Button>}
            </div>}
        </div>}
    </div>
}
export default ContainerElementSample
