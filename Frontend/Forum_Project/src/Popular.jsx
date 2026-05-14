import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './Styles/Popular.css'
import avatar from './img/avatar.webp'
import shreck from './img/shreck.png'
import nature from './img/nature.jpg'
import { FaCaretUp, FaCaretDown, FaComment, FaShare } from 'react-icons/fa'

const SORT_OPTIONS = [
  { id: 'popular', label: 'Popular' },
  { id: 'new', label: 'New' },
  { id: 'mostComments', label: 'Most comments' },
]

const POSTS = [
  {
    id: 1,
    community: 'r/memes',
    time: '2 hours ago',
    author: 'u/lolMaster',
    title: 'Top trending post of the day',
    text: 'This one exploded in activity. What do you think made it so shareable compared to the rest of this week?',
    image: nature,
    votes: 1240,
    comments: 312,
  },
  {
    id: 2,
    community: 'r/travel',
    time: '4 hours ago',
    author: 'u/wanderFlow',
    title: 'Most upvoted photo story this week',
    text: 'A visual journey with details and route notes. The community loved the structure and quality of storytelling.',
    image: nature,
    votes: 860,
    comments: 188,
  },
  {
    id: 3,
    community: 'r/webdev',
    time: '7 hours ago',
    author: 'u/frontendAce',
    title: 'Popular architecture debate for large React apps',
    text: 'A thread about scalable folders, shared components and design consistency across complex product pages.',
    image: nature,
    votes: 645,
    comments: 144,
  },
]

const handleVote = (type) => {
  if (type === 'up') {
    console.log('Upvoted')
  } else if (type === 'down') {
    console.log('Downvoted')
  }
}

const getUsernameFromAuthor = (author) => author.replace(/^u\//, '')
const getSlugFromCommunity = (community) => community.replace(/^r\//, '')
const getPostRoute = (post) =>
  `/community/${encodeURIComponent(getSlugFromCommunity(post.community))}/post/${post.id}`

export const Popular = () => {
  const [openMorePostId, setOpenMorePostId] = useState(null)
  const [sortBy, setSortBy] = useState('popular')
  const [isSortOpen, setIsSortOpen] = useState(false)

  const sortRef = useRef(null)
  const postsWrapRef = useRef(null)

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

  return (
    <div className='popular-page'>
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
        {POSTS.map((post) => (
          <article className='post' key={post.id}>
            <div className='post-main'>
              <header className='post-header'>
                <img src={avatar} alt='Community Avatar' className='avatar' />
                <div className='post-meta'>
                  <Link
                    to={`/community/${encodeURIComponent(getSlugFromCommunity(post.community))}`}
                    className='community-name community-link'
                  >
                    {post.community}
                  </Link>
                  <span className='meta-separator'>&middot;</span>
                  <span className='time-posted'>{post.time}</span>
                  <span className='meta-separator'>&middot;</span>
                  <Link
                    to={`/user/${encodeURIComponent(getUsernameFromAuthor(post.author))}`}
                    className='author author-link'
                  >
                    Posted by {post.author}
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
                <p className='post-text'>{post.text}</p>

                <div className='post-media'>
                  <Link to={getPostRoute(post)} className='post-media-link'>
                    <div className='media-placeholder'>
                      <img src={post.image} alt='Post content' />
                    </div>
                  </Link>
                </div>
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
                  <span className='comment-count'>{post.comments}</span>
                </Link>
              </footer>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
