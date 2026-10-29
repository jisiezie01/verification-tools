import Button from "../../../../components/Button"
import { getElementLabel, isInputElement } from "../../functions"
import ContainerButtonSettings from "../ContainerButtonSettings"
import ContainerTextSettings from "../ContainerTextSettings"
import ContainerLayoutSettings from "../ContainerLayoutSettings"
import ContainerInputSettings from "../ContainerInputSettings"
import ContainerOutputSettings from "../ContainerOutputSettings"
import ContainerSizeSettings from "../ContainerSizeSettings"
import type { ContainerElementSettingsProps } from "./types"

const ContainerElementSettings = ({ element, elements, sharedInputs, onChange, onDelete, onToolSettings, className = "" }: ContainerElementSettingsProps) => {
    return <div className={`space-y-5 ${className}`}>
        <div><Button variant="ghost" className="mb-3 px-0 text-xs" onClick={onToolSettings}>Back to tool settings</Button><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Element settings</p><h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-800">{getElementLabel(element.type)}</h2></div>
        {(element.type === "Generate button" || element.type === "Reset button" || element.type === "Copy button") && <ContainerButtonSettings element={element} elements={elements} onChange={onChange} />}
        {(element.type === "Text" || element.type === "Header 1" || element.type === "Header 2" || element.type === "Header 3" || element.type === "Label") && <ContainerTextSettings element={element} elements={elements} onChange={onChange} />}
        {(element.type === "Container" || element.type === "Divider") && <ContainerLayoutSettings element={element} elements={elements} onChange={onChange} />}
        {isInputElement(element) && <ContainerInputSettings element={element} elements={elements} onChange={onChange} />}
        {element.type === "Output text" && <ContainerOutputSettings key={element.id} element={element} elements={elements} sharedInputs={sharedInputs} onChange={onChange} />}
        <ContainerSizeSettings element={element} elements={elements} onChange={onChange} />
        <Button variant="danger" className="w-full text-xs" onClick={() => onDelete(element.id)}>{element.type === "Container" ? "Delete container and its contents" : "Delete element"}</Button>
    </div>
}
export default ContainerElementSettings
