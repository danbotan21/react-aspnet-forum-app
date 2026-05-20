const safeJson = async (response) => {
  const text = await response.text()
  if (!text) return null
  return JSON.parse(text)
}

export const fetchUserSavedPosts = async (postIds, userId) => {
  if (!userId || postIds.length === 0) return {}

  const entries = await Promise.all(
    postIds.map(async (postId) => {
      try {
        const response = await fetch(
          `/api/saveditem/post/${postId}?userId=${userId}`,
        )
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

export const savePost = async ({ postId, userId }) => {
  const response = await fetch(`/api/saveditem?userId=${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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

export const unsaveItem = async ({ savedItemId, userId }) => {
  const response = await fetch(
    `/api/saveditem/${savedItemId}?userId=${userId}`,
    {
      method: 'DELETE',
    },
  )

  if (!response.ok) {
    const payload = await safeJson(response)
    throw new Error(payload?.message || 'Failed to remove saved item')
  }
}
