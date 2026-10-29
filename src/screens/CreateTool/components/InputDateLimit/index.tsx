import type { DateLimitType } from "../../../../types"
import InputSetting from "../InputSetting"
import { DATE_LIMIT_MODES } from "./data"
import type { InputDateLimitProps } from "./types"

const InputDateLimit = ({ label, limit, onChange, className = "" }: InputDateLimitProps) => {
    return <div className={`space-y-3 ${className}`}><InputSetting label={label} kind="select" value={limit.mode} options={DATE_LIMIT_MODES} onChange={mode => onChange({ ...limit, mode: mode as DateLimitType["mode"] })} />{limit.mode === "fixed" && <InputSetting label={`${label} value`} kind="date" value={limit.value} onChange={value => onChange({ ...limit, value })} />}</div>
}
export default InputDateLimit
