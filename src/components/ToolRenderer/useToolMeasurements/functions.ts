import { useCallback, useLayoutEffect, useRef, useState } from "react"
import type { ElementType } from "../../../types"

export const measureToolMinimum = (content: HTMLElement, header: HTMLElement, extraHeight = 30) => {
    const probe = content.cloneNode(true) as HTMLElement
    probe.inert = true
    probe.setAttribute("aria-hidden", "true")
    probe.querySelectorAll("[id], [name]").forEach(node => { node.removeAttribute("id"); node.removeAttribute("name") })
    Object.assign(probe.style, { position: "fixed", top: "0", left: "-100000px", visibility: "hidden", pointerEvents: "none", width: "min-content", minWidth: "0", maxWidth: "none", height: "auto" })
    document.body.append(probe)
    const width = Math.max(300, Math.ceil(probe.getBoundingClientRect().width) + 2)
    probe.remove()
    return { width, height: Math.ceil(content.getBoundingClientRect().height + header.getBoundingClientRect().height + extraHeight) }
}
export const useToolMeasurements = (elements: Array<ElementType>, extraHeight = 30) => {
    const card = useRef<HTMLElement>(null)
    const attachCard = useCallback((node: HTMLElement | null) => { card.current = node }, [])
    const content = useRef<HTMLDivElement>(null)
    const header = useRef<HTMLDivElement>(null)
    const [minimum, setMinimum] = useState({ width: 300, height: 120 })
    const [availableWidth, setAvailableWidth] = useState(400)
    useLayoutEffect(() => {
        const node = content.current
        const heading = header.current
        if (!node || !heading) return
        let frame = 0
        const measure = () => {
            const next = measureToolMinimum(node, heading, extraHeight)
            setMinimum(current => current.width === next.width && current.height === next.height ? current : next)
            const parent = card.current?.parentElement
            if (parent) { const style = getComputedStyle(parent); setAvailableWidth(Math.floor(parent.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight))) }
        }
        const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure) }
        const observer = new ResizeObserver(schedule)
        const mutations = new MutationObserver(schedule)
        observer.observe(node); observer.observe(heading)
        if (card.current?.parentElement) observer.observe(card.current.parentElement)
        mutations.observe(node, { childList: true, subtree: true, characterData: true })
        measure()
        return () => { cancelAnimationFrame(frame); observer.disconnect(); mutations.disconnect() }
    }, [elements, extraHeight])
    return { card, attachCard, content, header, minimum, availableWidth }
}
