const safeText = async (response) => {
  const text = await response.text()
  return text || null
}

const authHeaders = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
})

// Fetch community by slug and return its data (including id)
export const fetchCommunityBySlug = async (slug) => {
  const res = await fetch(`/api/Communities/${slug}`)
  if (!res.ok) throw new Error('Community not found')
  return res.json()
}

// Returns current user's role in the community: "owner" | "moderator" | "member" | null
export const fetchMyRole = async (communityId, token) => {
  if (!token) return null
  try {
    const res = await fetch(`/api/Communities/${communityId}/myrole`, {
      headers: authHeaders(token),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data?.role ?? null
  } catch {
    return null
  }
}

// Returns all active (non-banned) members of the community
export const fetchMembers = async (communityId, token) => {
  const res = await fetch(`/api/Communities/${communityId}/members`, {
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error('Failed to fetch members')
  return res.json()
}

// Returns banned members of the community
export const fetchBannedMembers = async (communityId, token) => {
  const res = await fetch(`/api/Communities/${communityId}/banned`, {
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error('Failed to fetch banned members')
  return res.json()
}

// Returns stats: membersCount, moderatorsCount, postsCount, bannedCount
export const fetchCommunityStats = async (communityId, token) => {
  const res = await fetch(`/api/Communities/${communityId}/stats`, {
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error('Failed to fetch stats')
  return res.json()
}

// Promote a member to moderator (owner only)
export const promoteModerator = async (communityId, targetUserId, token) => {
  const res = await fetch(`/api/Communities/${communityId}/moderators/${targetUserId}`, {
    method: 'POST',
    headers: authHeaders(token),
  })
  const text = await safeText(res)
  if (!res.ok) throw new Error(text || 'Failed to promote member')
  return text
}

// Demote a moderator to member (owner only)
export const demoteModerator = async (communityId, targetUserId, token) => {
  const res = await fetch(`/api/Communities/${communityId}/moderators/${targetUserId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  const text = await safeText(res)
  if (!res.ok) throw new Error(text || 'Failed to demote moderator')
  return text
}

// Kick a member out of the community
export const kickMember = async (communityId, targetUserId, token) => {
  const res = await fetch(`/api/Communities/${communityId}/members/${targetUserId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  const text = await safeText(res)
  if (!res.ok) throw new Error(text || 'Failed to kick member')
  return text
}

// Ban a member with a reason
export const banMember = async (communityId, targetUserId, reason, token) => {
  const res = await fetch(`/api/Communities/${communityId}/ban/${targetUserId}`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ reason }),
  })
  const text = await safeText(res)
  if (!res.ok) throw new Error(text || 'Failed to ban member')
  return text
}

// Unban a member
export const unbanMember = async (communityId, targetUserId, token) => {
  const res = await fetch(`/api/Communities/${communityId}/ban/${targetUserId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  const text = await safeText(res)
  if (!res.ok) throw new Error(text || 'Failed to unban member')
  return text
}

// Transfer community ownership to a member/moderator
export const transferOwnership = async (communityId, newOwnerId, token) => {
  const res = await fetch(`/api/Communities/${communityId}/transfer/${newOwnerId}`, {
    method: 'POST',
    headers: authHeaders(token),
  })
  const text = await safeText(res)
  if (!res.ok) throw new Error(text || 'Failed to transfer ownership')
  return text
}
