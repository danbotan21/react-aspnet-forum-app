import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './Styles/Popular.css'
import avatar from './img/avatar.webp'
import { FaCaretUp, FaCaretDown, FaComment } from 'react-icons/fa'
import { normalizeImageSrc } from './utils/media'

const handleVote = (type) => {
  if (type === 'up') {
    console.log('Upvoted')
  } else if (type === 'down') {
    console.log('Downvoted')
  }
}

const getPostRoute = (post) =>
  `/community/${encodeURIComponent(post.communitySlug)}/post/${post.id}`

const getRecentPopularityScore = (post) => {
  const votes = post.votes ?? 0
  const createdAt = post.createdAt ? new Date(post.createdAt).getTime() : 0
  const ageHours = Math.max((Date.now() - createdAt) / (1000 * 60 * 60), 1)
  return votes / Math.pow(ageHours, 0.75)
}

export const Popular = () => {
  const [openMorePostId, setOpenMorePostId] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const postsWrapRef = useRef(null)

  useEffect(() => {
    fetch('/api/posts?sortBy=top')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`)
        return res.json()
      })
      .then((data) => {
        const sortedByRecentPopularity = [...data].sort(
          (a, b) => getRecentPopularityScore(b) - getRecentPopularityScore(a),
        )
        setPosts(sortedByRecentPopularity)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

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

  return (
    <div className='popular-page'>
      <div ref={postsWrapRef}>
        {loading ? (
          <p style={{ textAlign: 'center', padding: '2rem' }}>Loading popular posts...</p>
        ) : error ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>{error}</p>
        ) : posts.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '2rem' }}>No posts found.</p>
        ) : posts.map((post) => {
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
                  <Link to={getPostRoute(post)} className='post-title-link'>
                    {post.title}
                  </Link>
                </h3>
                {post.body && <p className='post-text'>{post.body}</p>}

                {(postImageSrc || post.linkUrl) && (
                  <div className='post-media'>
                    {postImageSrc ? (
                      <Link to={getPostRoute(post)} className='post-media-link'>
                        <div className='media-placeholder'>
                          <img src={postImageSrc} alt='Post content' />
                        </div>
                      </Link>
                    ) : (
                      <div className='media-placeholder'>
                        <a href={post.linkUrl} target='_blank' rel='noopener noreferrer' style={{ color: '#0066cc', textDecoration: 'underline' }}>
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
                    className='vote-icon upvote'
                    onClick={() => handleVote('up')}
                  />
                  <span className='vote-count'>{post.votes}</span>
                  <FaCaretDown
                    className='vote-icon downvote'
                    onClick={() => handleVote('down')}
                  />
                </div>

                <Link to={getPostRoute(post)} className='action-chip'>
                  <FaComment className='comment-icon' />
                  <span className='comment-count'>{post.commentsCount}</span>
                </Link>
              </footer>
            </div>
          </article>
          )
        })}
      </div>
    </div>
  )
}
