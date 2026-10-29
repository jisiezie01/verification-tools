import { useId, useState } from "react"
import Button from "../Button"
import InputDropdown from "../InputDropdown"
import ContainerCategoryModal from "./components/ContainerCategoryModal"
import type { InputToolCategoryProps } from "./types"

const InputToolCategory = ({ value, categories, onChange, onCreate, className = "" }: InputToolCategoryProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const id = useId()
    return <div className={`space-y-2 ${className}`}>
        <label htmlFor={id} className="text-xs font-semibold text-slate-600">Tool category</label>
        <InputDropdown id={id} value={value} onChange={event => onChange(event.target.value)}><option value="">Choose a category</option>{categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</InputDropdown>
        <Button onClick={() => setIsOpen(true)} className="w-full text-xs">Create category</Button>
        {isOpen && <ContainerCategoryModal categories={categories} onClose={() => setIsOpen(false)} onCreate={async category => { await onCreate(category); onChange(category.id); setIsOpen(false) }} />}
    </div>
}
export default InputToolCategory
