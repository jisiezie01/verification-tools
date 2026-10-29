import type { RadioOptionType } from "../../../../types"

export const createRadioOption = (options: Array<RadioOptionType>): RadioOptionType => {
    let number = options.length + 1
    while (options.some(option => option.value === `option_${number}`)) number++
    return { id: crypto.randomUUID(), label: `Option ${number}`, value: `option_${number}` }
}
