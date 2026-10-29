import type { ElementDimensionType } from "../../../../types"
import InputSetting from "../InputSetting"
import { HEIGHT_UNITS, WIDTH_UNITS } from "./data"
import type { ContainerSizeSettingsProps } from "./types"

const ContainerSizeSettings = ({ element, onChange, className = "" }: ContainerSizeSettingsProps) => {
    return <section className={`space-y-4 border-t border-slate-200/70 pt-5 ${className}`}>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Size</h3>
        <div className="grid grid-cols-2 gap-3"><InputSetting label="Width" kind="select" value={element.size.width.unit} options={WIDTH_UNITS} onChange={unit => onChange({ ...element, size: { ...element.size, width: { unit: unit as ElementDimensionType["unit"], value: unit === "%" ? 100 : 240 } } })} />{element.size.width.unit !== "auto" && <InputSetting label={element.size.width.unit === "%" ? "Width (%)" : "Width (px)"} kind="number" min={1} max={element.size.width.unit === "%" ? 100 : undefined} value={element.size.width.value} onChange={value => onChange({ ...element, size: { ...element.size, width: { ...element.size.width, value: Number(value) } } })} />}</div>
        <div className="grid grid-cols-2 gap-3"><InputSetting label="Height" kind="select" value={element.size.height.unit} options={HEIGHT_UNITS} onChange={unit => onChange({ ...element, size: { ...element.size, height: { unit: unit as ElementDimensionType["unit"], value: 80 } } })} />{element.size.height.unit !== "auto" && <InputSetting label="Height (px)" kind="number" min={1} value={element.size.height.value} onChange={value => onChange({ ...element, size: { ...element.size, height: { ...element.size.height, value: Number(value) } } })} />}</div>
        <p className="text-xs leading-5 text-slate-500">You can also drag the corner of the selected element.</p>
    </section>
}
export default ContainerSizeSettings
