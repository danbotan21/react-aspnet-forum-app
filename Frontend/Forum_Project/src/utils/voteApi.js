const VOTE_UP = 1
const VOTE_DOWN = -1

const safeJson = async (response) => {
  const text = await response.text()
  if (!text) return null
  return JSON.parse(text)
}

export const voteValueFromDirection = (direction) =>
  direction === 'up' ? VOTE_UP : VOTE_DOWN

// Returns a map of postId → { id, type } for the authenticated user's votes on the given posts.
export const fetchUserPostVotes = async (postIds, token) => {
  if (!token || postIds.length === 0) return {}

  const entries = await Promise.all(
    postIds.map(async (postId) => {
      try {
        const response = await fetch(`/api/vote/post/${postId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!response.ok) return [postId, { id: null, type: 0 }]
        const vote = await response.json()
        return [postId, { id: vote.id, type: vote.type }]
      } catch {
        return [postId, { id: null, type: 0 }]
      }
    }),
  )

  return Object.fromEntries(entries)
}

// Returns a map of commentId → { id, type } for the authenticated user's votes on the given comments.
export const fetchUserCommentVotes = async (commentIds, token) => {
  if (!token || commentIds.length === 0) return {}

  const entries = await Promise.all(
    commentIds.map(async (commentId) => {
      try {
        const response = await fetch(`/api/vote/comment/${commentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!response.ok) return [commentId, { id: null, type: 0 }]
        const vote = await response.json()
        return [commentId, { id: vote.id, type: vote.type }]
      } catch {
        return [commentId, { id: null, type: 0 }]
      }
    }),
  )

  return Object.fromEntries(entries)
}

// Returns all votes cast by the authenticated user (used for profile upvoted/downvoted tabs).
export const fetchMyVotes = async (token) => {
  if (!token) return []
  try {
    const response = await fetch('/api/vote/mine', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) return []
    return response.json()
  } catch {
    return []
  }
}

export const submitPostVote = async ({ postId, voteType, token }) => {
  const response = await fetch('/api/vote', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      postId,
      commentId: null,
      type: voteType,
    }),
  })

  if (!response.ok) {
    const payload = await safeJson(response)
    throw new Error(payload?.message || 'Failed to vote on post')
  }

  return response.json()
}

export const deletePostVote = async ({ voteId, token }) => {
  const response = await fetch(`/api/vote/${voteId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    const payload = await safeJson(response)
    throw new Error(payload?.message || 'Failed to remove post vote')
  }
}

export const submitCommentVote = async ({ commentId, voteType, token }) => {
  const response = await fetch('/api/vote', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      postId: null,
      commentId,
      type: voteType,
    }),
  })

  if (!response.ok) {
    const payload = await safeJson(response)
    throw new Error(payload?.message || 'Failed to vote on comment')
  }

  return response.json()
}

export const deleteCommentVote = async ({ voteId, token }) => {
  const response = await fetch(`/api/vote/${voteId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    const payload = await safeJson(response)
    throw new Error(payload?.message || 'Failed to remove comment vote')
  }
}
