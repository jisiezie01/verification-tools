// Older catalogs store a single target; both shapes remain supported.
export const generatedTextIds = (link: string | Array<string>): Array<string> => [...new Set((Array.isArray(link) ? link : [link]).filter(Boolean))]
