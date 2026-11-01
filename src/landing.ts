// Keep previously shared hash-based workspace links working after the route migration.
const legacyRoute = window.location.hash.slice(1)
if (/^\/(tools(?:\/|\?|$)|create-tool(?:\?|$)|manage-tools(?:\?|$))/.test(legacyRoute)) {
    window.location.replace(`${import.meta.env.BASE_URL}${legacyRoute.slice(1)}`)
}
