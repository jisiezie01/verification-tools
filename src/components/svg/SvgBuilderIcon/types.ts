import type { SVGProps } from "react"
import type { ICON_PATHS } from "./data"
export type SvgBuilderIconProps = {
    className?: string
    name: keyof typeof ICON_PATHS
    wrapperProps?: SVGProps<SVGSVGElement>
    pathProps?: SVGProps<SVGPathElement>
}
