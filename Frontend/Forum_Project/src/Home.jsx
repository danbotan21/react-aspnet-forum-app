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

const handleVote = (type) => {
  if (type === 'up') {
    console.log('Upvoted')
    // Upvote logic
  } else if (type === 'down') {
    console.log('Downvoted')
    // Downvote logic
  }
}

export const Home = () => {
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const [sortBy, setSortBy] = useState('popular')
  const [isSortOpen, setIsSortOpen] = useState(false)
  const sortRef = useRef(null)

  const handleToggleMore = () => {
    setIsMoreOpen((prev) => !prev)
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setIsSortOpen(false)
      }
    }
    if (isSortOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isSortOpen])

  const currentSortLabel =
    SORT_OPTIONS.find((o) => o.id === sortBy)?.label ?? 'Popular'

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
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type='button'
                  role='option'
                  aria-selected={sortBy === opt.id}
                  className={`sort-dropdown-item ${sortBy === opt.id ? 'sort-dropdown-item--active' : ''}`}
                  onClick={() => {
                    setSortBy(opt.id)
                    setIsSortOpen(false)
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className='post'>
        <div className='post-main'>
          <div className='post-header'>
            <img src={avatar} alt='Community Avatar' className='avatar' />
            <div className='post-meta'>
              <span className='community-name'>r/frontend</span>
              <span className='meta-separator'>•</span>
              <span className='time-posted'>6 hours ago</span>
              <span className='meta-separator'>•</span>
              <span className='author'>Posted by u/exampleUser</span>
            </div>
            <div className='post-header-actions'>
              <button className='more-button' onClick={handleToggleMore}>
                ...
              </button>
              {isMoreOpen && (
                <div className='more-menu'>
                  <button className='more-menu-item'>Save</button>
                  <button className='more-menu-item more-menu-danger'>
                    Report
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className='post-body'>
            <h3 className='post-title'>
              How would you design a modern forum homepage?
            </h3>
            <p className='post-text'>
              I am working on a frontend forum project and would love feedback
              on layout, typography, and interactions. What patterns from
              Reddit-style communities do you think are essential?
            </p>

            <div className='post-media'>
              <div className='media-placeholder'>
                <img src={coding} alt='Post content' />
              </div>
            </div>
          </div>

          <div className='post-footer'>
            <div className='action-chip vote-chip'>
              <FaCaretUp
                className='vote-icon upvote'
                onClick={() => handleVote('up')}
              />
              <span className='vote-count'>324</span>
              <FaCaretDown
                className='vote-icon downvote'
                onClick={() => handleVote('down')}
              />
            </div>

            <button className='action-chip'>
              <FaComment className='comment-icon' />
              <span className='comment-count'>67</span>
            </button>

            <button className='action-chip'>
              <FaShare className='share-icon' />
            </button>
          </div>
        </div>
      </div>

      <div className='post'>
        <div className='post-main'>
          <div className='post-header'>
            <img src={avatar} alt='Community Avatar' className='avatar' />
            <div className='post-meta'>
              <span className='community-name'>r/frontend</span>
              <span className='meta-separator'>•</span>
              <span className='time-posted'>6 hours ago</span>
              <span className='meta-separator'>•</span>
              <span className='author'>Posted by u/exampleUser</span>
            </div>
            <div className='post-header-actions'>
              <button className='more-button' onClick={handleToggleMore}>
                ...
              </button>
              {isMoreOpen && (
                <div className='more-menu'>
                  <button className='more-menu-item'>Save</button>
                  <button className='more-menu-item more-menu-danger'>
                    Report
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className='post-body'>
            <h3 className='post-title'>
              How would you design a modern forum homepage?
            </h3>
            <p className='post-text'>
              I am working on a frontend forum project and would love feedback
              on layout, typography, and interactions. What patterns from
              Reddit-style communities do you think are essential?
            </p>

            <div className='post-media'>
              <div className='media-placeholder'>
                <img src={nature} alt='Post content' />
              </div>
            </div>
          </div>

          <div className='post-footer'>
            <div className='action-chip vote-chip'>
              <FaCaretUp
                className='vote-icon upvote'
                onClick={() => handleVote('up')}
              />
              <span className='vote-count'>324</span>
              <FaCaretDown
                className='vote-icon downvote'
                onClick={() => handleVote('down')}
              />
            </div>

            <button className='action-chip'>
              <FaComment className='comment-icon' />
              <span className='comment-count'>67</span>
            </button>

            <button className='action-chip'>
              <FaShare className='share-icon' />
            </button>
          </div>
        </div>
      </div>

      <div className='post'>
        <div className='post-main'>
          <div className='post-header'>
            <img src={avatar} alt='Community Avatar' className='avatar' />
            <div className='post-meta'>
              <span className='community-name'>r/frontend</span>
              <span className='meta-separator'>•</span>
              <span className='time-posted'>6 hours ago</span>
              <span className='meta-separator'>•</span>
              <span className='author'>Posted by u/exampleUser</span>
            </div>
            <div className='post-header-actions'>
              <button className='more-button' onClick={handleToggleMore}>
                ...
              </button>
              {isMoreOpen && (
                <div className='more-menu'>
                  <button className='more-menu-item'>Save</button>
                  <button className='more-menu-item more-menu-danger'>
                    Report
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className='post-body'>
            <h3 className='post-title'>
              How would you design a modern forum homepage?
            </h3>
            <p className='post-text'>
              I am working on a frontend forum project and would love feedback
              on layout, typography, and interactions. What patterns from
              Reddit-style communities do you think are essential?
            </p>

            <div className='post-media'>
              <div className='media-placeholder'>
                <img src={coding} alt='Post content' />
              </div>
            </div>
          </div>

          <div className='post-footer'>
            <div className='action-chip vote-chip'>
              <FaCaretUp
                className='vote-icon upvote'
                onClick={() => handleVote('up')}
              />
              <span className='vote-count'>324</span>
              <FaCaretDown
                className='vote-icon downvote'
                onClick={() => handleVote('down')}
              />
            </div>

            <button className='action-chip'>
              <FaComment className='comment-icon' />
              <span className='comment-count'>67</span>
            </button>

            <button className='action-chip'>
              <FaShare className='share-icon' />
            </button>
          </div>
        </div>
      </div>

      <div className='post'>
        <div className='post-main'>
          <div className='post-header'>
            <img src={avatar} alt='Community Avatar' className='avatar' />
            <div className='post-meta'>
              <span className='community-name'>r/frontend</span>
              <span className='meta-separator'>•</span>
              <span className='time-posted'>6 hours ago</span>
              <span className='meta-separator'>•</span>
              <span className='author'>Posted by u/exampleUser</span>
            </div>
            <div className='post-header-actions'>
              <button className='more-button' onClick={handleToggleMore}>
                ...
              </button>
              {isMoreOpen && (
                <div className='more-menu'>
                  <button className='more-menu-item'>Save</button>
                  <button className='more-menu-item more-menu-danger'>
                    Report
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className='post-body'>
            <h3 className='post-title'>
              How would you design a modern forum homepage?
            </h3>
            <p className='post-text'>
              I am working on a frontend forum project and would love feedback
              on layout, typography, and interactions. What patterns from
              Reddit-style communities do you think are essential?
            </p>

            <div className='post-media'>
              <div className='media-placeholder'>
                <img src={nature} alt='Post content' />
              </div>
            </div>
          </div>

          <div className='post-footer'>
            <div className='action-chip vote-chip'>
              <FaCaretUp
                className='vote-icon upvote'
                onClick={() => handleVote('up')}
              />
              <span className='vote-count'>324</span>
              <FaCaretDown
                className='vote-icon downvote'
                onClick={() => handleVote('down')}
              />
            </div>

            <button className='action-chip'>
              <FaComment className='comment-icon' />
              <span className='comment-count'>67</span>
            </button>

            <button className='action-chip'>
              <FaShare className='share-icon' />
            </button>
          </div>
        </div>
      </div>

      <div className='post'>
        <div className='post-main'>
          <div className='post-header'>
            <img src={avatar} alt='Community Avatar' className='avatar' />
            <div className='post-meta'>
              <span className='community-name'>r/frontend</span>
              <span className='meta-separator'>•</span>
              <span className='time-posted'>6 hours ago</span>
              <span className='meta-separator'>•</span>
              <span className='author'>Posted by u/exampleUser</span>
            </div>
            <div className='post-header-actions'>
              <button className='more-button' onClick={handleToggleMore}>
                ...
              </button>
              {isMoreOpen && (
                <div className='more-menu'>
                  <button className='more-menu-item'>Save</button>
                  <button className='more-menu-item more-menu-danger'>
                    Report
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className='post-body'>
            <h3 className='post-title'>
              How would you design a modern forum homepage?
            </h3>
            <p className='post-text'>
              I am working on a frontend forum project and would love feedback
              on layout, typography, and interactions. What patterns from
              Reddit-style communities do you think are essential?
            </p>

            <div className='post-media'>
              <div className='media-placeholder'>
                <img src={coding} alt='Post content' />
              </div>
            </div>
          </div>

          <div className='post-footer'>
            <div className='action-chip vote-chip'>
              <FaCaretUp
                className='vote-icon upvote'
                onClick={() => handleVote('up')}
              />
              <span className='vote-count'>324</span>
              <FaCaretDown
                className='vote-icon downvote'
                onClick={() => handleVote('down')}
              />
            </div>

            <button className='action-chip'>
              <FaComment className='comment-icon' />
              <span className='comment-count'>67</span>
            </button>

            <button className='action-chip'>
              <FaShare className='share-icon' />
            </button>
          </div>
        </div>
      </div>

      <div className='post'>
        <div className='post-main'>
          <div className='post-header'>
            <img src={avatar} alt='Community Avatar' className='avatar' />
            <div className='post-meta'>
              <span className='community-name'>r/frontend</span>
              <span className='meta-separator'>•</span>
              <span className='time-posted'>6 hours ago</span>
              <span className='meta-separator'>•</span>
              <span className='author'>Posted by u/exampleUser</span>
            </div>
            <div className='post-header-actions'>
              <button className='more-button' onClick={handleToggleMore}>
                ...
              </button>
              {isMoreOpen && (
                <div className='more-menu'>
                  <button className='more-menu-item'>Save</button>
                  <button className='more-menu-item more-menu-danger'>
                    Report
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className='post-body'>
            <h3 className='post-title'>
              How would you design a modern forum homepage?
            </h3>
            <p className='post-text'>
              I am working on a frontend forum project and would love feedback
              on layout, typography, and interactions. What patterns from
              Reddit-style communities do you think are essential?
            </p>

            <div className='post-media'>
              <div className='media-placeholder'>
                <img src={coding} alt='Post content' />
              </div>
            </div>
          </div>

          <div className='post-footer'>
            <div className='action-chip vote-chip'>
              <FaCaretUp
                className='vote-icon upvote'
                onClick={() => handleVote('up')}
              />
              <span className='vote-count'>324</span>
              <FaCaretDown
                className='vote-icon downvote'
                onClick={() => handleVote('down')}
              />
            </div>

            <button className='action-chip'>
              <FaComment className='comment-icon' />
              <span className='comment-count'>67</span>
            </button>

            <button className='action-chip'>
              <FaShare className='share-icon' />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
