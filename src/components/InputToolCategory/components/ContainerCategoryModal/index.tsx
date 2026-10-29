import { useEffect, useId, useRef, useState } from "react"
import Button from "../../../Button"
import InputText from "../../../InputText"
import { validateCategoryName } from "./functions"
import type { ContainerCategoryModalProps } from "./types"

const ContainerCategoryModal = ({ categories, onCreate, onClose, className = "" }: ContainerCategoryModalProps) => {
    const dialog = useRef<HTMLDialogElement>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [name, setName] = useState("")
    const [error, setError] = useState("")
    const id = useId()
    useEffect(() => { const current = dialog.current; current?.showModal(); return () => current?.close() }, [])
    return <dialog ref={dialog} onCancel={onClose} aria-labelledby={`${id}-title`} className={`m-auto w-[min(440px,calc(100%-32px))] rounded-3xl border border-white/80 bg-slate-50/95 p-7 text-slate-800 shadow-2xl backdrop:bg-slate-900/30 backdrop:backdrop-blur-sm ${className}`}>
        <form onSubmit={async event => {
            event.preventDefault()
            if (isSaving) return
            const message = validateCategoryName(name, categories)
            if (message) { setError(message); return }
            setIsSaving(true)
            try { await onCreate({ id: crypto.randomUUID(), name: name.trim() }) } catch { setError("The category could not be saved. Please try again.") }
            finally { setIsSaving(false) }
        }}>
            <h2 id={`${id}-title`} className="text-xl font-semibold tracking-tight">Create a category</h2>
            <p className="mb-6 mt-2 text-sm text-slate-500">Keep related tools together in one place.</p>
            <label htmlFor={id} className="mb-2 block text-xs font-semibold text-slate-600">Category name</label>
            <InputText id={id} disabled={isSaving} value={name} autoFocus maxLength={80} onChange={event => { setName(event.target.value); setError("") }} placeholder="e.g. Formatters" aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} />
            {error && <p id={`${id}-error`} role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-6 flex justify-end gap-2"><Button disabled={isSaving} onClick={onClose}>Cancel</Button><Button disabled={isSaving} type="submit" variant="primary">Create category</Button></div>
        </form>
    </dialog>
}
export default ContainerCategoryModal
