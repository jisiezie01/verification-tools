import type { InputElementType } from "../../types"
export type InputTemplateProps = { className?: string; label: string; value: string; inputs: Array<InputElementType>; onChange: (value: string) => void }
