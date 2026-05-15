import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './Styles/Home.css'
import avatar from './img/avatar.webp'
import { FaCaretUp, FaCaretDown, FaComment } from 'react-icons/fa'
import { normalizeImageSrc } from './utils/media'
import { useAuth } from './AuthContext'
import {
  deletePostVote,
  fetchUserPostVotes,
  submitPostVote,
  voteValueFromDirection,
} from './utils/voteApi'

const SORT_OPTIONS = [
  { id: 'popular', label: 'Popular' },
  { id: 'new', label: 'New' },
  { id: 'mostComments', label: 'Most comments' },
]

export const Home = () => {
  const { user } = useAuth()
  const [openMorePostId, setOpenMorePostId] = useState(null)
  const [sortBy, setSortBy] = useState('popular')
  const [isSortOpen, setIsSortOpen] = useState(false)

  const sortRef = useRef(null)
  const postsWrapRef = useRef(null)

  const [posts, setPosts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [postVotesById, setPostVotesById] = useState({})
  const [pendingPostVotes, setPendingPostVotes] = useState({})

  useEffect(() => {
    setIsLoading(true)
    fetch(`/api/posts?sortBy=${sortBy}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`)
        return res.json()
      })
      .then((data) => {
        setPosts(data)
        setIsLoading(false)
      })
      .catch((err) => {
        console.error('[Posts fetch error]', err)
        setIsLoading(false)
      })
  }, [sortBy])

  useEffect(() => {
    if (!user?.id || posts.length === 0) {
      setPostVotesById({})
      return
    }

    let cancelled = false

    fetchUserPostVotes(
      posts.map((post) => post.id),
      user.id,
    ).then((votesMap) => {
      if (!cancelled) {
        setPostVotesById(votesMap)
      }
    })

    return () => {
      cancelled = true
    }
  }, [posts, user?.id])

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

  const currentSortLabel =
    SORT_OPTIONS.find((option) => option.id === sortBy)?.label ?? 'Popular'

  const handlePostVote = async (postId, direction) => {
    if (!user?.id) {
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
        await deletePostVote({ voteId: previousVote.id, userId: user.id })
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
        alert(error.message)
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
        post.id === postId ? { ...post, votes: (post.votes ?? 0) + voteDelta } : post,
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
        userId: user.id,
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

  return (
    <div className='home'>
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
                    <img
                      src={avatar}
                      alt='Community Avatar'
                      className='avatar'
                    />
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
                      <Link
                        to={`/user/${encodeURIComponent(post.authorName)}`}
                        className='author author-link'
                      >
                        Posted by u/{post.authorName}
                      </Link>
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
                          <button className='more-menu-item' role='menuitem'>
                            Save
                          </button>
                          <button
                            className='more-menu-item more-menu-danger'
                            role='menuitem'
                          >
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
      </div>
    </div>
  )
}
