import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FaCaretUp, FaCaretDown, FaComment, FaShare, FaShieldAlt, FaLock, FaGlobe, FaUserShield, FaThumbtack } from 'react-icons/fa'
import { useAuth } from './AuthContext'
import './Styles/CommunityPage.css'
import avatar from './img/avatar.webp'
import coding from './img/coding.jpg'
import { normalizeImageSrc } from './utils/media'
import {
  deletePostVote,
  fetchUserPostVotes,
  submitPostVote,
  voteValueFromDirection,
} from './utils/voteApi'
import { fetchUserSavedPosts, savePost, unsaveItem } from './utils/savedItemApi'
import { fetchCommunityPostsPage } from './utils/postFeedApi'
import { fetchMyRole } from './utils/modApi'
import { ReportModal } from './ReportModal'

const SORT_OPTIONS = ['Popular', 'New', 'Top']

// Returns icon, label and CSS modifier for each community type
const communityTypeMeta = (type) => {
  switch ((type || '').toLowerCase()) {
    case 'private':    return { icon: FaLock,       label: 'Private',    mod: 'private' }
    case 'restricted': return { icon: FaUserShield,  label: 'Restricted', mod: 'restricted' }
    default:           return { icon: FaGlobe,       label: 'Public',     mod: 'public' }
  }
}

const getPostRoute = (communitySlug, postId) =>
  `/community/${encodeURIComponent(communitySlug)}/post/${postId}`

export function CommunityPage() {
  const PAGE_SIZE = 15
  const { communityname } = useParams()
  const { user, token } = useAuth()
  const [sortBy, setSortBy] = useState('Popular')
  const [openMorePostId, setOpenMorePostId] = useState(null)

  const [community, setCommunity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isMember, setIsMember] = useState(false)
  const [myRole, setMyRole] = useState(null)
  const [reportingPost, setReportingPost] = useState(null)

  const [posts, setPosts] = useState([])
  const [isLoadingPosts, setIsLoadingPosts] = useState(true)
  const [isLoadingMorePosts, setIsLoadingMorePosts] = useState(false)
  const [postsError, setPostsError] = useState(null)
  const [page, setPage] = useState(1)
  const [hasMorePosts, setHasMorePosts] = useState(true)
  const [postVotesById, setPostVotesById] = useState({})
  const [pendingPostVotes, setPendingPostVotes] = useState({})
  const [savedPostsById, setSavedPostsById] = useState({})
  const [pendingSavedPosts, setPendingSavedPosts] = useState({})

  const postsWrapRef = useRef(null)
  const loadMoreTriggerRef = useRef(null)

  useEffect(() => {
    const fetchCommunityAndMembership = async () => {
      try {
        setLoading(true)
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        const response = await fetch(`/api/Communities/${communityname}`, { headers })
        if (!response.ok) {
          throw new Error('Community not found')
        }
        const data = await response.json()
        setCommunity(data)

        if (user?.id && data?.id) {
          const membershipRes = await fetch(
            `/api/Communities/${data.id}/ismember?userId=${user.id}`,
          )
          if (membershipRes.ok) {
            const memberStatus = await membershipRes.json()
            setIsMember(memberStatus === true)
          }

          if (token) {
            const role = await fetchMyRole(data.id, token)
            setMyRole(role)
          }
        } else {
          setIsMember(false)
          setMyRole(null)
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchCommunityAndMembership()
  }, [communityname, user, token])

  useEffect(() => {
    setPosts([])
    setPage(1)
    setHasMorePosts(true)
    setPostsError(null)
    setIsLoadingPosts(true)
    setIsLoadingMorePosts(false)
  }, [community?.id, sortBy])

  useEffect(() => {
    if (!community?.id) return

    let cancelled = false
    const isInitialPage = page === 1

    const loadPostsPage = async () => {
      if (isInitialPage) {
        setIsLoadingPosts(true)
      } else {
        setIsLoadingMorePosts(true)
      }

      try {
        const batch = await fetchCommunityPostsPage({
          communityId: community.id,
          sortBy: sortBy.toLowerCase(),
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
        setHasMorePosts(batch.hasMore)
        setPostsError(null)
      } catch (fetchError) {
        if (!cancelled) {
          setPostsError(fetchError.message)
          setHasMorePosts(false)
        }
      } finally {
        if (!cancelled) {
          setIsLoadingPosts(false)
          setIsLoadingMorePosts(false)
        }
      }
    }

    loadPostsPage()

    return () => {
      cancelled = true
    }
  }, [community?.id, page, sortBy])

  const loadNextPostsPage = useCallback(() => {
    if (isLoadingPosts || isLoadingMorePosts || !hasMorePosts || postsError)
      return
    setPage((currentPage) => currentPage + 1)
  }, [hasMorePosts, isLoadingMorePosts, isLoadingPosts, postsError])

  useEffect(() => {
    const target = loadMoreTriggerRef.current
    if (
      !target ||
      isLoadingPosts ||
      isLoadingMorePosts ||
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
    isLoadingMorePosts,
    isLoadingPosts,
    loadNextPostsPage,
    postsError,
  ])

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

  const handleToggleMembership = async () => {
    if (!token || !community?.id) {
      alert(
        'Trebuie sa fii logat pentru a putea intra sau iesi dintr-o comunitate.',
      )
      return
    }

    try {
      if (isMember) {
        const response = await fetch(`/api/Communities/${community.id}/leave`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        })
        if (response.ok) {
          const text = await response.text()
          setIsMember(false)
          setCommunity((prev) => ({
            ...prev,
            membersCount: Math.max(0, prev.membersCount - 1),
          }))
          window.dispatchEvent(new Event('communities-membership-updated'))
          if (text) alert(text)
        } else {
          const errorMessage = await response.text()
          alert(errorMessage || 'Failed to leave community.')
        }
      } else {
        const response = await fetch(`/api/Communities/${community.id}/join`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
        if (response.ok) {
          const text = await response.text()
          setIsMember(true)
          setCommunity((prev) => ({
            ...prev,
            membersCount: prev.membersCount + 1,
          }))
          window.dispatchEvent(new Event('communities-membership-updated'))
          if (text) alert(text)
        } else {
          const errorMessage = await response.text()
          alert(errorMessage || 'Failed to join community.')
        }
      }
    } catch (err) {
      alert('Membership toggle failed.')
      console.error('Membership toggle failed:', err)
    }
  }

  if (loading)
    return (
      <div className='community-page'>
        <p>Loading...</p>
      </div>
    )
  if (error || !community)
    return (
      <div className='community-page'>
        <p>Error: {error || 'Not found'}</p>
      </div>
    )

  const communityBannerSrc =
    normalizeImageSrc(community.bannerUrl) ||
    normalizeImageSrc(community.avatarUrl)
  const communityAvatarSrc = normalizeImageSrc(community.avatarUrl)

  const handlePostVote = async (postId, direction) => {
    if (!token) {
      alert('Please login to vote.')
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
        alert(voteError.message)
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
      alert(error.message)
    } finally {
      setPendingPostVotes((currentPending) => ({
        ...currentPending,
        [postId]: false,
      }))
    }
  }

  const handleToggleSavePost = async (postId) => {
    if (!token) {
      alert('Please login to save posts.')
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
      alert(error.message)
    } finally {
      setPendingSavedPosts((currentPending) => ({
        ...currentPending,
        [postId]: false,
      }))
      setOpenMorePostId(null)
    }
  }

  return (
    <main className='community-page'>
      <section className='community-shell'>
        <div className='community-main'>
          <header className='community-hero'>
            <div className='community-banner'>
              {communityBannerSrc ? (
                <img src={communityBannerSrc} alt='Community banner' />
              ) : (
                <img src={coding} alt='Community banner fallback' />
              )}
            </div>

            <div className='community-head'>
              {communityAvatarSrc ? (
                <img
                  src={communityAvatarSrc}
                  alt='Community avatar'
                  className='community-avatar'
                />
              ) : (
                <img
                  src={avatar}
                  alt='Community avatar fallback'
                  className='community-avatar'
                />
              )}
              <div className='community-meta'>
                <h1>
                  {community.title}
                  {(() => {
                    const { icon: TypeIcon, label, mod } = communityTypeMeta(community.type)
                    return (
                      <span className={`community-type-badge community-type-${mod}`}>
                        <TypeIcon className='community-type-icon' />
                        {label}
                      </span>
                    )
                  })()}
                </h1>
                <p>c/{community.slug}</p>
                <span>{community.membersCount} members</span>
              </div>
              {/* Private communities: hide Join button for non-members (they can't join freely) */}
              {community.type?.toLowerCase() !== 'private' || isMember ? (
                <button
                  type='button'
                  className={`community-join-btn ${isMember ? 'community-leave-btn' : ''}`}
                  onClick={handleToggleMembership}
                  style={
                    isMember
                      ? {
                          backgroundColor: 'transparent',
                          color: 'white',
                          border: '1px solid white',
                        }
                      : {}
                  }
                >
                  {isMember ? 'Leave' : 'Join'}
                </button>
              ) : (
                <div className='community-private-badge'>
                  <FaLock /> Private Community
                </div>
              )}
            </div>
          </header>

          <section className='community-sort-bar'>
            <div className='community-sort-options'>
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option}
                  type='button'
                  className={`community-sort-option ${sortBy === option ? 'community-sort-option-active' : ''}`}
                  onClick={() => setSortBy(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </section>

          <section className='community-feed' ref={postsWrapRef}>
            {/* Restricted banner: anyone can see posts, but only mods can create */}
            {community.type?.toLowerCase() === 'restricted' && myRole !== 'owner' && myRole !== 'moderator' && (
              <div className='community-restricted-banner'>
                <FaUserShield className='community-restricted-banner-icon' />
                <span>
                  <strong>Restricted community</strong> — Only moderators can post here. Members can comment on existing posts.
                </span>
              </div>
            )}
            {/* Private wall: only members can view posts */}
            {community.type?.toLowerCase() === 'private' && !isMember ? (
              <div className='community-private-wall'>
                <FaLock className='community-private-wall-icon' />
                <h2>Private Community</h2>
                <p>This community is private. Only approved members can view posts and discussions.</p>
              </div>
            ) : isLoadingPosts ? (
              <p style={{ textAlign: 'center', padding: '2rem' }}>
                Loading posts...
              </p>
            ) : postsError ? (
              <p style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>
                {postsError}
              </p>
            ) : posts.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '2rem' }}>
                No posts found in this community.
              </p>
            ) : (
              posts.map((post) => {
                const postImageSrc = normalizeImageSrc(
                  post.imageUrl ?? post.ImageUrl,
                )
                return (
                  <article key={post.id} className={`post${post.isPinned ? ' post--pinned' : ''}`}>
                    <div className='post-main'>
                      <header className='post-header'>
                        {post.authorName === '[deleted]' ? (
                          <img
                            src={avatar}
                            alt='deleted user'
                            className='avatar'
                          />
                        ) : (
                          <Link
                            to={`/user/${encodeURIComponent(post.authorName)}`}
                          >
                            <img
                              src={avatar}
                              alt={post.authorName}
                              className='avatar'
                            />
                          </Link>
                        )}
                        <div className='post-meta'>
                          {post.isPinned && (
                            <span className='post-pinned-badge'>
                              <FaThumbtack className='post-pinned-icon' /> Pinned
                            </span>
                          )}
                          {post.authorName === '[deleted]' ? (
                            <span className='author'>u/[deleted]</span>
                          ) : (
                            <Link
                              to={`/user/${encodeURIComponent(post.authorName)}`}
                              className='author author-link'
                            >
                              u/{post.authorName}
                            </Link>
                          )}
                          <span className='meta-separator'>&middot;</span>
                          <span className='time-posted'>
                            {new Date(post.createdAt).toLocaleDateString()}
                          </span>
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
                                to={getPostRoute(community.slug, post.id)}
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
                                {savedPostsById[post.id]?.id
                                  ? 'Unsave'
                                  : 'Save'}
                              </button>
                              {post.authorName !== user?.userName && (
                                <button
                                  className='more-menu-item more-menu-danger'
                                  role='menuitem'
                                  onClick={() => {
                                    setOpenMorePostId(null)
                                    if (!token) { alert('Please log in to report.'); return }
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
                            to={getPostRoute(community.slug, post.id)}
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
                                to={getPostRoute(community.slug, post.id)}
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

                        <button type='button' className='action-chip'>
                          <FaComment className='comment-icon' />
                          <span className='comment-count'>
                            {post.commentsCount}
                          </span>
                        </button>

                        <button type='button' className='action-chip'>
                          <FaShare className='share-icon' />
                        </button>
                      </footer>
                    </div>
                  </article>
                )
              })
            )}
            {!isLoadingPosts && !postsError && posts.length > 0 && (
              <>
                <div ref={loadMoreTriggerRef} style={{ height: '1px' }} />
                {isLoadingMorePosts && (
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
          </section>
        </div>

        <aside className='community-side'>
          {(myRole === 'owner' || myRole === 'moderator') && (
            <Link
              to={`/community/${community.slug}/mod`}
              className='community-mod-tools-btn'
            >
              <FaShieldAlt className='community-mod-tools-icon' />
              Mod Tools
            </Link>
          )}

          <section className='community-side-card'>
            <h2>About community</h2>
            <p>{community.description}</p>
          </section>

          <section className='community-side-card'>
            <h3>Rules</h3>
            {community.rules ? (
              <ol>
                {community.rules
                  .split('\n')
                  .filter(Boolean)
                  .map((rule, i) => (
                    <li key={i}>{rule}</li>
                  ))}
              </ol>
            ) : (
              <ol>
                <li>Fii respectuos in discutii.</li>
                <li>Postarile trebuie sa aiba context clar.</li>
                <li>Fara comportament toxic.</li>
              </ol>
            )}
          </section>
        </aside>
      </section>

      {reportingPost && (
        <ReportModal
          type={0}
          reportedItemId={reportingPost.id}
          label='Post'
          token={token}
          onClose={() => setReportingPost(null)}
        />
      )}
    </main>
  )
}
