import { useState, useRef, useEffect } from 'react'
import './Styles/Home.css'
import avatar from './img/avatar.webp'
import coding from './img/coding.jpg'
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
    community: 'r/frontend',
    time: '6 hours ago',
    author: 'u/exampleUser',
    title: 'How would you design a modern forum homepage?',
    text: 'I am working on a frontend forum project and would love feedback on layout, typography, and interactions. What patterns from Reddit-style communities do you think are essential?',
    image: coding,
    votes: 324,
    comments: 67,
  },
  {
    id: 2,
    community: 'r/frontend',
    time: '8 hours ago',
    author: 'u/designPilot',
    title: 'What is your preferred structure for reusable React cards?',
    text: 'I want better composition for list cards and details cards. Curious what naming and folder conventions you use in larger apps.',
    image: nature,
    votes: 211,
    comments: 39,
  },
  {
    id: 3,
    community: 'r/webdev',
    time: '11 hours ago',
    author: 'u/devFlow',
    title: 'Best way to keep feed interactions consistent across pages',
    text: 'We currently duplicate feed UI in multiple routes. Looking for an approach that keeps style and behavior perfectly aligned.',
    image: coding,
    votes: 189,
    comments: 24,
  },
]

const handleVote = (type) => {
  if (type === 'up') {
    console.log('Upvoted')
  } else if (type === 'down') {
    console.log('Downvoted')
  }
}

export const Home = () => {
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
        {POSTS.map((post) => (
          <article className='post' key={post.id}>
            <div className='post-main'>
              <header className='post-header'>
                <img src={avatar} alt='Community Avatar' className='avatar' />
                <div className='post-meta'>
                  <span className='community-name'>{post.community}</span>
                  <span className='meta-separator'>&middot;</span>
                  <span className='time-posted'>{post.time}</span>
                  <span className='meta-separator'>&middot;</span>
                  <span className='author'>Posted by {post.author}</span>
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
                <h3 className='post-title'>{post.title}</h3>
                <p className='post-text'>{post.text}</p>

                <div className='post-media'>
                  <div className='media-placeholder'>
                    <img src={post.image} alt='Post content' />
                  </div>
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

                <button type='button' className='action-chip'>
                  <FaComment className='comment-icon' />
                  <span className='comment-count'>{post.comments}</span>
                </button>

                <button type='button' className='action-chip'>
                  <FaShare className='share-icon' />
                </button>
              </footer>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
