import InputToggle from "../../../../components/InputToggle"
import InputSetting from "../InputSetting"
import { FONT_WEIGHTS } from "./data"
import type { ContainerTextSettingsProps } from "./types"

const ContainerTextSettings = ({ element, onChange, className = "" }: ContainerTextSettingsProps) => {
    return <div className={`space-y-4 ${className}`}>
        <InputSetting label="Text content" kind="textarea" value={element.text} onChange={text => onChange({ ...element, text })} />
        <InputSetting label="Text color" kind="color" value={element.style.color ?? "#334155"} onChange={color => onChange({ ...element, style: { ...element.style, color } })} />
        <InputToggle label="Background fill" checked={!!element.style.backgroundColor} onChange={enabled => onChange({ ...element, style: { ...element.style, backgroundColor: enabled ? "#ffffff" : undefined } })} />
        {!!element.style.backgroundColor && <InputSetting label="Background color" kind="color" value={element.style.backgroundColor} onChange={backgroundColor => onChange({ ...element, style: { ...element.style, backgroundColor } })} />}
        <div className="grid grid-cols-2 gap-3"><InputSetting label="Font size (px)" kind="number" min={8} max={200} value={Number(element.style.fontSize ?? 16)} onChange={fontSize => onChange({ ...element, style: { ...element.style, fontSize: Math.max(8, Number(fontSize)) } })} /><InputSetting label="Font weight" kind="select" value={String(element.style.fontWeight ?? 400)} options={FONT_WEIGHTS} onChange={fontWeight => onChange({ ...element, style: { ...element.style, fontWeight: Number(fontWeight) } })} /></div>
    </div>
}
export default ContainerTextSettings
