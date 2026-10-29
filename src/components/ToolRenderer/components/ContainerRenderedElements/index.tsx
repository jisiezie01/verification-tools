import { canShowElement } from "../../functions"
import ContainerRenderedElement from "../ContainerRenderedElement"
import type { ContainerRenderedElementsProps } from "./types"

const ContainerRenderedElements = ({ tool, state, containerId, ancestors = [], className = "", ...actions }: ContainerRenderedElementsProps) => {
    const container = tool.elements.find(element => element.id === containerId && element.type === "Container")
    return <div className={`flex min-w-0 flex-col items-start gap-4 ${className}`} style={container?.type === "Container" ? { flexDirection: container.direction, gap: container.gap, padding: container.padding, justifyContent: container.justifyContent ?? (container.direction === "row" ? "space-between" : "flex-start"), minHeight: container.size.height.unit === "auto" ? undefined : `${container.size.height.value}${container.size.height.unit}` } : undefined}>
        {tool.elements.filter(element => element.containerId === containerId && !ancestors.includes(element.id) && canShowElement(element, state, tool)).map(element => <ContainerRenderedElement key={element.id} element={element} tool={tool} state={state} ancestors={ancestors} {...actions} />)}
    </div>
}
export default ContainerRenderedElements
