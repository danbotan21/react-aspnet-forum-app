const safeText = async (res) => {
  const text = await res.text()
  return text || null
}

// Submit a report for a post (type=0) or comment (type=1)
export const submitReport = async ({ type, reportedItemId, reason, token }) => {
  const res = await fetch('/api/report', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ type, reportedItemId, reason }),
  })
  const text = await safeText(res)
  if (!res.ok) throw new Error(text || 'Failed to submit report')
  return text
}

// Get pending reports for a community (mod only)
export const fetchCommunityReports = async (communityId, token) => {
  const res = await fetch(`/api/report/community/${communityId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to fetch reports')
  return res.json()
}

// Dismiss a report (mod only)
export const dismissReport = async (reportId, token) => {
  const res = await fetch(`/api/report/${reportId}/dismiss`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  const text = await safeText(res)
  if (!res.ok) throw new Error(text || 'Failed to dismiss report')
  return text
}

// Remove reported content (mod only) — deletes post or comment
export const removeReportedContent = async (reportId, token) => {
  const res = await fetch(`/api/report/${reportId}/remove`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  const text = await safeText(res)
  if (!res.ok) throw new Error(text || 'Failed to remove content')
  return text
}
