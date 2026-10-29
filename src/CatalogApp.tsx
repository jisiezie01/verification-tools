import { useEffect, useState } from "react"
import Navigation from "./Navigation"
import { importBrowserCatalog, initializeToolCatalog, readToolCatalog } from "./data/toolCatalog/functions"

const CatalogApp = () => {
    const [ready, setReady] = useState(false)
    const [error, setError] = useState("")
    const [empty, setEmpty] = useState(false)
    const [importing, setImporting] = useState(false)
    const load = async () => {
        try {
            await initializeToolCatalog(import.meta.env.DEV ? "/__catalog" : `${import.meta.env.BASE_URL}tool-catalog.json`, import.meta.env.DEV)
            const catalog = readToolCatalog()
            setEmpty(!catalog.categories.length && !catalog.tools.length)
            setReady(true)
        } catch (cause) { setError(cause instanceof Error ? cause.message : "The catalog could not be loaded.") }
    }
    useEffect(() => { void Promise.resolve().then(load) }, [])
    const importExisting = async () => {
        setImporting(true)
        try { await importBrowserCatalog(); window.location.reload() }
        catch (cause) { setError(cause instanceof Error ? cause.message : "Import failed."); setImporting(false) }
    }
    if (!ready) return <main className="min-h-dvh bg-slate-50 p-8 text-slate-800"><h1 className="text-lg font-semibold">{error ? "Tools could not be loaded" : "Loading tools..."}</h1>{error && <><p role="alert" className="mt-3">{error}</p><button className="mt-4 rounded-full bg-slate-900 px-4 py-2 text-white" onClick={() => { setError(""); void load() }}>Try again</button></>}</main>
    return <>{import.meta.env.DEV && empty && <aside className="flex flex-wrap items-center justify-center gap-3 bg-slate-900 px-4 py-3 text-sm text-white"><span>Start a new catalog or import your existing browser tools.</span><button disabled={importing} onClick={importExisting} className="rounded-full bg-white px-4 py-2 font-semibold text-slate-900 disabled:opacity-50">{importing ? "Importing..." : "Import browser tools"}</button>{error && <p role="alert">{error}</p>}</aside>}<Navigation /></>
}
export default CatalogApp
