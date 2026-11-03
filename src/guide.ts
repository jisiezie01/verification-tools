import { observeVisibleOnce } from "./data/analytics/functions"
import type {} from "./analytics"

const track = (event: string, parameters: Record<string, string> = {}) => {
    if (!import.meta.env.PROD || typeof window.gtag !== "function") return false
    try {
        window.gtag("event", event, {
            guide_id: "building_tools",
            guide_title: "Building guide",
            ...Object.fromEntries(Object.entries(parameters).map(([key, value]) => [key, value.slice(0, 100)])),
        })
        return true
    } catch { return false }
}

if (import.meta.env.PROD) {
    const main = document.querySelector("main")
    if (main) observeVisibleOnce(main, () => track("guide_view"))
    document.querySelectorAll<HTMLElement>(".guide-article section[id]").forEach(section => {
        const heading = section.querySelector("h2")
        if (heading) observeVisibleOnce(heading, () => track("guide_section_view", {
            guide_section_id: section.id,
            guide_section: heading.textContent?.trim() ?? section.id,
        }))
    })
    document.addEventListener("click", event => {
        const link = event.target instanceof Element ? event.target.closest("a") : null
        if (!link) return
        const destination = new URL(link.href, location.href)
        // Only fixed navigation metadata, never URL queries or entered form values.
        const section = destination.origin === location.origin && destination.pathname === location.pathname && destination.hash
            ? document.getElementById(decodeURIComponent(destination.hash.slice(1)))?.closest("section[id]")
            : link.closest("section[id]")
        const route = destination.pathname.replace(import.meta.env.BASE_URL, "").replace(/\/$/, "")
        const target = destination.origin !== location.origin ? "external_link"
            : destination.hash && destination.pathname === location.pathname ? `section:${section?.id ?? "top"}`
            : ({ "": "home", tools: "workspace", "create-tool": "builder", "manage-tools": "manage_tools", guide: "guide" }[route] ?? "site_link")
        track("guide_click", {
            guide_section_id: section?.id ?? "navigation",
            guide_section: section?.querySelector("h2")?.textContent?.trim() ?? "Navigation",
            guide_target: target,
            guide_link_text: link.textContent?.trim() ?? "",
            guide_click_source: link.closest(".guide-nav") ? "contents" : link.closest("article") ? "article" : "navigation",
        })
    })
}
