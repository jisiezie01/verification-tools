// Count an impression only after one continuous second in a visible tab.
// A zero threshold also works for cards taller than the browser viewport.
export const observeVisibleOnce = (element: Element, onView: () => boolean) => {
    if (typeof IntersectionObserver === "undefined") return () => {}
    let visible = false
    let sent = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const cancel = () => { clearTimeout(timer); timer = undefined }
    const schedule = () => {
        cancel()
        if (!visible || sent || document.visibilityState !== "visible") return
        timer = setTimeout(() => {
            if (visible && document.visibilityState === "visible" && onView()) {
                sent = true
                observer.disconnect()
                document.removeEventListener("visibilitychange", schedule)
            }
        }, 1000)
    }
    const observer = new IntersectionObserver(entries => {
        visible = entries.some(entry => entry.target === element && entry.isIntersecting && entry.intersectionRect.width > 0 && entry.intersectionRect.height > 0)
        schedule()
    }, { threshold: 0 })
    observer.observe(element)
    document.addEventListener("visibilitychange", schedule)
    return () => { cancel(); observer.disconnect(); document.removeEventListener("visibilitychange", schedule) }
}
