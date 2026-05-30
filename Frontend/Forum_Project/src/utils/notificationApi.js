const authHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
})

export const fetchNotifications = async (token) => {
  const res = await fetch('/api/notification', { headers: authHeaders(token) })
  if (!res.ok) throw new Error('Failed to fetch notifications')
  return res.json()
}

export const fetchUnreadCount = async (token) => {
  const res = await fetch('/api/notification/unread-count', { headers: authHeaders(token) })
  if (!res.ok) return 0
  const data = await res.json()
  return data.count ?? 0
}

export const markNotificationAsRead = async (id, token) => {
  const res = await fetch(`/api/notification/${id}/mark-as-read`, {
    method: 'PUT',
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error('Failed to mark notification as read')
  return res.json()
}

export const markAllNotificationsAsRead = async (token) => {
  const res = await fetch('/api/notification/mark-all-as-read', {
    method: 'PUT',
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error('Failed to mark all as read')
  return res.json()
}

export const deleteNotification = async (id, token) => {
  const res = await fetch(`/api/notification/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error('Failed to delete notification')
  return res.json()
}
