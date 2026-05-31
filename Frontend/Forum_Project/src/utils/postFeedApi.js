import { apiFetch } from '../AuthContext'

const buildQueryString = (params) => {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value))
    }
  })
  return searchParams.toString()
}

const parsePostBatch = (payload, fallbackPage, fallbackPageSize) => {
  if (Array.isArray(payload)) {
    return {
      items: payload,
      page: fallbackPage,
      pageSize: fallbackPageSize,
      hasMore: false,
    }
  }

  return {
    items: Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload?.Items)
        ? payload.Items
        : [],
    page: payload?.page ?? payload?.Page ?? fallbackPage,
    pageSize: payload?.pageSize ?? payload?.PageSize ?? fallbackPageSize,
    hasMore: payload?.hasMore === true || payload?.HasMore === true,
  }
}

export const fetchPostsPage = async ({ sortBy, page, pageSize, token }) => {
  const query = buildQueryString({ sortBy, page, pageSize })
  const response = await apiFetch(`/api/posts?${query}`)
  if (!response.ok) {
    throw new Error(`Failed to load posts (${response.status})`)
  }
  const payload = await response.json()
  return parsePostBatch(payload, page, pageSize)
}

export const fetchCommunityPostsPage = async ({
  communityId,
  sortBy,
  page,
  pageSize,
  token,
}) => {
  const query = buildQueryString({ sortBy, page, pageSize })
  const response = await apiFetch(`/api/posts/community/${communityId}?${query}`)
  if (!response.ok) {
    throw new Error(`Failed to load community posts (${response.status})`)
  }
  const payload = await response.json()
  return parsePostBatch(payload, page, pageSize)
}

export const fetchUserPostsPage = async ({ userId, page, pageSize, token }) => {
  const query = buildQueryString({ page, pageSize })
  const response = await apiFetch(`/api/posts/user/${userId}?${query}`)
  if (!response.ok) {
    throw new Error(`Failed to load user posts (${response.status})`)
  }
  const payload = await response.json()
  return parsePostBatch(payload, page, pageSize)
}
