import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FaCaretUp, FaCaretDown, FaComment, FaUsers } from 'react-icons/fa'
import { normalizeImageSrc } from './utils/media'
import { useAuth } from './AuthContext'
import {
  deletePostVote,
  fetchUserPostVotes,
  submitPostVote,
  voteValueFromDirection,
} from './utils/voteApi'
import { fetchUserSavedPosts, savePost, unsaveItem } from './utils/savedItemApi'
import avatar from './img/avatar.webp'
import './Styles/Home.css'
import './Styles/SearchResults.css'

export const SearchResults = () => {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const { user, token } = useAuth()

  const [activeTab, setActiveTab] = useState('posts')
  const [posts, setPosts] = useState([])
  const [communities, setCommunities] = useState([])
  const [loadingPosts, setLoadingPosts] = useState(false)
  const [loadingCommunities, setLoadingCommunities] = useState(false)

  const [postVotesById, setPostVotesById] = useState({})
  const [pendingPostVotes, setPendingPostVotes] = useState({})
  const [savedPostsById, setSavedPostsById] = useState({})
  const [pendingSavedPosts, setPendingSavedPosts] = useState({})
  const [openMorePostId, setOpenMorePostId] = useState(null)
  const postsWrapRef = useRef(null)

  useEffect(() => {
    if (!query.trim()) return
    setPosts([])
    setCommunities([])
    setPostVotesById({})
    setSavedPostsById({})
    setLoadingPosts(true)
    setLoadingCommunities(true)

    fetch(`/api/Posts/search?term=${encodeURIComponent(query)}&limit=20`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => { setPosts(data); setLoadingPosts(false) })
      .catch(() => setLoadingPosts(false))

    fetch(`/api/Communities/search?term=${encodeURIComponent(query)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => { setCommunities(data); setLoadingCommunities(false) })
      .catch(() => setLoadingCommunities(false))
  }, [query])

  // Load votes for visible posts
  useEffect(() => {
    if (!token || posts.length === 0) return
    let cancelled = false
    setPostVotesById((current) => {
      const missing = posts.map((p) => p.id).filter((id) => current[id] === undefined)
      if (missing.length === 0) return current
      fetchUserPostVotes(missing, token).then((map) => {
        if (!cancelled) setPostVotesById((prev) => ({ ...prev, ...map }))
      })
      return { ...current, ...Object.fromEntries(missing.map((id) => [id, null])) }
    })
    return () => { cancelled = true }
  }, [posts, token])

  // Load saved state for visible posts
  useEffect(() => {
    if (!token || posts.length === 0) return
    let cancelled = false
    setSavedPostsById((current) => {
      const missing = posts.map((p) => p.id).filter((id) => current[id] === undefined)
      if (missing.length === 0) return current
      fetchUserSavedPosts(missing, token).then((map) => {
        if (!cancelled) setSavedPostsById((prev) => ({ ...prev, ...map }))
      })
      return { ...current, ...Object.fromEntries(missing.map((id) => [id, null])) }
    })
    return () => { cancelled = true }
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

  const handlePostVote = async (postId, direction) => {
    if (!token) { alert('Please login to vote.'); return }
    if (pendingPostVotes[postId]) return

    const nextVoteType = voteValueFromDirection(direction)
    const previousVote = postVotesById[postId] || { id: null, type: 0 }
    const previousVoteType = previousVote.type ?? 0
    if (previousVoteType === nextVoteType && !previousVote.id) return

    setPendingPostVotes((p) => ({ ...p, [postId]: true }))

    if (previousVoteType === nextVoteType && previousVote.id) {
      setPosts((cur) => cur.map((p) => p.id === postId ? { ...p, votes: p.votes - previousVoteType } : p))
      setPostVotesById((cur) => ({ ...cur, [postId]: { id: null, type: 0 } }))
      try {
        await deletePostVote({ voteId: previousVote.id, token })
      } catch {
        setPosts((cur) => cur.map((p) => p.id === postId ? { ...p, votes: p.votes + previousVoteType } : p))
        setPostVotesById((cur) => ({ ...cur, [postId]: previousVote }))
      } finally {
        setPendingPostVotes((p) => ({ ...p, [postId]: false }))
      }
      return
    }

    const delta = nextVoteType - previousVoteType
    setPosts((cur) => cur.map((p) => p.id === postId ? { ...p, votes: p.votes + delta } : p))
    setPostVotesById((cur) => ({ ...cur, [postId]: { ...(cur[postId] || {}), type: nextVoteType } }))

    try {
      const vote = await submitPostVote({ postId, voteType: nextVoteType, token })
      setPostVotesById((cur) => ({ ...cur, [postId]: { id: vote.id, type: vote.type } }))
    } catch {
      setPosts((cur) => cur.map((p) => p.id === postId ? { ...p, votes: p.votes - delta } : p))
      setPostVotesById((cur) => ({ ...cur, [postId]: { ...(cur[postId] || {}), type: previousVoteType } }))
    } finally {
      setPendingPostVotes((p) => ({ ...p, [postId]: false }))
    }
  }

  const handleToggleSavePost = async (postId) => {
    if (!token) { alert('Please login to save posts.'); return }
    if (pendingSavedPosts[postId]) return

    const previous = savedPostsById[postId] ?? null
    setPendingSavedPosts((p) => ({ ...p, [postId]: true }))

    try {
      if (previous?.id) {
        setSavedPostsById((cur) => ({ ...cur, [postId]: null }))
        await unsaveItem({ savedItemId: previous.id, token })
      } else {
        const created = await savePost({ postId, token })
        setSavedPostsById((cur) => ({ ...cur, [postId]: { id: created.id, postId: created.postId } }))
      }
    } catch {
      setSavedPostsById((cur) => ({ ...cur, [postId]: previous }))
    } finally {
      setPendingSavedPosts((p) => ({ ...p, [postId]: false }))
      setOpenMorePostId(null)
    }
  }

  if (!query.trim()) {
    return (
      <div className='search-results-page'>
        <p className='sr-empty'>No search term provided.</p>
      </div>
    )
  }

  return (
    <div className='search-results-page'>
      <div className='sr-header'>
        <h1 className='sr-title'>
          Results for <span className='sr-query'>&ldquo;{query}&rdquo;</span>
        </h1>
      </div>

      <div className='sr-tabs'>
        <button
          className={`sr-tab ${activeTab === 'posts' ? 'sr-tab--active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          Posts
          {!loadingPosts && <span className='sr-tab-count'>{posts.length}</span>}
        </button>
        <button
          className={`sr-tab ${activeTab === 'communities' ? 'sr-tab--active' : ''}`}
          onClick={() => setActiveTab('communities')}
        >
          Communities
          {!loadingCommunities && <span className='sr-tab-count'>{communities.length}</span>}
        </button>
      </div>

      {activeTab === 'posts' && (
        <div className='sr-posts-feed' ref={postsWrapRef}>
          {loadingPosts && <p className='sr-loading'>Searching posts...</p>}
          {!loadingPosts && posts.length === 0 && (
            <p className='sr-empty'>No posts found for &ldquo;{query}&rdquo;.</p>
          )}
          {posts.map((post) => {
            const postImageSrc = normalizeImageSrc(post.imageUrl ?? post.ImageUrl)
            return (
              <article className='post' key={post.id}>
                <div className='post-main'>
                  <header className='post-header'>
                    <img src={avatar} alt='Community Avatar' className='avatar' />
                    <div className='post-meta'>
                      <Link
                        to={`/community/${encodeURIComponent(post.communitySlug)}`}
                        className='community-name community-link'
                      >
                        c/{post.communitySlug}
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
                          setOpenMorePostId((prev) => prev === post.id ? null : post.id)
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
                            {savedPostsById[post.id]?.id ? 'Unsave' : 'Save'}
                          </button>
                          <button className='more-menu-item more-menu-danger' role='menuitem'>
                            Report
                          </button>
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
                    {post.body && (
                      <p className='post-text'>
                        {post.body.length > 200 ? post.body.slice(0, 200) + '…' : post.body}
                      </p>
                    )}
                    {postImageSrc && (
                      <div className='post-media'>
                        <Link
                          to={`/community/${encodeURIComponent(post.communitySlug)}/post/${post.id}`}
                          className='post-media-link'
                        >
                          <div className='media-placeholder'>
                            <img src={postImageSrc} alt='Post content' />
                          </div>
                        </Link>
                      </div>
                    )}
                  </div>

                  <footer className='post-footer'>
                    <div className='action-chip vote-chip'>
                      <FaCaretUp
                        className={`vote-icon upvote ${postVotesById[post.id]?.type === 1 ? 'active' : ''}`}
                        onClick={() => handlePostVote(post.id, 'up')}
                        style={{
                          pointerEvents: pendingPostVotes[post.id] ? 'none' : 'auto',
                          opacity: pendingPostVotes[post.id] ? 0.6 : 1,
                        }}
                      />
                      <span className='vote-count'>{post.votes}</span>
                      <FaCaretDown
                        className={`vote-icon downvote ${postVotesById[post.id]?.type === -1 ? 'active' : ''}`}
                        onClick={() => handlePostVote(post.id, 'down')}
                        style={{
                          pointerEvents: pendingPostVotes[post.id] ? 'none' : 'auto',
                          opacity: pendingPostVotes[post.id] ? 0.6 : 1,
                        }}
                      />
                    </div>
                    <Link
                      to={`/community/${encodeURIComponent(post.communitySlug)}/post/${post.id}`}
                      className='action-chip'
                    >
                      <FaComment className='comment-icon' />
                      <span className='comment-count'>{post.commentsCount}</span>
                    </Link>
                  </footer>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {activeTab === 'communities' && (
        <div className='sr-communities-list'>
          {loadingCommunities && <p className='sr-loading'>Searching communities...</p>}
          {!loadingCommunities && communities.length === 0 && (
            <p className='sr-empty'>No communities found for &ldquo;{query}&rdquo;.</p>
          )}
          {communities.map((c) => {
            const communityAvatarSrc = normalizeImageSrc(c.avatarUrl)
            return (
              <div key={c.id} className='sr-community-row'>
                <div className='sr-community-avatar'>
                  {communityAvatarSrc ? (
                    <img src={communityAvatarSrc} alt={c.title} />
                  ) : (
                    <div className='sr-community-avatar-fallback'>
                      <FaUsers />
                    </div>
                  )}
                </div>
                <div className='sr-community-info'>
                  <Link to={`/community/${c.slug}`} className='sr-community-name'>
                    c/{c.slug}
                  </Link>
                  <span className='sr-community-members'>
                    {c.membersCount.toLocaleString()} members
                  </span>
                  {c.description && (
                    <p className='sr-community-description'>
                      {c.description.length > 200 ? c.description.slice(0, 200) + '…' : c.description}
                    </p>
                  )}
                </div>
                <Link to={`/community/${c.slug}`} className='sr-community-visit-btn'>
                  Visit
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default SearchResults
