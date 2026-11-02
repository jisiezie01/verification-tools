const tokenize = (expression: string) => {
    const tokens: Array<string> = []
    const pattern = /\s*((?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?|[A-Za-z_][A-Za-z0-9_]*|[()+\-*/])/gy
    let position = 0
    while (position < expression.length) {
        if (!expression.slice(position).trim()) break
        pattern.lastIndex = position
        const match = pattern.exec(expression)
        if (!match) return { tokens, error: "Use number inputs, numbers, parentheses, and +, -, *, or / in a formula." }
        tokens.push(match[1])
        position = pattern.lastIndex
    }
    return { tokens, error: "" }
}

const isVariable = (token: string) => /^[A-Za-z_][A-Za-z0-9_]*$/.test(token)
const currencyPattern = /^Currency\s*\(\s*(.+?)\s*(?:,\s*["']([A-Za-z]{3})["'])?\s*\)$/
export const isFormulaExpression = (expression: string) => /^Currency\s*\(/.test(expression.trim()) || /[()+\-*/\d]/.test(expression)

const currencyFormat = (value: number, currency: string) => {
    try {
        const supportedValues = (Intl as typeof Intl & { supportedValuesOf?: (key: "currency") => Array<string> }).supportedValuesOf
        const knownCurrency = supportedValues?.("currency").includes(currency)
            ?? new Intl.DisplayNames(["en"], { type: "currency" }).of(currency)?.toUpperCase() !== currency
        if (!knownCurrency) return { formatted: "", error: `“${currency}” is not a supported ISO currency code.` }
        if (currency === "JPY") {
            const amount = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(value))
            return { formatted: `${value < 0 ? "-" : ""}￥${amount}`, error: "" }
        }
        return { formatted: new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value), error: "" }
    } catch {
        return { formatted: "", error: `“${currency}” is not a supported ISO currency code.` }
    }
}

const parseArithmetic = (expression: string, resolveVariable: (name: string) => number, checkDivisionByZero: boolean) => {
    const { tokens, error } = tokenize(expression)
    if (error || !tokens.length) return { value: undefined, error: error || "Enter a formula." }
    let index = 0
    const parsePrimary = (): number => {
        const token = tokens[index++]
        if (token === "+") return parsePrimary()
        if (token === "-") return -parsePrimary()
        if (token === "(") {
            const value = parseSum()
            if (tokens[index++] !== ")") throw new Error("Close every opening parenthesis.")
            return value
        }
        if (token === undefined || token === ")" || /^[*/+]$/.test(token)) throw new Error("Check the formula's operators and parentheses.")
        return isVariable(token) ? resolveVariable(token) : Number(token)
    }
    const parseProduct = (): number => {
        let value = parsePrimary()
        while (tokens[index] === "*" || tokens[index] === "/") {
            const operator = tokens[index++]
            const next = parsePrimary()
            if (operator === "/" && next === 0 && checkDivisionByZero) throw new Error("Cannot divide by zero in a generated-text formula.")
            value = operator === "*" ? value * next : next === 0 ? value : value / next
            if (!Number.isFinite(value) && checkDivisionByZero) throw new Error("The formula result is too large to display.")
        }
        return value
    }
    const parseSum = (): number => {
        let value = parseProduct()
        while (tokens[index] === "+" || tokens[index] === "-") {
            const operator = tokens[index++]
            const next = parseProduct()
            value = operator === "+" ? value + next : value - next
            if (!Number.isFinite(value) && checkDivisionByZero) throw new Error("The formula result is too large to display.")
        }
        return value
    }
    try {
        const value = parseSum()
        if (index !== tokens.length) throw new Error("Check the formula's operators and parentheses.")
        return { value, error: "" }
    } catch (caught) {
        return { value: undefined, error: caught instanceof Error ? caught.message : "Check the formula." }
    }
}

const expressionDetails = (expression: string) => {
    const currency = expression.trim().match(currencyPattern)
    if (currency) return { formula: currency[1], currency: (currency[2] ?? "USD").toUpperCase(), error: "" }
    if (/\bCurrency\s*\(/.test(expression)) return { formula: expression, currency: undefined, error: "Use Currency(formula) or Currency(formula, \"USD\") with matching parentheses." }
    return { formula: expression, currency: undefined, error: "" }
}

export const analyzeExpression = (expression: string) => {
    const details = expressionDetails(expression)
    const { tokens } = tokenize(details.formula)
    const variableNames = [...new Set(tokens.filter(isVariable))]
    if (details.error) return { variableNames, error: details.error }
    const parsed = parseArithmetic(details.formula, () => 1, false)
    if (parsed.error) return { variableNames, error: parsed.error }
    if (details.currency) {
        const currency = currencyFormat(0, details.currency)
        if (currency.error) return { variableNames, error: currency.error }
    }
    return { variableNames, error: "" }
}

export const calculateExpression = (expression: string, values: Map<string, string>, numberVariables: Set<string>) => {
    const details = expressionDetails(expression)
    const analysis = analyzeExpression(expression)
    if (analysis.error) return { value: undefined, formatted: undefined, error: analysis.error }
    const simpleVariable = !details.currency && analysis.variableNames.length === 1 && expression.trim() === analysis.variableNames[0]
    if (simpleVariable) return { value: undefined, formatted: undefined, error: "" }
    for (const name of analysis.variableNames) {
        if (!values.has(name)) return { value: undefined, formatted: undefined, error: `Unknown variable “${name}” in formula.` }
        if (!numberVariables.has(name)) return { value: undefined, formatted: undefined, error: `Formula variable “${name}” must be a number input.` }
        const raw = values.get(name) ?? ""
        if (!raw.trim() || !Number.isFinite(Number(raw))) return { value: undefined, formatted: undefined, error: `Enter a valid number for ${name}.` }
    }
    const result = parseArithmetic(details.formula, name => Number(values.get(name)), true)
    if (result.error || result.value === undefined) return { ...result, formatted: undefined }
    if (!details.currency) return { ...result, formatted: undefined }
    const currency = currencyFormat(result.value, details.currency)
    return { ...result, formatted: currency.formatted, error: currency.error }
}
