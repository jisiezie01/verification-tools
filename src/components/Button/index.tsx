import { BUTTON_VARIANTS } from "./data"
import type { ButtonProps } from "./types"

const Button = ({ children = "Button", className = "", variant = "glass", color, style, ...props }: ButtonProps) => {
    return (
        <button
            className={`cursor-pointer rounded-xl border px-4 py-2 text-sm font-semibold backdrop-blur-xl transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-40 ${BUTTON_VARIANTS[variant]} ${className}`}
            style={color ? { backgroundColor: color, ...style } : style}
            type="button"
            {...props}>
            {children}
        </button>
    )
}

export default Button
