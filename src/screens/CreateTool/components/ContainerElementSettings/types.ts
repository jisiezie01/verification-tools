import type { ElementSettingsProps } from "../../types"
import type { InputElementType } from "../../types"
export type ContainerElementSettingsProps = ElementSettingsProps & { sharedInputs?: Array<InputElementType>; onDelete: (id: string) => void; onToolSettings: () => void }
