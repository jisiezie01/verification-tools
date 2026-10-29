import { useRef } from "react"
import SvgBuilderIcon from "../../../../components/svg/SvgBuilderIcon"
import { resizeElement } from "./functions"
import type { ButtonResizeElementProps, ResizeSessionType } from "./types"

const ButtonResizeElement = ({ element, onChange, className = "" }: ButtonResizeElementProps) => {
    const session = useRef<ResizeSessionType | null>(null)
    return <button type="button" aria-label="Resize element" title="Drag to resize; use arrow keys for precise changes" className={`absolute -bottom-2 -right-2 z-10 flex size-6 touch-none cursor-se-resize items-center justify-center rounded-lg border border-blue-200 bg-white text-blue-600 shadow-sm focus-visible:outline-2 focus-visible:outline-blue-500 ${className}`}
        onClick={event => event.stopPropagation()}
        onPointerDown={event => {
            event.preventDefault(); event.stopPropagation()
            const node = event.currentTarget.closest<HTMLElement>("[data-builder-element]")
            if (!node?.parentElement) return
            const rect = node.getBoundingClientRect()
            const parent = node.parentElement
            const style = getComputedStyle(parent)
            session.current = { x: event.clientX, y: event.clientY, width: rect.width, height: rect.height, parentWidth: Math.max(1, parent.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)) }
            event.currentTarget.setPointerCapture(event.pointerId)
        }}
        onPointerMove={event => { if (session.current) onChange(resizeElement(element, session.current, event.clientX, event.clientY)) }}
        onPointerUp={event => { session.current = null; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId) }}
        onPointerCancel={() => { session.current = null }}
        onKeyDown={event => {
            if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return
            event.preventDefault(); event.stopPropagation()
            const dimension = event.key === "ArrowLeft" || event.key === "ArrowRight" ? "width" : "height"
            const current = element.size[dimension]
            const delta = event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1
            onChange({ ...element, size: { ...element.size, [dimension]: { unit: current.unit === "auto" ? "px" : current.unit, value: Math.max(1, Math.min(current.unit === "%" ? 100 : 2000, (current.unit === "auto" ? 100 : current.value) + delta * (event.shiftKey ? 10 : 1))) } } })
        }}><SvgBuilderIcon name="resize" className="size-3.5" /></button>
}
export default ButtonResizeElement
