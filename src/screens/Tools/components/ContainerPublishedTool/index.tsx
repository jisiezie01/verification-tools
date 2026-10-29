import ToolRenderer from "../../../../components/ToolRenderer"
import { useToolMeasurements } from "../../../../components/ToolRenderer/useToolMeasurements/functions"
import type { ContainerPublishedToolProps } from "./types"

const ContainerPublishedTool = ({ tool, placement, className = "" }: ContainerPublishedToolProps) => {
    const { card, header, content, minimum, availableWidth } = useToolMeasurements(tool.elements, 2)
    return <article ref={card} data-published-tool={tool.id} aria-label={tool.name} style={{ width: Math.max(placement.width ?? Math.min(400, availableWidth), minimum.width), minHeight: Math.max(placement.height ?? 0, minimum.height), minWidth: minimum.width }} className={`shrink-0 rounded-2xl border border-white/90 bg-white/90 shadow-[0_8px_30px_rgba(71,85,105,0.06)] ${className}`}>
        <div ref={content} className="p-5"><ToolRenderer tool={tool} /></div>
    </article>
}
export default ContainerPublishedTool
