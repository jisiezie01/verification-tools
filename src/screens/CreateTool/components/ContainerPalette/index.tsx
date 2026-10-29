import { PALETTE_GROUPS, PALETTE_ITEMS } from "../../data"
import ButtonPaletteElement from "../ButtonPaletteElement"
import type { ContainerPaletteProps } from "./types"

const ContainerPalette = ({ onAdd, className = "" }: ContainerPaletteProps) => {
    return <aside aria-label="Tool selection" className={`rounded-3xl border border-white/80 bg-white/50 p-4 shadow-sm backdrop-blur-xl ${className}`}>
        <h2 className="px-2 text-sm font-semibold text-slate-800">Elements</h2>
        <p className="mt-1 px-2 text-xs leading-5 text-slate-500">Drag to the canvas, or click to add.</p>
        <div className="mt-5 space-y-5">{PALETTE_GROUPS.map(group => <section key={group}><h3 className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{group}</h3><div>{PALETTE_ITEMS.filter(item => item.group === group).map(item => <ButtonPaletteElement key={item.type} item={item} onAdd={onAdd} />)}</div></section>)}</div>
    </aside>
}
export default ContainerPalette
