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

export const followUser = (userId) =>
  apiFetch(`/api/follow/${userId}`, { method: 'POST' }).then(parse)

export const unfollowUser = (userId) =>
  apiFetch(`/api/follow/${userId}`, { method: 'DELETE' }).then(parse)

export const fetchFollowStatus = (userId) =>
  apiFetch(`/api/follow/status/${userId}`).then(parse)

export const fetchFollowers = (userId) =>
  apiFetch(`/api/follow/${userId}/followers`).then(parse)

export const fetchFollowing = (userId) =>
  apiFetch(`/api/follow/${userId}/following`).then(parse)
