import { useState } from 'react'
import './Styles/Notification.css'
import avatar from './img/avatar.webp'

const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    title: 'New comment on your post',
    description: 'Someone replied to your thread in r/FrontendDesign.',
    time: '2 min ago',
    badge: 'New',
  },
  {
    id: 2,
    title: 'Your post is trending',
    description:
      '“Building a Reddit-style forum in React” is gaining more upvotes.',
    time: '1 h ago',
    badge: null,
  },
  {
    id: 3,
    title: 'Your post is trending',
    description:
      '“Building a Reddit-style forum in React” is gaining more upvotes.',
    time: '1 h ago',
    badge: null,
  },

  {
    id: 3,
    title: 'Your post is trending',
    description:
      '“Building a Reddit-style forum in React” is gaining more upvotes.',
    time: '1 h ago',
    badge: null,
  },

  {
    id: 3,
    title: 'Your post is trending',
    description:
      '“Building a Reddit-style forum in React” is gaining more upvotes.',
    time: '1 h ago',
    badge: null,
  },

  {
    id: 3,
    title: 'Your post is trending',
    description:
      '“Building a Reddit-style forum in React” is gaining more upvotes.',
    time: '1 h ago',
    badge: null,
  },
]

export const Notification = () => {
  const [hasNotifications, setHasNotifications] = useState(1) // 1 = are notificări, 0 = nu are

  return (
    <main className='notifications-page'>
      <div className='notifications-container'>
        <section className='notifications-header'>
          <h1 className='notifications-title'>Notifications</h1>
          <p className='notifications-subtitle'>
            Stay up to date with new comments, votes and community activity.
          </p>
          <button
            type='button'
            className='notifications-toggle'
            onClick={() => setHasNotifications(hasNotifications === 1 ? 0 : 1)}
          >
            Toggle View ({hasNotifications === 1 ? 'With' : 'Without'}{' '}
            Notifications)
          </button>
        </section>

        <section className='notifications-content'>
          {hasNotifications === 1 ? (
            /* Design cu notificări */
            <div className='notifications-card'>
              <div className='notifications-card-header'>
                <h2 className='notifications-card-title'>Recent Activity</h2>
                <span className='notifications-count'>
                  {MOCK_NOTIFICATIONS.length} new
                </span>
              </div>

              <ul className='notifications-list'>
                {MOCK_NOTIFICATIONS.map((notification) => (
                  <li key={notification.id} className='notification-item'>
                    <div className='notification-icon'>
                      <span className='notification-icon-dot' />
                    </div>
                    <div className='notification-main'>
                      <div className='notification-main-header'>
                        <span className='notification-title'>
                          {notification.title}
                        </span>
                        {notification.badge && (
                          <span className='notification-badge'>
                            {notification.badge}
                          </span>
                        )}
                      </div>
                      <p className='notification-description'>
                        {notification.description}
                      </p>
                      <div className='notification-footer'>
                        <span className='notification-time'>
                          {notification.time}
                        </span>
                        <button
                          type='button'
                          className='notification-view-button'
                        >
                          View thread
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            /* Design fără notificări */
            <div className='notifications-empty-card'>
              <div className='notifications-empty'>
                <div className='notifications-empty-illustration'>
                  <img
                    src={avatar}
                    alt='No notifications'
                    className='notifications-empty-avatar'
                  />
                </div>
                <h2 className='notifications-empty-title'>
                  You don&apos;t have any activity yet
                </h2>
                <p className='notifications-empty-text'>
                  That&apos;s okay, explore communities and start posting to see
                  notifications here.
                </p>
                <button type='button' className='notifications-empty-button'>
                  Discover communities
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
