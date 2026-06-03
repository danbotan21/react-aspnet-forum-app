import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Styles/Home.css'
import avatar from './img/avatar.webp'
import {
  FaCaretUp,
  FaCaretDown,
  FaComment,
  FaEdit,
  FaTrash,
} from 'react-icons/fa'
import { normalizeImageSrc } from './utils/media'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'
import {
  deletePostVote,
  fetchUserPostVotes,
  submitPostVote,
  voteValueFromDirection,
} from './utils/voteApi'
import { fetchUserSavedPosts, savePost, unsaveItem } from './utils/savedItemApi'
import { fetchPostsPage } from './utils/postFeedApi'
import { ReportModal } from './ReportModal'
import { deletePost, fetchMyCommunities } from './utils/modApi'
import { AdSidebar } from './AdSidebar'

const SORT_OPTIONS = [
  { id: 'popular', label: 'Popular' },
  { id: 'new', label: 'New' },
  { id: 'mostComments', label: 'Most comments' },
]

export const Home = () => {
  const PAGE_SIZE = 15
  const { user, token } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [openMorePostId, setOpenMorePostId] = useState(null)
  const [sortBy, setSortBy] = useState('popular')
  const [isSortOpen, setIsSortOpen] = useState(false)
  const [reportingPost, setReportingPost] = useState(null) // { id } of post being reported
  const [deletingPostId, setDeletingPostId] = useState(null)

  const sortRef = useRef(null)
  const postsWrapRef = useRef(null)
  const loadMoreTriggerRef = useRef(null)

  const [posts, setPosts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [feedError, setFeedError] = useState(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [postVotesById, setPostVotesById] = useState({})
  const [pendingPostVotes, setPendingPostVotes] = useState({})
  const [savedPostsById, setSavedPostsById] = useState({})
  const [pendingSavedPosts, setPendingSavedPosts] = useState({})
  const [userCommsByCommunityId, setUserCommsByCommunityId] = useState({})

  useEffect(() => {
    setPosts([])
    setPage(1)
    setHasMore(true)
    setFeedError(null)
    setIsLoading(true)
    setIsLoadingMore(false)
  }, [sortBy, token])

  useEffect(() => {
    let cancelled = false

    const loadPage = async () => {
      const isInitialPage = page === 1
      if (isInitialPage) {
        setIsLoading(true)
      } else {
        setIsLoadingMore(true)
      }

      try {
        const batch = await fetchPostsPage({
          sortBy,
          page,
          pageSize: PAGE_SIZE,
          token,
        })
        if (cancelled) return

        setPosts((currentPosts) => {
          if (isInitialPage) return batch.items
          const existingIds = new Set(currentPosts.map((post) => post.id))
          const nextItems = batch.items.filter(
            (post) => !existingIds.has(post.id),
          )
          return [...currentPosts, ...nextItems]
        })
        setHasMore(batch.hasMore)
        setFeedError(null)
      } catch (error) {
        if (!cancelled) {
          setFeedError(error.message)
          setHasMore(false)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
          setIsLoadingMore(false)
        }
      }
    }

    loadPage()

    return () => {
      cancelled = true
    }
  }, [page, sortBy, token])

  const loadNextPage = useCallback(() => {
    if (isLoading || isLoadingMore || !hasMore || feedError) return
    setPage((currentPage) => currentPage + 1)
  }, [feedError, hasMore, isLoading, isLoadingMore])

  useEffect(() => {
    const target = loadMoreTriggerRef.current
    if (!target || isLoading || isLoadingMore || !hasMore || feedError) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadNextPage()
        }
      },
      { rootMargin: '400px 0px' },
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [feedError, hasMore, isLoading, isLoadingMore, loadNextPage])

  useEffect(() => {
    if (!token) {
      setPostVotesById({})
      return
    }

    if (posts.length === 0) return

    let cancelled = false

    setPostVotesById((currentVotes) => {
      const missingPostIds = posts
        .map((post) => post.id)
        .filter((postId) => currentVotes[postId] === undefined)

      if (missingPostIds.length === 0) return currentVotes

      fetchUserPostVotes(missingPostIds, token).then((votesMap) => {
        if (!cancelled) {
          setPostVotesById((prev) => ({ ...prev, ...votesMap }))
        }
      })

      // Mark these IDs as loading (null) to prevent re-fetch
      const loadingEntries = Object.fromEntries(
        missingPostIds.map((postId) => [postId, null]),
      )
      return { ...currentVotes, ...loadingEntries }
    })

    return () => {
      cancelled = true
    }
  }, [posts, token])

  useEffect(() => {
    if (!token) {
      setSavedPostsById({})
      return
    }

    if (posts.length === 0) return

    let cancelled = false

    setSavedPostsById((currentSaved) => {
      const missingPostIds = posts
        .map((post) => post.id)
        .filter((postId) => currentSaved[postId] === undefined)

      if (missingPostIds.length === 0) return currentSaved

      fetchUserSavedPosts(missingPostIds, token).then((savedMap) => {
        if (!cancelled) {
          setSavedPostsById((prev) => ({ ...prev, ...savedMap }))
        }
      })

      // Mark these IDs as loading (null) to prevent re-fetch
      const loadingEntries = Object.fromEntries(
        missingPostIds.map((postId) => [postId, null]),
      )
      return { ...currentSaved, ...loadingEntries }
    })

    return () => {
      cancelled = true
    }
  }, [posts, token])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setIsSortOpen(false)
      }

      if (postsWrapRef.current && !postsWrapRef.current.contains(e.target)) {
        setOpenMorePostId(null)
        return
      }

      if (!e.target.closest('.post-header-actions')) {
        setOpenMorePostId(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const handler = (e) => {
      const { postId, type } = e.detail
      if (type === 'Comment') {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? { ...p, commentsCount: Math.max(0, (p.commentsCount ?? 0) - 1) }
              : p,
          ),
        )
      } else if (type === 'Post') {
        setPosts((prev) => prev.filter((p) => p.id !== postId))
      }
    }
    window.addEventListener('post-content-removed', handler)
    return () => window.removeEventListener('post-content-removed', handler)
  }, [])

  useEffect(() => {
    if (!token) {
      setUserCommsByCommunityId({})
      return
    }
    fetchMyCommunities(token)
      .then((comms) => {
        const map = {}
        for (const c of comms) {
          const slug = (c.slug || '').toLowerCase()
          if (slug) map[slug] = c.role
        }
        setUserCommsByCommunityId(map)
      })
      .catch(() => {})
  }, [token])

  const currentSortLabel =
    SORT_OPTIONS.find((option) => option.id === sortBy)?.label ?? 'Popular'

  const handlePostVote = async (postId, direction) => {
    if (!token) {
      toast.error('Please login to vote.')
      return
    }
    if (pendingPostVotes[postId]) return

    const nextVoteType = voteValueFromDirection(direction)
    const previousVote = postVotesById[postId] || { id: null, type: 0 }
    const previousVoteType = previousVote.type ?? 0

    if (previousVoteType === nextVoteType && !previousVote.id) return

    setPendingPostVotes((currentPending) => ({
      ...currentPending,
      [postId]: true,
    }))

    if (previousVoteType === nextVoteType && previousVote.id) {
      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === postId
            ? { ...post, votes: (post.votes ?? 0) - previousVoteType }
            : post,
        ),
      )
      setPostVotesById((currentVotes) => ({
        ...currentVotes,
        [postId]: { id: null, type: 0 },
      }))

      try {
        await deletePostVote({ voteId: previousVote.id, token })
      } catch (error) {
        setPosts((currentPosts) =>
          currentPosts.map((post) =>
            post.id === postId
              ? { ...post, votes: (post.votes ?? 0) + previousVoteType }
              : post,
          ),
        )
        setPostVotesById((currentVotes) => ({
          ...currentVotes,
          [postId]: previousVote,
        }))
        toast.error(error.message)
      } finally {
        setPendingPostVotes((currentPending) => ({
          ...currentPending,
          [postId]: false,
        }))
      }
      return
    }

    const voteDelta = nextVoteType - previousVoteType

    setPosts((currentPosts) =>
      currentPosts.map((post) =>
        post.id === postId
          ? { ...post, votes: (post.votes ?? 0) + voteDelta }
          : post,
      ),
    )
    setPostVotesById((currentVotes) => ({
      ...currentVotes,
      [postId]: { ...(currentVotes[postId] || {}), type: nextVoteType },
    }))

    try {
      const vote = await submitPostVote({
        postId,
        voteType: nextVoteType,
        token,
      })

      setPostVotesById((currentVotes) => ({
        ...currentVotes,
        [postId]: { id: vote.id, type: vote.type },
      }))
    } catch (error) {
      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === postId
            ? { ...post, votes: (post.votes ?? 0) - voteDelta }
            : post,
        ),
      )
      setPostVotesById((currentVotes) => ({
        ...currentVotes,
        [postId]: { ...(currentVotes[postId] || {}), type: previousVoteType },
      }))
      toast.error(error.message)
    } finally {
      setPendingPostVotes((currentPending) => ({
        ...currentPending,
        [postId]: false,
      }))
    }
  }

  const handleToggleSavePost = async (postId) => {
    if (!token) {
      toast.error('Please login to save posts.')
      return
    }
    if (pendingSavedPosts[postId]) return

    const previousSavedItem = savedPostsById[postId] ?? null

    setPendingSavedPosts((currentPending) => ({
      ...currentPending,
      [postId]: true,
    }))

    try {
      if (previousSavedItem?.id) {
        setSavedPostsById((currentSaved) => ({
          ...currentSaved,
          [postId]: null,
        }))
        await unsaveItem({ savedItemId: previousSavedItem.id, token })
      } else {
        const createdSavedItem = await savePost({ postId, token })
        setSavedPostsById((currentSaved) => ({
          ...currentSaved,
          [postId]: {
            id: createdSavedItem.id,
            postId: createdSavedItem.postId,
          },
        }))
      }
    } catch (error) {
      setSavedPostsById((currentSaved) => ({
        ...currentSaved,
        [postId]: previousSavedItem,
      }))
      toast.error(error.message)
    } finally {
      setPendingSavedPosts((currentPending) => ({
        ...currentPending,
        [postId]: false,
      }))
      setOpenMorePostId(null)
    }
  }

  const canModeratePost = (post) => {
    if (!user || !token) return false
    if (user.role === 'Admin') return true // global admins moderate anything
    if (post.authorName === user.userName) return true
    const role =
      userCommsByCommunityId[(post.communitySlug || '').toLowerCase()]
    return role === 'owner' || role === 'moderator'
  }

  const handleDeletePost = async (postId) => {
    if (
      !token ||
      !window.confirm('Delete this post permanently? This cannot be undone.')
    )
      return
    setDeletingPostId(postId)
    try {
      await deletePost(postId, token)
      setPosts((prev) => prev.filter((p) => p.id !== postId))
      setOpenMorePostId(null)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setDeletingPostId(null)
    }
  }

  return (
    <div className='home'>
      <div className='feed-layout'>
        <div className='feed-main'>
      <div className='home-sort-bar' ref={sortRef}>
        <div className='sort-trigger-wrapper'>
          <button
            type='button'
            className='sort-trigger'
            onClick={() => setIsSortOpen((prev) => !prev)}
            aria-expanded={isSortOpen}
            aria-haspopup='listbox'
          >
            <span className='sort-trigger-label'>{currentSortLabel}</span>
            <span className='sort-trigger-chevron' aria-hidden>
              <FaCaretDown size={16} />
            </span>
          </button>

          {isSortOpen && (
            <div className='sort-dropdown' role='listbox'>
              <div className='sort-dropdown-header'>Sort by</div>
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type='button'
                  role='option'
                  aria-selected={sortBy === option.id}
                  className={`sort-dropdown-item ${sortBy === option.id ? 'sort-dropdown-item--active' : ''}`}
                  onClick={() => {
                    setSortBy(option.id)
                    setIsSortOpen(false)
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div ref={postsWrapRef}>
        {isLoading ? (
          <p style={{ textAlign: 'center', padding: '2rem' }}>
            Loading posts...
          </p>
        ) : feedError ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>
            {feedError}
          </p>
        ) : posts.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '2rem' }}>
            No posts found.
          </p>
        ) : (
          posts.map((post) => {
            const postImageSrc = normalizeImageSrc(
              post.imageUrl ?? post.ImageUrl,
            )
            return (
              <article className='post' key={post.id}>
                <div className='post-main'>
                  <header className='post-header'>
                    <Link to={`/community/${encodeURIComponent(post.communitySlug)}`}>
                      <img
                        src={normalizeImageSrc(post.communityAvatarUrl) || avatar}
                        alt='Community Avatar'
                        className='avatar'
                      />
                    </Link>
                    <div className='post-meta'>
                      <Link
                        to={`/community/${encodeURIComponent(post.communitySlug)}`}
                        className='community-name community-link'
                      >
                        r/{post.communitySlug}
                      </Link>
                      <span className='meta-separator'>&middot;</span>
                      <span className='time-posted'>
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                      <span className='meta-separator'>&middot;</span>
                      {post.authorName === '[deleted]' ? (
                        <span className='author'>Posted by u/[deleted]</span>
                      ) : (
                        <Link
                          to={`/user/${encodeURIComponent(post.authorName)}`}
                          className='author author-link'
                        >
                          Posted by u/{post.authorName}
                        </Link>
                      )}
                    </div>

                    <div className='post-header-actions'>
                      <button
                        type='button'
                        className='more-button'
                        onClick={() =>
                          setOpenMorePostId((prev) =>
                            prev === post.id ? null : post.id,
                          )
                        }
                        aria-expanded={openMorePostId === post.id}
                        aria-haspopup='menu'
                        aria-label='Open post options'
                      >
                        ...
                      </button>
                      {openMorePostId === post.id && (
                        <div className='more-menu' role='menu'>
                          <Link
                            to={`/community/${encodeURIComponent(post.communitySlug)}/post/${post.id}`}
                            className='more-menu-item more-menu-link'
                            role='menuitem'
                            onClick={() => setOpenMorePostId(null)}
                          >
                            Open post
                          </Link>
                          <button
                            className='more-menu-item'
                            role='menuitem'
                            onClick={() => handleToggleSavePost(post.id)}
                            disabled={pendingSavedPosts[post.id]}
                          >
                            {savedPostsById[post.id]?.id ? 'Unsave' : 'Save'}
                          </button>
                          {token && post.authorName === user?.userName && (
                            <Link
                              to={`/community/${encodeURIComponent(post.communitySlug)}/post/${post.id}?edit=true`}
                              className='more-menu-item more-menu-link'
                              role='menuitem'
                              onClick={() => setOpenMorePostId(null)}
                            >
                              <FaEdit style={{ marginRight: 6 }} />
                              Edit
                            </Link>
                          )}
                          {token && canModeratePost(post) && (
                            <button
                              className='more-menu-item more-menu-danger'
                              role='menuitem'
                              onClick={() => handleDeletePost(post.id)}
                              disabled={deletingPostId === post.id}
                            >
                              <FaTrash style={{ marginRight: 6 }} />
                              {deletingPostId === post.id
                                ? 'Deleting...'
                                : 'Delete'}
                            </button>
                          )}
                          {post.authorName !== user?.userName && (
                            <button
                              className='more-menu-item more-menu-danger'
                              role='menuitem'
                              onClick={() => {
                                setOpenMorePostId(null)
                                if (!token) {
                                  toast.error('Please log in to report.')
                                  return
                                }
                                setReportingPost({ id: post.id })
                              }}
                            >
                              Report
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </header>

                  <div className='post-body'>
                    <h3 className='post-title'>
                      <Link
                        to={`/community/${encodeURIComponent(post.communitySlug)}/post/${post.id}`}
                        className='post-title-link'
                      >
                        {post.title}
                      </Link>
                    </h3>
                    {post.body && <p className='post-text'>{post.body}</p>}

                    {(postImageSrc || post.linkUrl) && (
                      <div className='post-media'>
                        {postImageSrc && (
                          <Link
                            to={`/community/${encodeURIComponent(post.communitySlug)}/post/${post.id}`}
                            className='post-media-link'
                          >
                            <div className='media-placeholder'>
                              <img src={postImageSrc} alt='Post content' />
                            </div>
                          </Link>
                        )}
                        {post.linkUrl && (
                          <div className='media-placeholder'>
                            <a
                              href={post.linkUrl}
                              target='_blank'
                              rel='noopener noreferrer'
                              style={{
                                color: '#0066cc',
                                textDecoration: 'underline',
                              }}
                            >
                              {post.linkUrl}
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <footer className='post-footer'>
                    <div className='action-chip vote-chip'>
                      <FaCaretUp
                        className={`vote-icon upvote ${postVotesById[post.id]?.type === 1 ? 'active' : ''}`}
                        onClick={() => handlePostVote(post.id, 'up')}
                        style={{
                          pointerEvents: pendingPostVotes[post.id]
                            ? 'none'
                            : 'auto',
                          opacity: pendingPostVotes[post.id] ? 0.6 : 1,
                        }}
                      />
                      <span className='vote-count'>{post.votes}</span>
                      <FaCaretDown
                        className={`vote-icon downvote ${postVotesById[post.id]?.type === -1 ? 'active' : ''}`}
                        onClick={() => handlePostVote(post.id, 'down')}
                        style={{
                          pointerEvents: pendingPostVotes[post.id]
                            ? 'none'
                            : 'auto',
                          opacity: pendingPostVotes[post.id] ? 0.6 : 1,
                        }}
                      />
                    </div>

                    <Link
                      to={`/community/${encodeURIComponent(post.communitySlug)}/post/${post.id}`}
                      className='action-chip'
                    >
                      <FaComment className='comment-icon' />
                      <span className='comment-count'>
                        {post.commentsCount}
                      </span>
                    </Link>
                  </footer>
                </div>
              </article>
            )
          })
        )}
        {!isLoading && !feedError && posts.length > 0 && (
          <>
            <div ref={loadMoreTriggerRef} style={{ height: '1px' }} />
            {isLoadingMore && (
              <p style={{ textAlign: 'center', padding: '1rem 0' }}>
                Loading more posts...
              </p>
            )}
            {!hasMore && (
              <p
                style={{ textAlign: 'center', padding: '1rem 0', opacity: 0.7 }}
              >
                You reached the end.
              </p>
            )}
          </>
        )}
      </div>
        </div>
        <AdSidebar />
      </div>

      {reportingPost && (
        <ReportModal
          type={0}
          reportedItemId={reportingPost.id}
          label='Post'
          token={token}
          onClose={() => setReportingPost(null)}
        />
      )}
    </div>
  )
}
