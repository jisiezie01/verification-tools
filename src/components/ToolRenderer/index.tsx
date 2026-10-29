import ContainerToolRuntime from "./components/ContainerToolRuntime"
import type { ToolRendererProps } from "./types"

const ToolRenderer = ({ tool, className = "" }: ToolRendererProps) => {
    return <ContainerToolRuntime key={`${tool.id}:${JSON.stringify(tool.elements)}`} tool={tool} className={className} />
}
export default ToolRenderer
