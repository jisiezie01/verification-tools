export type InputSettingProps = {
    className?: string
    label: string
    value: string | number
    onChange: (value: string) => void
    kind?: "text" | "number" | "color" | "textarea" | "select" | "date"
    options?: Array<{ value: string; label: string }>
    hint?: string
    placeholder?: string
    min?: number
    max?: number
    step?: number | "any"
    rows?: number
}
