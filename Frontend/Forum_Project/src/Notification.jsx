import { useNavigate } from 'react-router-dom'
import {
  FaRegComment,
  FaReply,
  FaArrowUp,
  FaBan,
  FaTrash,
  FaBell,
  FaEnvelopeOpenText,
} from 'react-icons/fa'
import { useNotifications } from './NotificationContext'
import { normalizeImageSrc } from './utils/media'
import './Styles/Notification.css'

const TYPE_CONFIG = {
  NewComment: {
    label: 'New Comment',
    Icon: FaRegComment,
    color: '#0f43c7',
    bg: 'rgba(15, 67, 199, 0.11)',
  },
  NewReply: {
    label: 'New Reply',
    Icon: FaReply,
    color: '#7c3aed',
    bg: 'rgba(124, 58, 237, 0.11)',
  },
  PostUpvoted: {
    label: 'Post Upvoted',
    Icon: FaArrowUp,
    color: '#16a34a',
    bg: 'rgba(22, 163, 74, 0.11)',
  },
  CommentUpvoted: {
    label: 'Comment Upvoted',
    Icon: FaArrowUp,
    color: '#0891b2',
    bg: 'rgba(8, 145, 178, 0.11)',
  },
  Banned: {
    label: 'Banned from Community',
    Icon: FaBan,
    color: '#dc2626',
    bg: 'rgba(220, 38, 38, 0.11)',
  },
  PostDeletedByMod: {
    label: 'Post Removed',
    Icon: FaTrash,
    color: '#ea580c',
    bg: 'rgba(234, 88, 12, 0.11)',
  },
  CommentDeletedByMod: {
    label: 'Comment Removed',
    Icon: FaTrash,
    color: '#d97706',
    bg: 'rgba(217, 119, 6, 0.11)',
  },
  ContactReply: {
    label: 'Reply from Admin',
    Icon: FaEnvelopeOpenText,
    color: '#0f43c7',
    bg: 'rgba(15, 67, 199, 0.11)',
  },
  KickedFromCommunity: {
    label: 'Kicked from Community',
    Icon: FaBan,
    color: '#dc2626',
    bg: 'rgba(220, 38, 38, 0.11)',
  },
}

const FALLBACK_CONFIG = {
  label: 'Notification',
  Icon: FaBell,
  color: '#566a89',
  bg: 'rgba(86, 106, 137, 0.11)',
}

const formatTime = (dateString) => {
  const diff = Date.now() - new Date(dateString)
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return d === 1 ? '1 day ago' : `${d} days ago`
}

const getNavigationPath = (n) => {
  if (
    n.communitySlug &&
    n.postId &&
    ['NewComment', 'NewReply', 'PostUpvoted', 'CommentUpvoted'].includes(n.type)
  )
    return `/community/${n.communitySlug}/post/${n.postId}`
  if (n.communitySlug) return `/community/${n.communitySlug}`
  return null
}

const ActorAvatar = ({ actorUsername, actorAvatarUrl, color }) => {
  if (actorAvatarUrl) {
    return (
      <img
        src={normalizeImageSrc(actorAvatarUrl) || actorAvatarUrl}
        alt={actorUsername}
        className='notif-actor-avatar'
      />
    )
  }
  if (actorUsername) {
    return (
      <div className='notif-actor-initials' style={{ background: color }}>
        {actorUsername[0].toUpperCase()}
      </div>
    )
  }
  return null
}

export const Notification = () => {
  const navigate = useNavigate()
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    removeNotification,
  } = useNotifications()

  if (loading) {
    return (
      <main className='notif-page'>
        <div className='notif-container'>
          <div className='notif-header'>
            <h1 className='notif-title'>Notifications</h1>
          </div>
          <div className='notif-loading'>
            <FaBell size={28} className='notif-loading-icon' />
            <p>Loading notifications...</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className='notif-page'>
      <div className='notif-container'>
        <div className='notif-header'>
          <div className='notif-header-left'>
            <h1 className='notif-title'>Notifications</h1>
            <p className='notif-subtitle'>
              Activity on your posts, comments and communities.
            </p>
          </div>
          {unreadCount > 0 && (
            <div className='notif-header-right'>
              <span className='notif-unread-chip'>{unreadCount} unread</span>
              <button className='notif-mark-all-btn' onClick={markAllAsRead}>
                Mark all as read
              </button>
            </div>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className='notif-empty'>
            <div className='notif-empty-icon-wrap'>
              <FaBell size={36} />
            </div>
            <h2 className='notif-empty-title'>No notifications yet</h2>
            <p className='notif-empty-text'>
              Explore communities and start posting to receive notifications here.
            </p>
            <button
              className='notif-empty-btn'
              onClick={() => navigate('/explore')}
            >
              Discover Communities
            </button>
          </div>
        ) : (
          <div className='notif-list'>
            {notifications.map((n) => {
              const cfg = TYPE_CONFIG[n.type] ?? FALLBACK_CONFIG
              const { Icon, color, bg, label } = cfg
              const navPath = getNavigationPath(n)

              return (
                <div
                  key={n.id}
                  className={`notif-item${!n.isRead ? ' notif-item--unread' : ''}`}
                  style={!n.isRead ? { borderLeftColor: color } : {}}
                >
                  <div
                    className='notif-type-icon'
                    style={{ background: bg, color }}
                  >
                    <Icon size={15} />
                  </div>

                  <div className='notif-content'>
                    <div className='notif-content-top'>
                      <span
                        className='notif-type-badge'
                        style={{ background: bg, color }}
                      >
                        {label}
                      </span>
                      {!n.isRead && <span className='notif-new-dot' />}
                      <span className='notif-time'>{formatTime(n.createdAt)}</span>
                    </div>

                    <p className='notif-message'>{n.message}</p>

                    {(n.actorUsername || n.postTitle) && (
                      <div className='notif-meta'>
                        {n.actorUsername && (
                          <div className='notif-actor'>
                            <ActorAvatar
                              actorUsername={n.actorUsername}
                              actorAvatarUrl={n.actorAvatarUrl}
                              color={color}
                            />
                            <span className='notif-actor-name'>
                              u/{n.actorUsername}
                            </span>
                          </div>
                        )}
                        {n.postTitle && (
                          <span className='notif-post-title'>
                            &ldquo;{n.postTitle}&rdquo;
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className='notif-actions'>
                    {navPath && (
                      <button
                        className='notif-btn-view'
                        style={{ color, borderColor: color }}
                        onClick={() => {
                          if (!n.isRead) markAsRead(n.id)
                          navigate(navPath)
                        }}
                      >
                        View
                      </button>
                    )}
                    {!n.isRead && (
                      <button
                        className='notif-btn-read'
                        onClick={() => markAsRead(n.id)}
                      >
                        Mark read
                      </button>
                    )}
                    <button
                      className='notif-btn-dismiss'
                      onClick={() => removeNotification(n.id)}
                      title='Dismiss'
                    >
                      ×
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
