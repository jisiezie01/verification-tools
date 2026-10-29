import type { TextProps } from "./types"

const Text = ({ children = null, className = "", ...props }: TextProps) => {
    return <span className={`text-sm text-slate-800 ${className}`} {...props}>{children}</span>
}

export default Text
