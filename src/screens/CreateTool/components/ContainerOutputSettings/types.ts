import type { ElementType } from "../../../../types"
import type { ElementSettingsProps, InputElementType } from "../../types"
export type ContainerOutputSettingsProps = ElementSettingsProps<Extract<ElementType, { type: "Output text" }>> & { sharedInputs?: Array<InputElementType> }
