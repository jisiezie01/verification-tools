import type { ToolType } from "./types"

export type ToolAnalyticsContext = { categoryName: string; source: "workspace" | "tool_page" }
export type ToolAnalyticsEvent = "tool_use" | "tool_generate" | "tool_copy" | "tool_reset"

declare global {
    interface Window {
        gtag?: (command: "event", name: string, parameters: Record<string, string>) => void
    }
}

// Reuse the Google tag in the HTML. Only explicitly enabled runtime screens report usage.
export const trackToolEvent = (event: ToolAnalyticsEvent, tool: ToolType, context?: ToolAnalyticsContext): boolean => {
    if (!import.meta.env.PROD || !context || typeof window === "undefined") return false
    try {
        if (typeof window.gtag !== "function") return false
        // Allowlist catalog metadata: never include input values, templates, or copied text.
        window.gtag("event", event, {
            tool_id: tool.id.slice(0, 100),
            tool_name: tool.name.slice(0, 100),
            tool_category_id: tool.categoryId.slice(0, 100),
            tool_category: context.categoryName.slice(0, 100),
            tool_source: context.source,
        })
        return true
    } catch {
        // Analytics must never interrupt generating, copying, or resetting a tool.
        return false
    }
}
