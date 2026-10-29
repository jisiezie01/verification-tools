import type { InputHTMLAttributes, ReactNode } from "react"
export type InputRadioProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "children"> & { children?: ReactNode }
