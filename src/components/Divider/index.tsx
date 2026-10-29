import type { DividerProps } from "./types"

const Divider = ({ className = "", ...props }: DividerProps) => {
    return <hr className={`border-0 border-t border-white/60 ${className}`} {...props} />
}

export default Divider
