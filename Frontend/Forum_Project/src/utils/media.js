const BACKEND_ORIGIN = import.meta.env.VITE_BACKEND_ORIGIN || 'http://localhost:5129'

const toBackendAbsolutePath = (value) => {
  const normalized = value.replace(/\\/g, '/')
  if (normalized.startsWith('/')) return `${BACKEND_ORIGIN}${normalized}`
  return `${BACKEND_ORIGIN}/${normalized}`
}

export const normalizeImageSrc = (value) => {
  if (!value || typeof value !== 'string') return null

  let trimmed = value.trim()
  if (!trimmed) return null

  const hasWrappedQuotes =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))

  if (hasWrappedQuotes) {
    trimmed = trimmed.slice(1, -1).trim()
    if (!trimmed) return null
  }

  if (trimmed.toLowerCase().startsWith('data:')) return null
  if (trimmed.startsWith('blob:')) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed

  return toBackendAbsolutePath(trimmed)
}
