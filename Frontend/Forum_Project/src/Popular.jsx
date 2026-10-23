import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Styles/Popular.css'
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
import { useConfirm } from './ConfirmContext'
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

const getPostRoute = (post) =>
  `/community/${encodeURIComponent(post.communitySlug)}/post/${post.id}`

export const Popular = () => {
  const PAGE_SIZE = 15
  const { user, token } = useAuth()
  const toast = useToast()
  const confirm = useConfirm()
  const navigate = useNavigate()
  const [openMorePostId, setOpenMorePostId] = useState(null)
  const [reportingPost, setReportingPost] = useState(null)
  const [deletingPostId, setDeletingPostId] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [postVotesById, setPostVotesById] = useState({})
  const [pendingPostVotes, setPendingPostVotes] = useState({})
  const [savedPostsById, setSavedPostsById] = useState({})
  const [pendingSavedPosts, setPendingSavedPosts] = useState({})
  const [userCommsBySlug, setUserCommsBySlug] = useState({})

  const postsWrapRef = useRef(null)
  const loadMoreTriggerRef = useRef(null)

  useEffect(() => {
    setPosts([])
    setPage(1)
    setHasMore(true)
    setError(null)
    setLoading(true)
    setIsLoadingMore(false)
  }, [token])

  useEffect(() => {
    let cancelled = false

    const loadPage = async () => {
      const isInitialPage = page === 1
      if (isInitialPage) {
        setLoading(true)
      } else {
        setIsLoadingMore(true)
      }

      try {
        const batch = await fetchPostsPage({
          sortBy: 'top',
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
        setError(null)
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError.message)
          setHasMore(false)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
          setIsLoadingMore(false)
        }
      }
    }

    loadPage()

    return () => {
      cancelled = true
    }
  }, [page, token])

  const loadNextPage = useCallback(() => {
    if (loading || isLoadingMore || !hasMore || error) return
    setPage((currentPage) => currentPage + 1)
  }, [error, hasMore, isLoadingMore, loading])

  useEffect(() => {
    const target = loadMoreTriggerRef.current
    if (!target || loading || isLoadingMore || !hasMore || error) return

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
  }, [error, hasMore, isLoadingMore, loadNextPage, loading])

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
    if (!token) {
      setUserCommsBySlug({})
      return
    }
    fetchMyCommunities(token)
      .then((comms) => {
        const map = {}
        for (const c of comms) {
          const slug = (c.slug || '').toLowerCase()
          if (slug) map[slug] = c.role
        }
        setUserCommsBySlug(map)
      })
      .catch(() => {})
  }, [token])

  const canModeratePost = (post) => {
    if (!user || !token) return false
    if (user.role === 'Admin') return true // global admins moderate anything
    if (post.authorName === user.userName) return true
    const role = userCommsBySlug[(post.communitySlug || '').toLowerCase()]
    return role === 'owner' || role === 'moderator'
  }

  const handleDeletePost = async (postId) => {
    if (!token) return
    const ok = await confirm({
      title: 'Delete post?',
      message: 'This post will be permanently deleted. This cannot be undone.',
      confirmText: 'Delete',
      danger: true,
    })
    if (!ok) return
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
      } catch (voteError) {
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
        toast.error(voteError.message)
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
    } catch (voteError) {
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
      toast.error(voteError.message)
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

  return (
    <div className='popular-page'>
      <div className='feed-layout'>
        <div className='feed-main'>
          <div ref={postsWrapRef}>
            {loading ? (
              <p style={{ textAlign: 'center', padding: '2rem' }}>
                Loading popular posts...
              </p>
            ) : error ? (
              <p style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>
                {error}
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
                        <Link
                          to={`/community/${encodeURIComponent(post.communitySlug)}`}
                        >
                          <img
                            src={
                              normalizeImageSrc(post.communityAvatarUrl) ||
                              avatar
                            }
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
                          {post.editedAt && (
                            <>
                              <span className='meta-separator'>&middot;</span>
                              <span
                                className='time-posted'
                                style={{ fontStyle: 'italic' }}
                                title={`Edited ${new Date(post.editedAt).toLocaleString()}`}
                              >
                                edited{' '}
                                {new Date(post.editedAt).toLocaleDateString()}
                              </span>
                            </>
                          )}
                          <span className='meta-separator'>&middot;</span>
                          {post.authorName === '[deleted]' ? (
                            <span className='author'>
                              Posted by u/[deleted]
                            </span>
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
                              <button
                                className='more-menu-item'
                                role='menuitem'
                                onClick={() => handleToggleSavePost(post.id)}
                                disabled={pendingSavedPosts[post.id]}
                              >
                                {savedPostsById[post.id]?.id
                                  ? 'Unsave'
                                  : 'Save'}
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
                            to={getPostRoute(post)}
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
                                to={getPostRoute(post)}
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

                        <Link to={getPostRoute(post)} className='action-chip'>
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
            {!loading && !error && posts.length > 0 && (
              <>
                <div ref={loadMoreTriggerRef} style={{ height: '1px' }} />
                {isLoadingMore && (
                  <p style={{ textAlign: 'center', padding: '1rem 0' }}>
                    Loading more posts...
                  </p>
                )}
                {!hasMore && (
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
