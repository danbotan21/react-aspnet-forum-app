import { apiFetch } from '../AuthContext'

const safeText = async (response) => {
  const text = await response.text()
  return text || null
}

const authHeaders = () => ({
  'Content-Type': 'application/json',
})

// Fetch community by slug (uses raw fetch since it's called with optional token)
export const fetchCommunityBySlug = async (slug, token) => {
  const res = await apiFetch(`/api/Communities/${slug}`)
  if (!res.ok) throw new Error('Community not found')
  return res.json()
}

export const fetchMyRole = async (communityId, token) => {
  if (!token) return null
  try {
    const res = await apiFetch(`/api/Communities/${communityId}/myrole`)
    if (!res.ok) return null
    const data = await res.json()
    return data?.role ?? null
  } catch {
    return null
  }
}

export const fetchMembers = async (communityId, token) => {
  const res = await apiFetch(`/api/Communities/${communityId}/members`)
  if (!res.ok) throw new Error('Failed to fetch members')
  return res.json()
}

export const fetchBannedMembers = async (communityId, token) => {
  const res = await apiFetch(`/api/Communities/${communityId}/banned`)
  if (!res.ok) throw new Error('Failed to fetch banned members')
  return res.json()
}

export const fetchCommunityStats = async (communityId, token) => {
  const res = await apiFetch(`/api/Communities/${communityId}/stats`)
  if (!res.ok) throw new Error('Failed to fetch stats')
  return res.json()
}

export const promoteModerator = async (communityId, targetUserId, token) => {
  const res = await apiFetch(
    `/api/Communities/${communityId}/moderators/${targetUserId}`,
    {
      method: 'POST',
      headers: authHeaders(),
    },
  )
  const text = await safeText(res)
  if (!res.ok) throw new Error(text || 'Failed to promote member')
  return text
}

export const demoteModerator = async (communityId, targetUserId, token) => {
  const res = await apiFetch(
    `/api/Communities/${communityId}/moderators/${targetUserId}`,
    {
      method: 'DELETE',
      headers: authHeaders(),
    },
  )
  const text = await safeText(res)
  if (!res.ok) throw new Error(text || 'Failed to demote moderator')
  return text
}

export const kickMember = async (communityId, targetUserId, token) => {
  const res = await apiFetch(
    `/api/Communities/${communityId}/members/${targetUserId}`,
    {
      method: 'DELETE',
      headers: authHeaders(),
    },
  )
  const text = await safeText(res)
  if (!res.ok) throw new Error(text || 'Failed to kick member')
  return text
}

export const banMember = async (communityId, targetUserId, reason, token) => {
  const res = await apiFetch(
    `/api/Communities/${communityId}/ban/${targetUserId}`,
    {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ reason }),
    },
  )
  const text = await safeText(res)
  if (!res.ok) throw new Error(text || 'Failed to ban member')
  return text
}

export const unbanMember = async (communityId, targetUserId, token) => {
  const res = await apiFetch(
    `/api/Communities/${communityId}/ban/${targetUserId}`,
    {
      method: 'DELETE',
      headers: authHeaders(),
    },
  )
  const text = await safeText(res)
  if (!res.ok) throw new Error(text || 'Failed to unban member')
  return text
}

export const transferOwnership = async (communityId, newOwnerId, token) => {
  const res = await apiFetch(
    `/api/Communities/${communityId}/transfer/${newOwnerId}`,
    {
      method: 'POST',
      headers: authHeaders(),
    },
  )
  const text = await safeText(res)
  if (!res.ok) throw new Error(text || 'Failed to transfer ownership')
  return text
}

export const pinPost = async (communityId, postId, token) => {
  const res = await apiFetch(
    `/api/Communities/${communityId}/posts/${postId}/pin`,
    {
      method: 'POST',
      headers: authHeaders(),
    },
  )
  const text = await safeText(res)
  if (!res.ok) throw new Error(text || 'Failed to pin post')
  return text
}

export const unpinPost = async (communityId, postId, token) => {
  const res = await apiFetch(
    `/api/Communities/${communityId}/posts/${postId}/pin`,
    {
      method: 'DELETE',
      headers: authHeaders(),
    },
  )
  const text = await safeText(res)
  if (!res.ok) throw new Error(text || 'Failed to unpin post')
  return text
}

export const fetchModLog = async (communityId, token, actionType = null) => {
  const params =
    actionType && actionType !== 'all' ? `?actionType=${actionType}` : ''
  const res = await apiFetch(`/api/Communities/${communityId}/modlog${params}`)
  if (!res.ok) throw new Error('Failed to fetch mod log')
  return res.json()
}

export const fetchPinnedPosts = async (communityId, token) => {
  const res = await apiFetch(`/api/Communities/${communityId}/posts/pinned`)
  if (!res.ok) throw new Error('Failed to fetch pinned posts')
  return res.json()
}

export const fetchCommunityPostsForMod = async (communityId, token) => {
  const res = await apiFetch(
    `/api/Posts/community/${communityId}?sortBy=new&page=1&pageSize=50`,
  )
  if (!res.ok) throw new Error('Failed to fetch community posts')
  return res.json()
}

export const deletePost = async (postId, token) => {
  const res = await apiFetch(`/api/Posts/${postId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  const text = await safeText(res)
  if (!res.ok) throw new Error(text || 'Failed to delete post')
  return text
}

export const fetchMyBannedStatus = async (communityId, token) => {
  if (!token) return { isBanned: false, banReason: null }
  try {
    const res = await apiFetch(`/api/Communities/${communityId}/mybannedstatus`)
    if (!res.ok) return { isBanned: false, banReason: null }
    return res.json()
  } catch {
    return { isBanned: false, banReason: null }
  }
}

export const fetchMyCommunities = async (token) => {
  const res = await apiFetch('/api/communities/my')
  if (!res.ok) throw new Error('Failed to fetch your communities')
  return res.json()
}
