import { useState } from 'react'
import './Styles/Home.css'
import avatar from './img/avatar.webp'
import coding from './img/coding.jpg'
import nature from './img/nature.jpg'

export const Home = () => {
  const [isMoreOpen, setIsMoreOpen] = useState(false)

  const handleToggleMore = () => {
    setIsMoreOpen((prev) => !prev)
  }

  return (
    <div className='home'>
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
              <button className='vote-button upvote'>▲</button>
              <span className='vote-count'>324</span>
              <button className='vote-button downvote'>▼</button>
            </div>

            <button className='action-chip'>Comment</button>

            <button className='action-chip'>Share</button>
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
              <button className='vote-button upvote'>▲</button>
              <span className='vote-count'>324</span>
              <button className='vote-button downvote'>▼</button>
            </div>

            <button className='action-chip'>Comment</button>

            <button className='action-chip'>Share</button>
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
              <button className='vote-button upvote'>▲</button>
              <span className='vote-count'>324</span>
              <button className='vote-button downvote'>▼</button>
            </div>

            <button className='action-chip'>Comment</button>

            <button className='action-chip'>Share</button>
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
              <button className='vote-button upvote'>▲</button>
              <span className='vote-count'>324</span>
              <button className='vote-button downvote'>▼</button>
            </div>

            <button className='action-chip'>Comment</button>

            <button className='action-chip'>Share</button>
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
              <button className='vote-button upvote'>▲</button>
              <span className='vote-count'>324</span>
              <button className='vote-button downvote'>▼</button>
            </div>

            <button className='action-chip'>Comment</button>

            <button className='action-chip'>Share</button>
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
              <button className='vote-button upvote'>▲</button>
              <span className='vote-count'>324</span>
              <button className='vote-button downvote'>▼</button>
            </div>

            <button className='action-chip'>Comment</button>

            <button className='action-chip'>Share</button>
          </div>
        </div>
      </div>
    </div>
  )
}
