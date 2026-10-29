import Button from "../../../Button"
import { isRuntimeInput, runtimeElementStyle } from "../../functions"
import InputRenderedElement from "../InputRenderedElement"
import ContainerRenderedElements from "../ContainerRenderedElements"
import type { ContainerRenderedElementProps } from "./types"

const ContainerRenderedElement = ({ element, tool, state, ancestors = [], className = "", ...actions }: ContainerRenderedElementProps) => {
    return <div data-runtime-element={element.id} data-runtime-type={element.type} style={runtimeElementStyle(element)} className={`min-w-0 ${className}`}>
        {element.type === "Container" && <ContainerRenderedElements tool={tool} state={state} containerId={element.id} ancestors={[...ancestors, element.id]} {...actions} />}
        {isRuntimeInput(element) && <InputRenderedElement element={element} state={state} {...actions} />}
        {element.type === "Generate button" && <Button className="h-full w-full" style={{ ...element.style, minHeight: "inherit" }} onClick={() => actions.onGenerate(element.link)}>{element.text}</Button>}
        {element.type === "Reset button" && <Button className="h-full w-full" style={{ ...element.style, minHeight: "inherit" }} onClick={actions.onReset}>{element.text}</Button>}
        {element.type === "Copy button" && <Button className="h-full w-full" style={{ ...element.style, minHeight: "inherit" }} onClick={() => actions.onCopy(element.link, element.confirmCopy, element.confirmationMessage)}>{element.text}</Button>}
        {element.type === "Output text" && <p aria-live="polite" className="whitespace-pre-wrap break-words leading-6">{state.outputs[element.id] ?? ""}</p>}
        {element.type === "Text" || element.type === "Label" ? <p className="whitespace-pre-wrap break-words">{element.text}</p> : element.type === "Header 1" ? <h1 className="whitespace-pre-wrap break-words">{element.text}</h1> : element.type === "Header 2" ? <h2 className="whitespace-pre-wrap break-words">{element.text}</h2> : element.type === "Header 3" ? <h3 className="whitespace-pre-wrap break-words">{element.text}</h3> : null}
        {element.type === "Divider" && <div role="separator" aria-orientation={element.orientation} className={element.orientation === "horizontal" ? "my-2 w-full border-t border-slate-200" : "mx-auto min-h-12 w-px bg-slate-200"} style={element.orientation === "vertical" && element.size.height.unit !== "auto" ? { height: `${element.size.height.value}${element.size.height.unit}` } : undefined} />}
    </div>
}
export default ContainerRenderedElement
