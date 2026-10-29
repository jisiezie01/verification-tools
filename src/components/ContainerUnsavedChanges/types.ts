export type ContainerUnsavedChangesProps = {
    className?: string
    when: boolean
    onSave: () => boolean | Promise<boolean>
    subject?: string
}
