import type { ButtonHTMLAttributes } from "react"

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "glass" | "primary" | "danger" | "ghost"
    color?: string
}
