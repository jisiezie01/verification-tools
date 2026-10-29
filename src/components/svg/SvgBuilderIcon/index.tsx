import { ICON_PATHS } from "./data"
import type { SvgBuilderIconProps } from "./types"

const SvgBuilderIcon = ({ name, className = "", wrapperProps, pathProps }: SvgBuilderIconProps) => {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`size-5 shrink-0 ${className}`} {...wrapperProps}><path d={ICON_PATHS[name]} {...pathProps} /></svg>
}
export default SvgBuilderIcon
