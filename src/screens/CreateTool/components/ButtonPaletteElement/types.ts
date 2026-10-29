import type { ElementType } from "../../../../types"
import type { PaletteItemType } from "../../types"
export type ButtonPaletteElementProps = { className?: string; item: PaletteItemType; onAdd: (type: ElementType["type"]) => void }
