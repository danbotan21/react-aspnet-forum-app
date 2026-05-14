const BACKEND_ORIGIN = import.meta.env.VITE_BACKEND_ORIGIN || 'http://localhost:5129'

const DATA_URL_PREFIX = 'data:image/'
const RAW_BASE64_PATTERN = /^[A-Za-z0-9+/=\s]+$/

const guessMimeTypeFromBase64 = (raw) => {
  if (raw.startsWith('/9j/')) return 'image/jpeg'
  if (raw.startsWith('iVBORw0KGgo')) return 'image/png'
  if (raw.startsWith('R0lGOD')) return 'image/gif'
  if (raw.startsWith('UklGR')) return 'image/webp'
  return 'image/jpeg'
}

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

  if (trimmed.toLowerCase().startsWith(DATA_URL_PREFIX)) return trimmed
  if (trimmed.toLowerCase().startsWith('data:')) return trimmed
  if (trimmed.startsWith('blob:')) return trimmed
  if (/^https?:\/\//i.test(trimmed)) return trimmed

  const compactBase64 = trimmed.replace(/\s+/g, '')
  if (
    compactBase64.length > 100 &&
    RAW_BASE64_PATTERN.test(compactBase64)
  ) {
    return `data:${guessMimeTypeFromBase64(compactBase64)};base64,${compactBase64}`
  }

  return toBackendAbsolutePath(trimmed)
}
