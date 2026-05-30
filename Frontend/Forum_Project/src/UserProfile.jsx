import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import './Styles/UserProfile.css'
import avatar from './img/avatar.webp'
import nature from './img/nature.jpg'
import { ProfileOverviewTab } from './ProfileOverviewTab'
import { ProfilePostsTab } from './ProfilePostsTab'
import { ProfileCommentsTab } from './ProfileCommentsTab'
import { ProfileSavedTab } from './ProfileSavedTab'
import { ProfileVotedTab } from './ProfileVotedTab'
import { useAuth } from './AuthContext'
import { normalizeImageSrc } from './utils/media'
import { fetchUserPostsPage } from './utils/postFeedApi'
import { fetchMySavedItems, unsaveItem, savePost } from './utils/savedItemApi'
import { fetchMyVotes } from './utils/voteApi'

const PROFILE_TABS = [
  'Overview',
  'Posts',
  'Comments',
  'Saved',
  'Upvoted',
  'Downvoted',
]

const getCommunitySlug = (community) => community.replace(/^r\//, '')
const getCommentPostRoute = (comment) =>
  `/community/${encodeURIComponent(getCommunitySlug(comment.community))}/post/${comment.postId}`

const formatDate = (value) => {
  if (!value) return 'Unknown date'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown date'
  return date.toLocaleDateString()
}

const formatCakeDay = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
}

const mapPostToProfilePost = (post) => ({
  id: post.id,
  community: `r/${post.communitySlug}`,
  time: formatDate(post.createdAt),
  title: post.title,
  text: post.body || '',
  image: normalizeImageSrc(post.imageUrl),
  votes: post.votes ?? 0,
  comments: post.commentsCount ?? 0,
})

const mapPostToVotedItem = (vote, post) => {
  if (!post) return null
  return {
    id: `vote-${vote.id}`,
    community: `r/${post.communitySlug}`,
    author: `u/${post.authorName}`,
    time: formatDate(vote.votedAt),
    title: post.title,
    text: post.body || '',
    image: normalizeImageSrc(post.imageUrl),
    votes: post.votes ?? 0,
    comments: post.commentsCount ?? 0,
    postId: post.id,
  }
}

export function UserProfile() {
  const { username } = useParams()
  const navigate = useNavigate()
  const { user: authUser, token } = useAuth()

  const loggedUser = authUser?.userName?.trim() || ''
  const displayName = decodeURIComponent(username ?? 'guest').trim() || 'guest'
  const isOwnProfile =
    loggedUser.length > 0 &&
    displayName.toLowerCase() === loggedUser.toLowerCase()

  const tabs = PROFILE_TABS

  const [activeTab, setActiveTab] = useState('Overview')
  const [profileUser, setProfileUser] = useState(null)
  const [posts, setPosts] = useState([])
  const [totalPostsCount, setTotalPostsCount] = useState(0)
  const [comments, setComments] = useState([])
  const [savedItems, setSavedItems] = useState([])
  const [upvotedPosts, setUpvotedPosts] = useState([])
  const [downvotedPosts, setDownvotedPosts] = useState([])
  const [isProfileLoading, setIsProfileLoading] = useState(true)
  const [isActivityLoading, setIsActivityLoading] = useState(false)
  const [isPostsLoading, setIsPostsLoading] = useState(false)
  const [isPostsLoadingMore, setIsPostsLoadingMore] = useState(false)
  const [postsPage, setPostsPage] = useState(1)
  const [hasMorePosts, setHasMorePosts] = useState(true)
  const [postsError, setPostsError] = useState(null)
  const [isProfileDataLoading, setIsProfileDataLoading] = useState(false)
  const [profileError, setProfileError] = useState(null)

  const [openMorePostId, setOpenMorePostId] = useState(null)
  const [postMenuPos, setPostMenuPos] = useState({ top: 0, right: 0 })
  const [openMoreCommentId, setOpenMoreCommentId] = useState(null)
  const [commentMenuPos, setCommentMenuPos] = useState({ top: 0, right: 0 })
  const [openMoreSavedId, setOpenMoreSavedId] = useState(null)
  const [savedMenuPos, setSavedMenuPos] = useState({ top: 0, right: 0 })
  const [openMoreUpvotedId, setOpenMoreUpvotedId] = useState(null)
  const [upvotedMenuPos, setUpvotedMenuPos] = useState({ top: 0, right: 0 })
  const [openMoreDownvotedId, setOpenMoreDownvotedId] = useState(null)
  const [downvotedMenuPos, setDownvotedMenuPos] = useState({ top: 0, right: 0 })

  const [showDeletePostModal, setShowDeletePostModal] = useState(false)
  const [postToDeleteId, setPostToDeleteId] = useState(null)
  const [isDeletingPost, setIsDeletingPost] = useState(false)
  const [deletePostError, setDeletePostError] = useState('')
  const [profilePostSavedMap, setProfilePostSavedMap] = useState({})

  const postsLoadMoreRef = useRef(null)

  useEffect(() => {
    const close = (e) => {
      if (
        !e.target.closest('.pp-more-button') &&
        !e.target.closest('.pp-global-menu')
      ) {
        setOpenMorePostId(null)
        setOpenMoreCommentId(null)
        setOpenMoreSavedId(null)
        setOpenMoreUpvotedId(null)
        setOpenMoreDownvotedId(null)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  useEffect(() => {
    setActiveTab('Overview')
    setOpenMorePostId(null)
    setOpenMoreCommentId(null)
    setOpenMoreSavedId(null)
    setOpenMoreUpvotedId(null)
    setOpenMoreDownvotedId(null)
  }, [displayName, isOwnProfile])

  useEffect(() => {
    if (!tabs.includes(activeTab)) {
      setActiveTab('Overview')
    }
  }, [activeTab, tabs])

  useEffect(() => {
    if (!displayName) return

    let cancelled = false

    const loadProfile = async () => {
      setIsProfileLoading(true)
      setProfileError(null)
      setProfileUser(null)

      try {
        const response = await fetch(
          `/api/users/by-username/${encodeURIComponent(displayName)}`,
        )

        if (!response.ok) {
          throw new Error('Profile not found')
        }

        const data = await response.json()
        if (!cancelled) {
          setProfileUser(data)
        }
      } catch {
        if (!cancelled) {
          setProfileError('Profile not found')
          setProfileUser(null)
        }
      } finally {
        if (!cancelled) {
          setIsProfileLoading(false)
        }
      }
    }

    loadProfile()

    return () => {
      cancelled = true
    }
  }, [displayName])

  useEffect(() => {
    if (!profileUser?.id) {
      setPosts([])
      setTotalPostsCount(0)
      setComments([])
      setPostsPage(1)
      setHasMorePosts(true)
      setPostsError(null)
      return
    }

    let cancelled = false

    const loadUserActivity = async () => {
      setIsActivityLoading(true)
      try {
        const commentsResponse = await fetch(
          `/api/comments/user/${profileUser.id}`,
        )
        const fetchedComments = commentsResponse.ok
          ? await commentsResponse.json()
          : []

        const commentPostIds = [
          ...new Set(fetchedComments.map((comment) => comment.postId)),
        ].filter(Boolean)

        const commentPosts = await Promise.all(
          commentPostIds.map(async (postId) => {
            try {
              const response = await fetch(`/api/posts/${postId}`)
              if (!response.ok) return [postId, null]
              return [postId, await response.json()]
            } catch {
              return [postId, null]
            }
          }),
        )

        const commentPostsById = new Map(
          commentPosts.filter(([, post]) => post !== null),
        )

        if (cancelled) return

        setComments(
          fetchedComments.map((comment) => {
            const relatedPost = commentPostsById.get(comment.postId)
            return {
              id: comment.id,
              community: relatedPost
                ? `r/${relatedPost.communitySlug}`
                : 'r/unknown',
              postTitle: relatedPost?.title || `Post #${comment.postId}`,
              postId: comment.postId,
              content: comment.body,
              votes: comment.votes ?? 0,
              time: formatDate(comment.createdAt),
            }
          }),
        )
      } catch {
        if (!cancelled) {
          setComments([])
        }
      } finally {
        if (!cancelled) {
          setIsActivityLoading(false)
        }
      }
    }

    loadUserActivity()

    return () => {
      cancelled = true
    }
  }, [profileUser?.id])

  useEffect(() => {
    if (!profileUser?.id) return

    let cancelled = false
    const isInitialPage = postsPage === 1

    const loadPostsPage = async () => {
      if (isInitialPage) {
        setIsPostsLoading(true)
      } else {
        setIsPostsLoadingMore(true)
      }

      try {
        const batch = await fetchUserPostsPage({
          userId: profileUser.id,
          page: postsPage,
          pageSize: 15,
        })

        if (cancelled) return

        const mappedPosts = batch.items.map(mapPostToProfilePost)
        setPosts((currentPosts) => {
          if (isInitialPage) return mappedPosts
          const existingIds = new Set(currentPosts.map((post) => post.id))
          const nextItems = mappedPosts.filter(
            (post) => !existingIds.has(post.id),
          )
          return [...currentPosts, ...nextItems]
        })
        if (isInitialPage) {
          setTotalPostsCount(mappedPosts.length)
        } else {
          setTotalPostsCount(
            (currentTotal) => currentTotal + mappedPosts.length,
          )
        }
        setHasMorePosts(batch.hasMore)
        setPostsError(null)
      } catch (error) {
        if (!cancelled) {
          setPostsError(error?.message || 'Failed to load posts')
          setHasMorePosts(false)
        }
      } finally {
        if (!cancelled) {
          setIsPostsLoading(false)
          setIsPostsLoadingMore(false)
        }
      }
    }

    loadPostsPage()

    return () => {
      cancelled = true
    }
  }, [postsPage, profileUser?.id])

  const loadNextPostsPage = useCallback(() => {
    if (isPostsLoading || isPostsLoadingMore || !hasMorePosts || postsError)
      return
    setPostsPage((currentPage) => currentPage + 1)
  }, [hasMorePosts, isPostsLoading, isPostsLoadingMore, postsError])

  useEffect(() => {
    const target = postsLoadMoreRef.current
    if (
      !target ||
      isPostsLoading ||
      isPostsLoadingMore ||
      !hasMorePosts ||
      postsError
    )
      return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadNextPostsPage()
        }
      },
      { rootMargin: '400px 0px' },
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [
    hasMorePosts,
    isPostsLoading,
    isPostsLoadingMore,
    loadNextPostsPage,
    postsError,
  ])

  useEffect(() => {
    if (!profileUser?.id) {
      setSavedItems([])
      setUpvotedPosts([])
      setDownvotedPosts([])
      setProfilePostSavedMap({})
      setIsProfileDataLoading(false)
      return
    }

    let cancelled = false

    const loadProfileData = async () => {
      setIsProfileDataLoading(true)

      try {
        const [fetchedSaved, allVotes] =
          isOwnProfile && token
            ? await Promise.all([fetchMySavedItems(token), fetchMyVotes(token)])
            : await Promise.all([
                fetch(`/api/saveditem/user/${profileUser.id}`).then((r) =>
                  r.ok ? r.json() : [],
                ),
                fetch(`/api/vote/user/${profileUser.id}`).then((r) =>
                  r.ok ? r.json() : [],
                ),
              ])

        const userPostVotes = allVotes.filter((vote) => Boolean(vote.postId))

        const savedCommentIds = [
          ...new Set(
            fetchedSaved
              .map((item) => item.commentId)
              .filter((commentId) => commentId !== null),
          ),
        ]
        const savedPostIds = fetchedSaved
          .map((item) => item.postId)
          .filter((postId) => postId !== null)

        const votedPostIds = userPostVotes
          .map((vote) => vote.postId)
          .filter((postId) => postId !== null)

        const savedComments = await Promise.all(
          savedCommentIds.map(async (commentId) => {
            try {
              const response = await fetch(`/api/comments/${commentId}`)
              if (!response.ok) return [commentId, null]
              return [commentId, await response.json()]
            } catch {
              return [commentId, null]
            }
          }),
        )

        const savedCommentsById = new Map(
          savedComments.filter(([, comment]) => comment !== null),
        )

        const postIdsFromComments = [
          ...new Set(
            Array.from(savedCommentsById.values())
              .map((comment) => comment.postId)
              .filter(Boolean),
          ),
        ]

        const allPostIds = [
          ...new Set([
            ...savedPostIds,
            ...postIdsFromComments,
            ...votedPostIds,
          ]),
        ]

        const fetchedPosts = await Promise.all(
          allPostIds.map(async (postId) => {
            try {
              const response = await fetch(`/api/posts/${postId}`)
              if (!response.ok) return [postId, null]
              return [postId, await response.json()]
            } catch {
              return [postId, null]
            }
          }),
        )

        const postsById = new Map(
          fetchedPosts.filter(([, post]) => post !== null),
        )

        const mappedSavedItems = fetchedSaved
          .map((savedItem) => {
            if (savedItem.postId) {
              const post = postsById.get(savedItem.postId)
              if (!post) return null
              return {
                id: `saved-${savedItem.id}`,
                savedItemId: savedItem.id,
                type: 'post',
                community: `r/${post.communitySlug}`,
                author: `u/${post.authorName}`,
                time: formatDate(savedItem.createdAt),
                title: post.title,
                text: post.body || '',
                image: normalizeImageSrc(post.imageUrl),
                votes: post.votes ?? 0,
                comments: post.commentsCount ?? 0,
                postId: post.id,
              }
            }

            if (savedItem.commentId) {
              const comment = savedCommentsById.get(savedItem.commentId)
              if (!comment) return null

              const post = postsById.get(comment.postId)
              if (!post) return null

              return {
                id: `saved-${savedItem.id}`,
                savedItemId: savedItem.id,
                type: 'comment',
                community: `r/${post.communitySlug}`,
                author: `u/${comment.authorName}`,
                postTitle:
                  post.title || savedItem.postTitle || `Post #${post.id}`,
                postId: post.id,
                content: comment.body || savedItem.commentBody || '',
                votes: comment.votes ?? 0,
                time: formatDate(savedItem.createdAt),
              }
            }

            return null
          })
          .filter(Boolean)

        const mappedUpvoted = userPostVotes
          .filter((vote) => vote.type === 1)
          .map((vote) => mapPostToVotedItem(vote, postsById.get(vote.postId)))
          .filter(Boolean)

        const mappedDownvoted = userPostVotes
          .filter((vote) => vote.type === -1)
          .map((vote) => mapPostToVotedItem(vote, postsById.get(vote.postId)))
          .filter(Boolean)

        if (!cancelled) {
          setSavedItems(mappedSavedItems)
          setUpvotedPosts(mappedUpvoted)
          setDownvotedPosts(mappedDownvoted)

          if (isOwnProfile) {
            const postSavedMap = {}
            mappedSavedItems.forEach((item) => {
              if (item.type === 'post') postSavedMap[item.postId] = item.savedItemId
            })
            setProfilePostSavedMap(postSavedMap)
          }
        }
      } catch {
        if (!cancelled) {
          setSavedItems([])
          setUpvotedPosts([])
          setDownvotedPosts([])
        }
      } finally {
        if (!cancelled) {
          setIsProfileDataLoading(false)
        }
      }
    }

    loadProfileData()

    return () => {
      cancelled = true
    }
  }, [profileUser?.id, isOwnProfile, token])

  const hasPosts = totalPostsCount > 0
  const hasComments = comments.length > 0
  const hasSaved = savedItems.length > 0
  const hasUpvoted = upvotedPosts.length > 0
  const hasDownvoted = downvotedPosts.length > 0

  const statCards = useMemo(
    () => [
      { label: 'Karma', value: `${profileUser?.karma ?? 0}` },
      { label: 'Posts', value: `${totalPostsCount}` },
      { label: 'Comments', value: `${comments.length}` },
      { label: 'Cake Day', value: formatCakeDay(profileUser?.createdAt) },
    ],
    [comments.length, posts.length, profileUser?.createdAt, profileUser?.karma],
  )

  const handlePostMenu = (e, postId) => {
    if (openMorePostId === postId) {
      setOpenMorePostId(null)
      return
    }
    const rect = e.currentTarget.getBoundingClientRect()
    setPostMenuPos({
      top: rect.bottom + 6,
      right: window.innerWidth - rect.right,
    })
    setOpenMorePostId(postId)
  }

  const handleCommentMenu = (e, commentId) => {
    if (openMoreCommentId === commentId) {
      setOpenMoreCommentId(null)
      return
    }
    const rect = e.currentTarget.getBoundingClientRect()
    setCommentMenuPos({
      top: rect.bottom + 6,
      right: window.innerWidth - rect.right,
    })
    setOpenMoreCommentId(commentId)
  }

  const handleSavedMenu = (e, savedId) => {
    if (openMoreSavedId === savedId) {
      setOpenMoreSavedId(null)
      return
    }
    const rect = e.currentTarget.getBoundingClientRect()
    setSavedMenuPos({
      top: rect.bottom + 6,
      right: window.innerWidth - rect.right,
    })
    setOpenMoreSavedId(savedId)
  }

  const handleUpvotedMenu = (e, itemId) => {
    if (openMoreUpvotedId === itemId) {
      setOpenMoreUpvotedId(null)
      return
    }
    const rect = e.currentTarget.getBoundingClientRect()
    setUpvotedMenuPos({
      top: rect.bottom + 6,
      right: window.innerWidth - rect.right,
    })
    setOpenMoreUpvotedId(itemId)
  }

  const handleDownvotedMenu = (e, itemId) => {
    if (openMoreDownvotedId === itemId) {
      setOpenMoreDownvotedId(null)
      return
    }
    const rect = e.currentTarget.getBoundingClientRect()
    setDownvotedMenuPos({
      top: rect.bottom + 6,
      right: window.innerWidth - rect.right,
    })
    setOpenMoreDownvotedId(itemId)
  }

  const handleDeletePost = async () => {
    if (!token || !postToDeleteId) return
    setIsDeletingPost(true)
    setDeletePostError('')
    try {
      const response = await fetch(`/api/posts/${postToDeleteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || 'Failed to delete post.')
      }
      setPosts((prev) => prev.filter((p) => p.id !== postToDeleteId))
      setShowDeletePostModal(false)
      setPostToDeleteId(null)
    } catch (err) {
      setDeletePostError(err.message)
    } finally {
      setIsDeletingPost(false)
    }
  }

  const handleDeleteComment = async (commentId) => {
    if (!token) return
    setOpenMoreCommentId(null)
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error('Failed to delete comment')
      setComments((prev) => prev.filter((c) => c.id !== commentId))
    } catch (err) {
      alert(err.message)
    }
  }

  const handleRemoveSaved = async (savedId) => {
    if (!token) return
    const item = savedItems.find((i) => i.id === savedId)
    if (!item) return

    setOpenMoreSavedId(null)
    setSavedItems((prev) => prev.filter((i) => i.id !== savedId))
    if (item.type === 'post') {
      setProfilePostSavedMap((prev) => {
        const next = { ...prev }
        delete next[item.postId]
        return next
      })
    }

    try {
      await unsaveItem({ savedItemId: item.savedItemId, token })
    } catch (err) {
      setSavedItems((prev) => [...prev, item])
      if (item.type === 'post') {
        setProfilePostSavedMap((prev) => ({
          ...prev,
          [item.postId]: item.savedItemId,
        }))
      }
      alert(err.message)
    }
  }

  const handleToggleSavePostInProfile = async (postId) => {
    if (!token) {
      alert('Please login to save posts.')
      return
    }
    setOpenMorePostId(null)

    const existingSavedItemId = profilePostSavedMap[postId]

    if (existingSavedItemId) {
      setProfilePostSavedMap((prev) => {
        const next = { ...prev }
        delete next[postId]
        return next
      })
      setSavedItems((prev) =>
        prev.filter((i) => !(i.type === 'post' && i.postId === postId)),
      )
      try {
        await unsaveItem({ savedItemId: existingSavedItemId, token })
      } catch (err) {
        setProfilePostSavedMap((prev) => ({
          ...prev,
          [postId]: existingSavedItemId,
        }))
        alert(err.message)
      }
    } else {
      try {
        const created = await savePost({ postId, token })
        const targetPost = posts.find((p) => p.id === postId)
        setProfilePostSavedMap((prev) => ({ ...prev, [postId]: created.id }))
        if (targetPost) {
          setSavedItems((prev) => [
            ...prev,
            {
              id: `saved-${created.id}`,
              savedItemId: created.id,
              type: 'post',
              community: targetPost.community,
              author: `u/${profileUser?.userName || ''}`,
              time: formatDate(new Date().toISOString()),
              title: targetPost.title,
              text: targetPost.text || '',
              image: targetPost.image,
              votes: targetPost.votes,
              comments: targetPost.comments,
              postId,
            },
          ])
        }
      } catch (err) {
        alert(err.message)
      }
    }
  }

  const renderTab = () => {
    if (activeTab === 'Overview')
      return (
        <ProfileOverviewTab
          displayName={profileUser?.userName || displayName}
          statCards={statCards}
          isOwnProfile={isOwnProfile}
          bio={profileUser?.bio || (isOwnProfile ? authUser?.bio : null)}
        />
      )

    if (activeTab === 'Posts')
      return isPostsLoading && posts.length === 0 ? (
        <section className='tab-panel'>
          <p style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            Loading posts...
          </p>
        </section>
      ) : (
        <section className='tab-panel'>
          <div>
            <ProfilePostsTab
              posts={posts}
              hasPosts={hasPosts}
              openMorePostId={openMorePostId}
              onMenuOpen={handlePostMenu}
              isOwnProfile={isOwnProfile}
            />
            {postsError && (
              <p
                style={{
                  textAlign: 'center',
                  padding: '1rem 0',
                  color: '#c53030',
                }}
              >
                {postsError}
              </p>
            )}
            {!postsError && posts.length > 0 && (
              <>
                <div ref={postsLoadMoreRef} style={{ height: '1px' }} />
                {isPostsLoadingMore && (
                  <p style={{ textAlign: 'center', padding: '1rem 0' }}>
                    Loading more posts...
                  </p>
                )}
                {!hasMorePosts && (
                  <p
                    style={{
                      textAlign: 'center',
                      padding: '1rem 0',
                      opacity: 0.7,
                    }}
                  >
                    You reached the end.
                  </p>
                )}
              </>
            )}
          </div>
        </section>
      )

    if (activeTab === 'Comments')
      return isActivityLoading ? (
        <section className='tab-panel'>
          <p style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            Loading comments...
          </p>
        </section>
      ) : (
        <ProfileCommentsTab
          comments={comments}
          hasComments={hasComments}
          openMoreCommentId={openMoreCommentId}
          onMenuOpen={handleCommentMenu}
          isOwnProfile={isOwnProfile}
        />
      )

    if (activeTab === 'Saved')
      return isProfileDataLoading ? (
        <section className='tab-panel'>
          <p style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            Loading saved items...
          </p>
        </section>
      ) : (
        <ProfileSavedTab
          items={savedItems}
          hasSaved={hasSaved}
          openMoreSavedId={openMoreSavedId}
          onMenuOpen={handleSavedMenu}
        />
      )

    if (activeTab === 'Upvoted')
      return isProfileDataLoading ? (
        <section className='tab-panel'>
          <p style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            Loading upvoted posts...
          </p>
        </section>
      ) : (
        <ProfileVotedTab
          items={upvotedPosts}
          voteType='up'
          hasVoted={hasUpvoted}
          filterLabel='Upvoted posts'
          openId={openMoreUpvotedId}
          onMenuOpen={handleUpvotedMenu}
        />
      )

    if (activeTab === 'Downvoted')
      return isProfileDataLoading ? (
        <section className='tab-panel'>
          <p style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            Loading downvoted posts...
          </p>
        </section>
      ) : (
        <ProfileVotedTab
          items={downvotedPosts}
          voteType='down'
          hasVoted={hasDownvoted}
          filterLabel='Downvoted posts'
          openId={openMoreDownvotedId}
          onMenuOpen={handleDownvotedMenu}
        />
      )

    return null
  }

  const profileAvatarSrc =
    normalizeImageSrc(
      profileUser?.avatarUrl || (isOwnProfile ? authUser?.avatarUrl : null),
    ) || avatar

  if (isProfileLoading) {
    return (
      <main className='user-profile-page'>
        <section className='user-profile-shell'>
          <div className='user-profile-main'>
            <section className='user-feed-card'>
              <p style={{ textAlign: 'center', padding: '2rem' }}>
                Loading profile...
              </p>
            </section>
          </div>
        </section>
      </main>
    )
  }

  if (profileError || !profileUser) {
    return (
      <main className='user-profile-page'>
        <section className='user-profile-shell'>
          <div className='user-profile-main'>
            <section className='user-feed-card'>
              <p
                style={{
                  textAlign: 'center',
                  padding: '2rem',
                  color: '#c53030',
                }}
              >
                {profileError || 'Profile not found'}
              </p>
            </section>
          </div>
        </section>
      </main>
    )
  }

  if (profileUser.userName === '[deleted]') {
    return (
      <main className='user-profile-page'>
        <section className='user-profile-shell'>
          <div className='user-profile-main'>
            <section className='user-feed-card'>
              <p
                style={{
                  textAlign: 'center',
                  padding: '2rem',
                  color: '#7c7c7c',
                }}
              >
                This account has been deleted.
              </p>
            </section>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className='user-profile-page'>
      <section className='user-profile-shell'>
        <div className='user-profile-main'>
          <header className='user-hero'>
            <div className='user-hero-banner'>
              <img
                src={nature}
                alt='Profile banner'
                className='user-hero-banner-image'
              />
              {isOwnProfile && (
                <button type='button' className='user-hero-banner-button'>
                  Change banner
                </button>
              )}
            </div>

            <div className='user-hero-body'>
              <img
                src={profileAvatarSrc}
                alt='Avatar'
                className='user-hero-avatar'
              />
              <div className='user-hero-meta'>
                <h1>{profileUser.userName || displayName}</h1>
                <p>u/{profileUser.userName || displayName}</p>
              </div>
              <div className='user-hero-actions'>
                {isOwnProfile ? (
                  <>
                    <Link
                      to='/create-post'
                      className='profile-btn profile-btn-primary'
                    >
                      Create Post
                    </Link>
                    <Link
                      to='/edit-avatar'
                      className='profile-btn profile-btn-secondary'
                    >
                      Update Profile
                    </Link>
                  </>
                ) : (
                  <>
                    <button
                      type='button'
                      className='profile-btn profile-btn-primary'
                    >
                      Follow
                    </button>
                    <button
                      type='button'
                      className='profile-btn profile-btn-secondary'
                    >
                      Start Chat
                    </button>
                    <button
                      type='button'
                      className='profile-btn profile-btn-danger'
                    >
                      Report
                    </button>
                  </>
                )}
              </div>
            </div>

            <nav className='user-tabs' aria-label='Profile sections'>
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type='button'
                  onClick={() => setActiveTab(tab)}
                  className={`user-tab ${activeTab === tab ? 'user-tab-active' : ''}`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </header>

          <section className='user-feed-card'>{renderTab()}</section>
        </div>

        <aside className='user-profile-side'>
          <section className='side-card'>
            <h4>ADS in here?</h4>
            <div className='badge-row'>
              <span className='badge-pill'>Contributor</span>
              <span className='badge-pill'>Top Commenter</span>
              <span className='badge-pill'>Verified</span>
            </div>
          </section>
        </aside>
      </section>

      {openMorePostId !== null &&
        (() => {
          const targetPost = posts.find((p) => p.id === openMorePostId)
          const postRoute = targetPost
            ? `/community/${encodeURIComponent(getCommunitySlug(targetPost.community))}/post/${targetPost.id}`
            : null

          return (
            <div
              className='pp-more-menu pp-global-menu'
              role='menu'
              style={{
                position: 'fixed',
                top: postMenuPos.top,
                right: postMenuPos.right,
              }}
            >
              <button
                className='pp-more-item'
                role='menuitem'
                onClick={() => {
                  setOpenMorePostId(null)
                  if (postRoute) navigate(`${postRoute}?edit=true`)
                }}
              >
                Edit post
              </button>
              <button
                className='pp-more-item'
                role='menuitem'
                onClick={() => handleToggleSavePostInProfile(openMorePostId)}
              >
                {profilePostSavedMap[openMorePostId] ? 'Unsave' : 'Save'}
              </button>
              <button
                className='pp-more-item pp-more-item-danger'
                role='menuitem'
                onClick={() => {
                  setOpenMorePostId(null)
                  setDeletePostError('')
                  setPostToDeleteId(openMorePostId)
                  setShowDeletePostModal(true)
                }}
              >
                Delete
              </button>
            </div>
          )
        })()}

      {openMoreCommentId !== null &&
        (() => {
          const comment = comments.find(
            (entry) => entry.id === openMoreCommentId,
          )
          return comment ? (
            <div
              className='pp-more-menu pp-global-menu'
              role='menu'
              style={{
                position: 'fixed',
                top: commentMenuPos.top,
                right: commentMenuPos.right,
              }}
            >
              <Link
                to={getCommentPostRoute(comment)}
                className='pp-more-item pc-more-link'
                role='menuitem'
                onClick={() => setOpenMoreCommentId(null)}
              >
                Edit Comment
              </Link>
              <button
                className='pp-more-item'
                role='menuitem'
                onClick={() => setOpenMoreCommentId(null)}
              >
                Save
              </button>
              <button
                className='pp-more-item pp-more-item-danger'
                role='menuitem'
                onClick={() => handleDeleteComment(openMoreCommentId)}
              >
                Delete Comment
              </button>
            </div>
          ) : null
        })()}

      {openMoreSavedId !== null &&
        (() => {
          const savedItem = savedItems.find(
            (entry) => entry.id === openMoreSavedId,
          )
          return savedItem ? (
            <div
              className='pp-more-menu pp-global-menu'
              role='menu'
              style={{
                position: 'fixed',
                top: savedMenuPos.top,
                right: savedMenuPos.right,
              }}
            >
              <button
                className='pp-more-item pp-more-item-danger'
                role='menuitem'
                onClick={() => handleRemoveSaved(openMoreSavedId)}
              >
                Remove from saved
              </button>
            </div>
          ) : null
        })()}

      {openMoreUpvotedId !== null && (
        <div
          className='pp-more-menu pp-global-menu'
          role='menu'
          style={{
            position: 'fixed',
            top: upvotedMenuPos.top,
            right: upvotedMenuPos.right,
          }}
        >
          <button
            className='pp-more-item'
            role='menuitem'
            onClick={() => setOpenMoreUpvotedId(null)}
          >
            Save
          </button>
        </div>
      )}

      {openMoreDownvotedId !== null && (
        <div
          className='pp-more-menu pp-global-menu'
          role='menu'
          style={{
            position: 'fixed',
            top: downvotedMenuPos.top,
            right: downvotedMenuPos.right,
          }}
        >
          <button
            className='pp-more-item'
            role='menuitem'
            onClick={() => setOpenMoreDownvotedId(null)}
          >
            Save
          </button>
        </div>
      )}

      {showDeletePostModal && (
        <div className='post-delete-overlay'>
          <div className='post-delete-modal'>
            <h2 className='post-delete-modal-title'>Delete post?</h2>
            <p className='post-delete-modal-body'>
              Are you sure you want to delete this post? This cannot be undone.
            </p>
            {deletePostError && (
              <p className='post-delete-modal-error'>{deletePostError}</p>
            )}
            <div className='post-delete-modal-actions'>
              <button
                type='button'
                className='pp-more-item pp-more-item-danger'
                onClick={handleDeletePost}
                disabled={isDeletingPost}
                style={{ borderRadius: '999px', padding: '6px 18px' }}
              >
                {isDeletingPost ? 'Deleting...' : 'Delete'}
              </button>
              <button
                type='button'
                className='pp-more-item'
                onClick={() => {
                  setShowDeletePostModal(false)
                  setPostToDeleteId(null)
                }}
                disabled={isDeletingPost}
                style={{ borderRadius: '999px', padding: '6px 18px' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
