export const warnBeforeUnload = (event: BeforeUnloadEvent) => {
    event.preventDefault()
    event.returnValue = ""
}
