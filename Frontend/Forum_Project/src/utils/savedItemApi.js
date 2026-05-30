const safeJson = async (response) => {
  const text = await response.text()
  if (!text) return null
  return JSON.parse(text)
}

// Returns a map of postId → { id, postId } for the authenticated user's saved posts.
export const fetchUserSavedPosts = async (postIds, token) => {
  if (!token || postIds.length === 0) return {}

  const entries = await Promise.all(
    postIds.map(async (postId) => {
      try {
        const response = await fetch(`/api/saveditem/post/${postId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!response.ok) return [postId, null]
        const savedItem = await response.json()
        return [postId, { id: savedItem.id, postId: savedItem.postId }]
      } catch {
        return [postId, null]
      }
    }),
  )

  return Object.fromEntries(entries)
}

// Returns all saved items for the authenticated user (used in the profile Saved tab).
export const fetchMySavedItems = async (token) => {
  if (!token) return []
  try {
    const response = await fetch('/api/saveditem/user', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) return []
    return response.json()
  } catch {
    return []
  }
}

export const savePost = async ({ postId, token }) => {
  const response = await fetch('/api/saveditem', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      postId,
      commentId: null,
    }),
  })

  if (!response.ok) {
    const payload = await safeJson(response)
    throw new Error(payload?.message || 'Failed to save post')
  }

  return response.json()
}

export const unsaveItem = async ({ savedItemId, token }) => {
  const response = await fetch(`/api/saveditem/${savedItemId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    const payload = await safeJson(response)
    throw new Error(payload?.message || 'Failed to remove saved item')
  }
}
