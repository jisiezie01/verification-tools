import type { ElementType } from "../../../../types"
import type { ElementSettingsProps } from "../../types"
export type ContainerLayoutSettingsProps = ElementSettingsProps<Extract<ElementType, { type: "Container" | "Divider" }>>
