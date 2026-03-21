import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import './Styles/UserProfile.css'
import avatar from './img/avatar.webp'

const LOGGED_USERNAME = 'username'

const OWNER_ACTIVITY = [
  {
    id: 1,
    community: 'r/frontend',
    title: 'Feedback for my forum landing page',
    text: 'I just finished a first pass for the landing page. Looking for UX suggestions and responsive layout ideas.',
    score: 124,
    comments: 28,
    age: '4h ago',
  },
  {
    id: 2,
    community: 'r/reactjs',
    title: 'Reusable card pattern for feed and profile pages',
    text: 'I am comparing composition patterns for cards that can be reused across multiple routes.',
    score: 89,
    comments: 17,
    age: '9h ago',
  },
]

const VISITOR_ACTIVITY = [
  {
    id: 1,
    community: 'r/ketorecipes',
    title: 'Skirt steak meal prep idea',
    text: 'Simple prep flow with a short ingredient list and easy reheating steps.',
    score: 31,
    comments: 8,
    age: '11h ago',
  },
  {
    id: 2,
    community: 'r/15minutefood',
    title: 'Quick recipe for busy weekdays',
    text: 'High protein dish that can be done in around 15 minutes.',
    score: 26,
    comments: 5,
    age: '13h ago',
  },
]

export const UserProfile = () => {
  const { username = '' } = useParams()
  const normalizedUsername = username.trim() || 'unknown-user'
  const isOwnerProfile = normalizedUsername.toLowerCase() === LOGGED_USERNAME

  const tabs = useMemo(
    () =>
      isOwnerProfile
        ? ['Overview', 'Posts', 'Comments', 'Saved', 'Hidden']
        : ['Overview', 'Posts', 'Comments'],
    [isOwnerProfile],
  )

  const activity = isOwnerProfile ? OWNER_ACTIVITY : VISITOR_ACTIVITY

  return (
    <main className='profile-page'>
      <section className='profile-header-card'>
        <div className='profile-banner'>
          {isOwnerProfile && (
            <button type='button' className='profile-banner-action'>
              Change banner
            </button>
          )}
        </div>

        <div className='profile-header-main'>
          <img src={avatar} alt='User avatar' className='profile-avatar' />

          <div className='profile-identity'>
            <h1 className='profile-display-name'>
              {isOwnerProfile ? 'My Profile' : normalizedUsername}
            </h1>
            <p className='profile-username'>u/{normalizedUsername}</p>
            <p className='profile-meta'>Joined 2023 • 2y account age</p>
          </div>

          <div className='profile-actions'>
            {isOwnerProfile ? (
              <>
                <button type='button' className='profile-btn profile-btn-primary'>
                  Edit profile
                </button>
                <button
                  type='button'
                  className='profile-btn profile-btn-secondary'
                >
                  Manage posts
                </button>
              </>
            ) : (
              <>
                <button type='button' className='profile-btn profile-btn-primary'>
                  Follow
                </button>
                <button
                  type='button'
                  className='profile-btn profile-btn-secondary'
                >
                  Start chat
                </button>
              </>
            )}
          </div>
        </div>

        <div className='profile-stats'>
          <div className='profile-stat'>
            <span className='profile-stat-value'>5,955</span>
            <span className='profile-stat-label'>Karma</span>
          </div>
          <div className='profile-stat'>
            <span className='profile-stat-value'>619</span>
            <span className='profile-stat-label'>Contributions</span>
          </div>
          <div className='profile-stat'>
            <span className='profile-stat-value'>12</span>
            <span className='profile-stat-label'>Communities</span>
          </div>
        </div>

        <nav className='profile-tabs' aria-label='Profile sections'>
          {tabs.map((tab) => (
            <button type='button' key={tab} className='profile-tab'>
              {tab}
            </button>
          ))}
        </nav>
      </section>

      <section className='profile-content'>
        <div className='profile-feed'>
          {activity.map((item) => (
            <article key={item.id} className='profile-post-card'>
              <p className='profile-post-meta'>
                {item.community} • {item.age}
              </p>
              <h2 className='profile-post-title'>{item.title}</h2>
              <p className='profile-post-text'>{item.text}</p>
              <div className='profile-post-stats'>
                <span>{item.score} votes</span>
                <span>{item.comments} comments</span>
              </div>
            </article>
          ))}

          {isOwnerProfile && (
            <article className='profile-private-card'>
              <h3>Private workspace</h3>
              <p>
                Drafts, moderation history, and hidden posts are visible only on
                your own profile.
              </p>
            </article>
          )}
        </div>

        <aside className='profile-side'>
          <article className='profile-side-card'>
            <h3>{isOwnerProfile ? 'Your achievements' : 'Public highlights'}</h3>
            <ul>
              <li>Top 10% commenter</li>
              <li>Verified account</li>
              <li>One year club</li>
            </ul>
          </article>

          <article className='profile-side-card'>
            <h3>{isOwnerProfile ? 'Quick actions' : 'Shared communities'}</h3>
            {isOwnerProfile ? (
              <ul>
                <li>Create post</li>
                <li>Update avatar</li>
                <li>Manage community</li>
              </ul>
            ) : (
              <ul>
                <li>r/15minutefood</li>
                <li>r/3amjokes</li>
                <li>r/ketorecipes</li>
              </ul>
            )}
          </article>
        </aside>
      </section>
    </main>
  )
}

