import { useDrag } from "react-dnd"
import SvgBuilderIcon from "../../../../components/svg/SvgBuilderIcon"
import { DRAG_TYPE } from "../../data"
import type { BuilderDragItem, DragCollectedType } from "../../types"
import type { ButtonPaletteElementProps } from "./types"

const ButtonPaletteElement = ({ item, onAdd, className = "" }: ButtonPaletteElementProps) => {
    const [{ isDragging }, drag] = useDrag<BuilderDragItem, unknown, DragCollectedType>(() => ({ type: DRAG_TYPE, item: { source: "palette", elementType: item.type }, collect: monitor => ({ isDragging: monitor.isDragging() }) }), [item.type])
    return <button ref={node => { drag(node) }} type="button" onClick={() => onAdd(item.type)} aria-label={`Add ${item.label.toLowerCase()}`} className={`group relative flex w-full cursor-grab items-center gap-2.5 rounded-2xl border border-transparent px-2 py-2.5 text-left transition hover:border-white/90 hover:bg-white/70 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-blue-500 active:cursor-grabbing ${isDragging ? "opacity-40" : ""} ${className}`}>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-white bg-gradient-to-br from-white to-slate-100 text-slate-500 shadow-sm"><SvgBuilderIcon name={item.icon} className="size-4" /></span>
        <span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-slate-700">{item.label}</span><span className="mt-0.5 block text-[11px] leading-4 text-slate-500">{item.description}</span></span>
        <SvgBuilderIcon name="plus" className="absolute right-0 top-1 size-3 text-slate-400 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100" />
    </button>
}
export default ButtonPaletteElement
