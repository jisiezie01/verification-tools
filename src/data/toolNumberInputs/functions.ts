import type { ElementNumberInputType } from "../../types"

// Keep repeated entries together in the existing string-valued runtime store,
// including Global tool values. A scalar represents the initial/default field.
export const numberInputEntries = (element: ElementNumberInputType, value: string): Array<string> => {
    if (element.repeatable?.enabled && value.trim().startsWith("[")) {
        try {
            const entries: unknown = JSON.parse(value)
            if (Array.isArray(entries) && entries.length && entries.every(entry => typeof entry === "string")) return entries
        } catch { /* Treat malformed data as an invalid number. */ }
    }
    return [value]
}

export const numberInputLabel = (element: ElementNumberInputType, index: number) => {
    const label = element.label.trim() || element.variableName
    if (!element.repeatable?.enabled) return label
    if (label.includes("{index}")) return label.replaceAll("{index}", String(index + 1))
    if (/\d+$/.test(label)) return label.replace(/\d+$/, number => String(Number(number) + index))
    return `${label} ${index + 1}`
}

const sumEntries = (entries: Array<string>) => {
    const numbers = entries.map(Number)
    // Sum ordinary decimals as scaled integers so 0.1 + 0.2 is exactly 0.3.
    // Fall back to native arithmetic outside the safe integer/scale range.
    const precision = numbers.reduce((places, number) => {
        const [coefficient, exponent = "0"] = String(number).split("e")
        return Math.max(places, (coefficient.split(".")[1]?.length ?? 0) - Number(exponent))
    }, 0)
    const scale = 10 ** precision
    const scaled = numbers.map(number => Math.round(number * scale))
    const scaledTotal = scaled.reduce((sum, number) => sum + number, 0)
    return Number.isFinite(scale) && scaled.every(Number.isSafeInteger) && Number.isSafeInteger(scaledTotal)
        ? scaledTotal / scale : numbers.reduce((sum, number) => sum + number, 0)
}

export const numberInputValue = (element: ElementNumberInputType, value: string) => {
    if (!element.repeatable?.enabled) return value
    const entries = numberInputEntries(element, value)
    // An unfinished row must not silently count as zero in a condition.
    if (entries.some(entry => !entry.trim() || !Number.isFinite(Number(entry)))) return ""
    return String(sumEntries(entries))
}

const entryError = (element: ElementNumberInputType, value: string) => {
    if (!value.trim()) return ""
    const number = Number(value)
    if (!Number.isFinite(number)) return "Enter a valid number."
    if (element.min !== undefined && number < element.min) return `Enter a number at least ${element.min}.`
    if (element.max !== undefined && number > element.max) return `Enter a number no greater than ${element.max}.`
    const steps = (number - (element.min ?? 0)) / element.step
    if (element.step > 0 && Math.abs(steps - Math.round(steps)) > 0.0000001) return `Use increments of ${element.step}.`
    return ""
}

export const numberInputError = (element: ElementNumberInputType, value: string) => {
    for (const [index, entry] of numberInputEntries(element, value).entries()) {
        const error = entryError(element, entry)
        if (error) return element.repeatable?.enabled ? `${numberInputLabel(element, index)}: ${error}` : error
    }
    const total = numberInputValue(element, value)
    return total && !Number.isFinite(Number(total)) ? "The total is too large. Enter smaller numbers." : ""
}
