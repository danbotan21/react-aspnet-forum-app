// API client for the application-wide admin panel.
// Every endpoint requires the caller to have the global "Admin" role (enforced server-side).

const safeText = async (res) => {
  const text = await res.text()
  return text || null
}

const authHeaders = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
})

// ─── DASHBOARD ───────────────────────────────────────────────────────────────

export const fetchAdminStats = async (token) => {
  const res = await fetch('/api/admin/stats', { headers: authHeaders(token) })
  if (!res.ok) throw new Error('Failed to load stats')
  return res.json()
}

// ─── USERS ─────────────────────────────────────────────────────────────────────

export const fetchAdminUsers = async (token, search = '') => {
  const qs = search ? `?search=${encodeURIComponent(search)}` : ''
  const res = await fetch(`/api/admin/users${qs}`, { headers: authHeaders(token) })
  if (!res.ok) throw new Error('Failed to load users')
  return res.json()
}

export const banUser = async (userId, reason, token) => {
  const res = await fetch(`/api/admin/users/${userId}/ban`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ reason }),
  })
  const text = await safeText(res)
  if (!res.ok) throw new Error(text || 'Failed to ban user')
  return text
}

export const unbanUser = async (userId, token) => {
  const res = await fetch(`/api/admin/users/${userId}/unban`, {
    method: 'POST',
    headers: authHeaders(token),
  })
  const text = await safeText(res)
  if (!res.ok) throw new Error(text || 'Failed to unban user')
  return text
}

export const changeUserRole = async (userId, role, token) => {
  const res = await fetch(`/api/admin/users/${userId}/role`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ role }),
  })
  const text = await safeText(res)
  if (!res.ok) throw new Error(text || 'Failed to change role')
  return text
}

// ─── COMMUNITIES ─────────────────────────────────────────────────────────────

export const fetchAdminCommunities = async (token) => {
  const res = await fetch('/api/admin/communities', { headers: authHeaders(token) })
  if (!res.ok) throw new Error('Failed to load communities')
  return res.json()
}

export const deleteCommunityAdmin = async (communityId, token) => {
  const res = await fetch(`/api/admin/communities/${communityId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  const text = await safeText(res)
  if (!res.ok) throw new Error(text || 'Failed to delete community')
  return text
}

// ─── CONTENT ─────────────────────────────────────────────────────────────────

export const fetchAdminPosts = async (token, search = '', page = 1, pageSize = 20) => {
  const params = new URLSearchParams({ page, pageSize })
  if (search) params.set('search', search)
  const res = await fetch(`/api/admin/posts?${params}`, { headers: authHeaders(token) })
  if (!res.ok) throw new Error('Failed to load posts')
  return res.json()
}

export const fetchAdminComments = async (token, search = '', page = 1, pageSize = 20) => {
  const params = new URLSearchParams({ page, pageSize })
  if (search) params.set('search', search)
  const res = await fetch(`/api/admin/comments?${params}`, { headers: authHeaders(token) })
  if (!res.ok) throw new Error('Failed to load comments')
  return res.json()
}

export const deletePostAdmin = async (postId, token) => {
  const res = await fetch(`/api/admin/posts/${postId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  const text = await safeText(res)
  if (!res.ok) throw new Error(text || 'Failed to delete post')
  return text
}

export const deleteCommentAdmin = async (commentId, token) => {
  const res = await fetch(`/api/admin/comments/${commentId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  const text = await safeText(res)
  if (!res.ok) throw new Error(text || 'Failed to delete comment')
  return text
}

// ─── REPORTS ─────────────────────────────────────────────────────────────────

export const fetchAdminReports = async (token, status = '') => {
  const qs = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : ''
  const res = await fetch(`/api/admin/reports${qs}`, { headers: authHeaders(token) })
  if (!res.ok) throw new Error('Failed to load reports')
  return res.json()
}

export const dismissReportAdmin = async (reportId, token) => {
  const res = await fetch(`/api/admin/reports/${reportId}/dismiss`, {
    method: 'POST',
    headers: authHeaders(token),
  })
  const text = await safeText(res)
  if (!res.ok) throw new Error(text || 'Failed to dismiss report')
  return text
}

export const removeReportContentAdmin = async (reportId, token) => {
  const res = await fetch(`/api/admin/reports/${reportId}/remove`, {
    method: 'POST',
    headers: authHeaders(token),
  })
  const text = await safeText(res)
  if (!res.ok) throw new Error(text || 'Failed to remove content')
  return text
}

export const deleteReportAdmin = async (reportId, token) => {
  const res = await fetch(`/api/admin/reports/${reportId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  const text = await safeText(res)
  if (!res.ok) throw new Error(text || 'Failed to delete report')
  return text
}

// ─── MESSAGES (Contact Us inbox) ───────────────────────────────────────────────

export const fetchAdminMessages = async (token) => {
  const res = await fetch('/api/admin/messages', { headers: authHeaders(token) })
  if (!res.ok) throw new Error('Failed to load messages')
  return res.json()
}

export const replyToMessageAdmin = async (messageId, reply, token) => {
  const res = await fetch(`/api/admin/messages/${messageId}/reply`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ reply }),
  })
  const text = await safeText(res)
  if (!res.ok) throw new Error(text || 'Failed to send reply')
  return text
}

export const deleteMessageAdmin = async (messageId, token) => {
  const res = await fetch(`/api/admin/messages/${messageId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  const text = await safeText(res)
  if (!res.ok) throw new Error(text || 'Failed to delete message')
  return text
}

// ─── AUDIT LOG ─────────────────────────────────────────────────────────────────

export const fetchAdminLogs = async (token, limit = 100) => {
  const res = await fetch(`/api/admin/logs?limit=${limit}`, { headers: authHeaders(token) })
  if (!res.ok) throw new Error('Failed to load audit log')
  return res.json()
}
