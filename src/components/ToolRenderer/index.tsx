import ContainerToolRuntime from "./components/ContainerToolRuntime"
import type { ToolRendererProps } from "./types"

const ToolRenderer = ({ tool, analytics, className = "" }: ToolRendererProps) => {
    return <ContainerToolRuntime key={`${tool.id}:${JSON.stringify(tool.elements)}`} tool={tool} analytics={analytics} className={className} />
}
export default ToolRenderer
