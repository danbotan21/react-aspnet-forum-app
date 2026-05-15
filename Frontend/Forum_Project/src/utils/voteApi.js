const VOTE_UP = 1
const VOTE_DOWN = -1

const safeJson = async (response) => {
  const text = await response.text()
  if (!text) return null
  return JSON.parse(text)
}

export const voteValueFromDirection = (direction) =>
  direction === 'up' ? VOTE_UP : VOTE_DOWN

export const fetchUserPostVotes = async (postIds, userId) => {
  if (!userId || postIds.length === 0) return {}

  const entries = await Promise.all(
    postIds.map(async (postId) => {
      try {
        const response = await fetch(`/api/vote/post/${postId}?userId=${userId}`)
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

export const fetchUserCommentVotes = async (commentIds, userId) => {
  if (!userId || commentIds.length === 0) return {}

  const entries = await Promise.all(
    commentIds.map(async (commentId) => {
      try {
        const response = await fetch(
          `/api/vote/comment/${commentId}?userId=${userId}`,
        )
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

export const submitPostVote = async ({ postId, voteType, userId }) => {
  const response = await fetch(`/api/vote?userId=${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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

export const deletePostVote = async ({ voteId, userId }) => {
  const response = await fetch(`/api/vote/${voteId}?userId=${userId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const payload = await safeJson(response)
    throw new Error(payload?.message || 'Failed to remove post vote')
  }
}

export const submitCommentVote = async ({ commentId, voteType, userId }) => {
  const response = await fetch(`/api/vote?userId=${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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

export const deleteCommentVote = async ({ voteId, userId }) => {
  const response = await fetch(`/api/vote/${voteId}?userId=${userId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const payload = await safeJson(response)
    throw new Error(payload?.message || 'Failed to remove comment vote')
  }
}
