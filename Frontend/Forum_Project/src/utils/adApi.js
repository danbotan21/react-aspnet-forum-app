import { apiFetch } from '../AuthContext'

// Fetches a small set of sponsored ad cards for the feed sidebar.
// Returns [] on any failure so the feed never breaks because of ads.
export const fetchFeedAds = async (count = 3) => {
  try {
    const response = await apiFetch(`/api/ads/feed?count=${count}`)
    if (!response.ok) return []
    const payload = await response.json()
    return Array.isArray(payload) ? payload : []
  } catch {
    return []
  }
}
