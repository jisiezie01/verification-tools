export const insertTemplateVariable = (value: string, name: string, start: number, end: number) => {
    const token = "${" + name + "}"
    return { text: value.slice(0, start) + token + value.slice(end), caret: start + token.length }
}
