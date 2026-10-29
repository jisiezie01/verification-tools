import { useEffect, useId, useRef, useState } from "react"
import { useBlocker } from "react-router-dom"
import Button from "../Button"
import { warnBeforeUnload } from "./functions"
import type { ContainerUnsavedChangesProps } from "./types"

const ContainerUnsavedChanges = ({ when, onSave, subject = "board", className = "" }: ContainerUnsavedChangesProps) => {
    const blocker = useBlocker(when)
    const dialog = useRef<HTMLDialogElement>(null)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")
    const id = useId()
    useEffect(() => {
        if (!when) return
        window.addEventListener("beforeunload", warnBeforeUnload)
        return () => window.removeEventListener("beforeunload", warnBeforeUnload)
    }, [when])
    useEffect(() => {
        const node = dialog.current
        if (blocker.state === "blocked") node?.showModal()
        return () => node?.close()
    }, [blocker.state])
    return blocker.state === "blocked" ? <dialog ref={dialog} aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} onCancel={event => { event.preventDefault(); if (!saving) { setError(""); blocker.reset() } }} className={`m-auto w-[min(460px,calc(100%-32px))] rounded-3xl border border-white/80 bg-slate-50 p-7 text-slate-800 shadow-2xl backdrop:bg-slate-900/35 backdrop:backdrop-blur-sm ${className}`}>
        <h2 id={`${id}-title`} className="text-xl font-semibold tracking-tight">Save your changes?</h2>
        <p id={`${id}-description`} className="mt-3 text-sm leading-6 text-slate-500">You have unsaved changes to this {subject}. Save them before leaving, or stay to keep working.</p>
        {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}
        <div className="mt-6 flex flex-wrap justify-end gap-2">
            <Button disabled={saving} onClick={() => { setError(""); blocker.reset() }}>Stay</Button>
            <Button variant="ghost" disabled={saving} onClick={() => { setError(""); blocker.proceed() }}>Discard changes</Button>
            <Button variant="primary" disabled={saving} onClick={async () => {
                setSaving(true); setError("")
                try { if (await onSave()) blocker.proceed(); else setError("Changes could not be saved. Stay on this page to fix the highlighted issues.") }
                catch (cause) { setError(cause instanceof Error ? cause.message : "Changes could not be saved. Please try again.") }
                finally { setSaving(false) }
            }}>{saving ? "Saving…" : "Save and continue"}</Button>
        </div>
    </dialog> : null
}
export default ContainerUnsavedChanges
