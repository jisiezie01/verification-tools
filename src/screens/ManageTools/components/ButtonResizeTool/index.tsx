import { useRef } from "react"
import SvgBuilderIcon from "../../../../components/svg/SvgBuilderIcon"
import { resizedToolSize } from "./functions"
import type { ButtonResizeToolProps, ToolResizeSessionType } from "./types"

const ButtonResizeTool = ({ toolId, minimum, onResize, className = "" }: ButtonResizeToolProps) => {
    const session = useRef<ToolResizeSessionType | null>(null)
    return <button type="button" aria-label="Resize tool" title="Drag to resize; arrow keys also work" className={`absolute bottom-1 right-1 flex size-7 touch-none cursor-se-resize items-center justify-center rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 focus-visible:outline-2 focus-visible:outline-blue-500 ${className}`}
        onPointerDown={event => {
            event.preventDefault(); event.stopPropagation()
            const card = event.currentTarget.closest<HTMLElement>("[data-board-tool]")
            if (!card) return
            const rect = card.getBoundingClientRect()
            session.current = { x: event.clientX, y: event.clientY, width: rect.width, height: rect.height }
            event.currentTarget.setPointerCapture(event.pointerId)
        }}
        onPointerMove={event => { if (session.current) onResize({ toolId, ...resizedToolSize(session.current, minimum, event.clientX, event.clientY) }) }}
        onPointerUp={event => { session.current = null; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId) }}
        onPointerCancel={() => { session.current = null }}
        onKeyDown={event => {
            if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return
            event.preventDefault()
            const rect = event.currentTarget.closest<HTMLElement>("[data-board-tool]")?.getBoundingClientRect()
            if (!rect) return
            const delta = event.shiftKey ? 20 : 5
            onResize({ toolId, ...resizedToolSize({ x: 0, y: 0, width: rect.width, height: rect.height }, minimum, event.key === "ArrowRight" ? delta : event.key === "ArrowLeft" ? -delta : 0, event.key === "ArrowDown" ? delta : event.key === "ArrowUp" ? -delta : 0) })
        }}><SvgBuilderIcon name="resize" className="size-4" /></button>
}
export default ButtonResizeTool
