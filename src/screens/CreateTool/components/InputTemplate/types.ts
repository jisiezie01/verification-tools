import type { InputElementType } from "../../types"
export type InputTemplateProps = { className?: string; label: string; value: string; inputs: Array<InputElementType>; calculationResult?: boolean; onChange: (value: string) => void }
