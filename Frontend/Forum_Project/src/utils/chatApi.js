import { apiFetch } from '../AuthContext'

const parse = async (res) => {
  if (!res.ok) {
    let msg = 'Request failed.'
    try {
      const e = await res.json()
      msg = e.message || msg
    } catch {
      /* ignore */
    }
    throw new Error(msg)
  }
  return res.json()
}

export const fetchConversations = () =>
  apiFetch('/api/chat/conversations').then(parse)

export const startConversation = (userId) =>
  apiFetch(`/api/chat/conversations/with/${userId}`, { method: 'POST' }).then(parse)

export const fetchMessages = (conversationId) =>
  apiFetch(`/api/chat/conversations/${conversationId}/messages`).then(parse)

export const sendMessage = (payload) =>
  apiFetch('/api/chat/messages', {
    method: 'POST',
    body: JSON.stringify(payload),
  }).then(parse)

export const editMessage = (messageId, body) =>
  apiFetch(`/api/chat/messages/${messageId}`, {
    method: 'PUT',
    body: JSON.stringify({ body }),
  }).then(parse)

export const deleteMessage = (messageId) =>
  apiFetch(`/api/chat/messages/${messageId}`, { method: 'DELETE' })

export const deleteConversation = (conversationId) =>
  apiFetch(`/api/chat/conversations/${conversationId}`, { method: 'DELETE' })

export const markConversationRead = (conversationId) =>
  apiFetch(`/api/chat/conversations/${conversationId}/read`, { method: 'POST' })

export const fetchChatUnreadCount = () =>
  apiFetch('/api/chat/unread-count')
    .then(parse)
    .then((d) => d.count ?? 0)

export const searchUsers = (term) =>
  apiFetch(`/api/users/search?term=${encodeURIComponent(term)}`).then(parse)
