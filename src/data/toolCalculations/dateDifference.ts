const dateDifferencePattern = /^\s*date\.diff\(\s*((?:global\.)?[A-Za-z_][A-Za-z0-9_]*)\s*,\s*((?:global\.)?[A-Za-z_][A-Za-z0-9_]*)\s*,\s*(["'])(days|weeks|months|years)\3\s*\)\s*$/
export const isDateDifference = (expression: string) => /^\s*date\.diff\b/.test(expression)
export const analyzeDateDifference = (expression: string) => {
    const match = expression.match(dateDifferencePattern)
    return { variableNames: match ? [...new Set([match[1], match[2]])] : [],
        error: match ? "" : 'Use date.diff(start_date, end_date, "days"), with days, weeks, months, or years.',
        start: match?.[1], end: match?.[2], unit: match?.[4] }
}

const midnight = (value: string) => {
    const formatted = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
    const iso = formatted ? `${formatted[3]}-${formatted[1]}-${formatted[2]}` : value
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return NaN
    const timestamp = Date.parse(`${iso}T00:00:00Z`)
    return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === iso ? timestamp : NaN
}

export const calculateDateDifference = (expression: string, values: Map<string, string>, dateVariables: Set<string>) => {
    const analysis = analyzeDateDifference(expression)
    const failure = (error: string) => ({ value: undefined, formatted: undefined, error })
    if (analysis.error) return failure(analysis.error)
    for (const name of analysis.variableNames) {
        if (!values.has(name)) return failure(`Unknown variable "${name}" in date difference.`)
        if (!dateVariables.has(name)) return failure(`Date difference variable "${name}" must be a date input.`)
        if (!Number.isFinite(midnight(values.get(name) ?? ""))) return failure(`Enter a valid date for ${name}.`)
    }
    const start = midnight(values.get(analysis.start!)!)
    const end = midnight(values.get(analysis.end!)!)
    let value = (end - start) / 86400000
    if (analysis.unit === "weeks") value /= 7
    if (analysis.unit === "months" || analysis.unit === "years") {
        const earlier = new Date(Math.min(start, end))
        const later = new Date(Math.max(start, end))
        let periods = later.getUTCFullYear() - earlier.getUTCFullYear()
        if (analysis.unit === "months") periods = periods * 12 + later.getUTCMonth() - earlier.getUTCMonth()
        // A completed period ends on the corresponding day, clamped for short months/leap years.
        const anniversary = new Date(earlier)
        anniversary.setUTCDate(1)
        if (analysis.unit === "months") anniversary.setUTCMonth(anniversary.getUTCMonth() + periods)
        else anniversary.setUTCFullYear(anniversary.getUTCFullYear() + periods)
        const lastDay = new Date(anniversary)
        lastDay.setUTCMonth(lastDay.getUTCMonth() + 1, 0)
        anniversary.setUTCDate(Math.min(earlier.getUTCDate(), lastDay.getUTCDate()))
        if (anniversary > later) periods--
        value = periods * Math.sign(end - start)
    }
    return { value: value || 0, formatted: undefined, error: "" }
}

export const remapDateDifference = (expression: string, names: Map<string, string>) => {
    const parsed = analyzeDateDifference(expression)
    if (parsed.error || (!names.has(parsed.start!) && !names.has(parsed.end!))) return expression
    return `date.diff(${names.get(parsed.start!) ?? parsed.start}, ${names.get(parsed.end!) ?? parsed.end}, "${parsed.unit}")`
}
