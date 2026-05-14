import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import './Styles/UserProfile.css'
import avatar from './img/avatar.webp'
import nature from './img/nature.jpg'
import coding from './img/coding.jpg'
import { ProfileOverviewTab } from './ProfileOverviewTab'
import { ProfilePostsTab } from './ProfilePostsTab'
import { ProfileCommentsTab } from './ProfileCommentsTab'
import { ProfileSavedTab } from './ProfileSavedTab'
import { ProfileVotedTab } from './ProfileVotedTab'
import { useAuth } from './AuthContext'
import { normalizeImageSrc } from './utils/media'

const getCommunitySlug = (community) => community.replace(/^r\//, '')
const getCommentPostRoute = (comment) =>
  `/community/${encodeURIComponent(getCommunitySlug(comment.community))}/post/${comment.postId}`

const USER_POSTS = [
  {
    id: 1,
    community: 'r/frontend',
    time: '2 hours ago',
    title: 'How would you design a modern forum homepage?',
    text: 'I am working on a frontend forum project and would love feedback on layout, typography, and interactions. What patterns do you think are essential?',
    image: coding,
    votes: 124,
    comments: 18,
  },
  {
    id: 2,
    community: 'r/webdev',
    time: '1 day ago',
    title: 'Best practices for React component organization',
    text: 'Looking for opinions on how to best organize large React applications with many shared components and pages.',
    image: nature,
    votes: 87,
    comments: 11,
  },
]

const USER_COMMENTS = [
  {
    id: 1,
    community: 'r/ketorecipes',
    postTitle: 'Skirt Steak - best method for maximum flavor',
    postId: 1,
    content:
      'Great method. I tried it with smoked paprika and it worked perfectly. Would definitely recommend this approach.',
    votes: 7,
    time: '11 hr. ago',
  },
  {
    id: 2,
    community: 'r/15minutefood',
    postTitle: 'Quick lunch ideas for busy weekdays',
    postId: 2,
    content:
      'Loved this, super fast and still healthy. Made it twice this week already.',
    votes: 3,
    time: '12 hr. ago',
  },
  {
    id: 3,
    community: 'r/webdev',
    postTitle: 'Best practices for React component organization',
    postId: 3,
    content:
      'Great point about folder structure. I usually separate by feature rather than by type.',
    votes: 12,
    time: '1 day ago',
  },
]

const SAVED_ITEMS = [
  {
    id: 's1',
    type: 'post',
    community: 'r/frontend',
    author: 'u/exampleUser',
    time: '6 hours ago',
    title: 'How would you design a modern forum homepage?',
    text: 'I am working on a frontend forum project and would love feedback on layout, typography, and interactions.',
    image: coding,
    votes: 324,
    comments: 67,
    postId: 1,
  },
  {
    id: 's2',
    type: 'comment',
    community: 'r/ketorecipes',
    author: 'u/chefMike',
    postTitle: 'Skirt Steak - best method for maximum flavor',
    postId: 1,
    content:
      'Great method. I tried it with smoked paprika and it worked perfectly. Would definitely recommend this approach.',
    votes: 14,
    time: '11 hr. ago',
  },
  {
    id: 's3',
    type: 'post',
    community: 'r/webdev',
    author: 'u/devFlow',
    time: '1 day ago',
    title: 'Best practices for React component organization',
    text: 'Looking for opinions on how to best organize large React applications with many shared components.',
    image: nature,
    votes: 87,
    comments: 11,
    postId: 2,
  },
]

const UPVOTED_POSTS = [
  {
    id: 'u1',
    community: 'r/frontend',
    author: 'u/exampleUser',
    time: '6 hours ago',
    title: 'How would you design a modern forum homepage?',
    text: 'I am working on a frontend forum project and would love feedback on layout, typography, and interactions.',
    image: coding,
    votes: 324,
    comments: 67,
    postId: 1,
  },
  {
    id: 'u2',
    community: 'r/webdev',
    author: 'u/devFlow',
    time: '1 day ago',
    title: 'Best practices for React component organization',
    text: 'Looking for opinions on how to best organize large React applications with many shared components and pages.',
    image: nature,
    votes: 87,
    comments: 11,
    postId: 2,
  },
]

const DOWNVOTED_POSTS = [
  {
    id: 'd1',
    community: 'r/memes',
    author: 'u/lolMaster',
    time: '3 hours ago',
    title: 'This meme format is getting old already',
    text: 'Seen this same template reposted at least fifty times this week. Not funny anymore.',
    image: nature,
    votes: 12,
    comments: 8,
    postId: 3,
  },
  {
    id: 'd2',
    community: 'r/technology',
    author: 'u/techBro',
    time: '2 days ago',
    title: 'Why every app needs a subscription model now',
    text: 'Arguing that subscription revenue is the only sustainable model for modern software products.',
    image: coding,
    votes: -34,
    comments: 142,
    postId: 4,
  },
]

export function UserProfile() {
  const { username } = useParams()
  const { user: authUser } = useAuth()

  const loggedUser = authUser?.userName || 'username'
  const displayName = decodeURIComponent(username ?? 'guest')
  const isOwnProfile = displayName.toLowerCase() === loggedUser.toLowerCase()

  const ownTabs = [
    'Overview',
    'Posts',
    'Comments',
    'Saved',
    'Upvoted',
    'Downvoted',
  ]
  const visitorTabs = ['Overview', 'Posts', 'Comments']
  const tabs = isOwnProfile ? ownTabs : visitorTabs

  const ownStatCards = [
    { label: 'Karma', value: '1.2k' },
    { label: 'Contributions', value: '214' },
    { label: 'Cake Day', value: '3y' },
    { label: 'Followers', value: '12' },
  ]
  const visitorStatCards = [
    { label: 'Karma', value: '619' },
    { label: 'Contributions', value: '84' },
    { label: 'Cake Day', value: '1y' },
    { label: 'Followers', value: '5' },
  ]
  const statCards = isOwnProfile ? ownStatCards : visitorStatCards

  const [activeTab, setActiveTab] = useState(tabs[0])
  const [profileUser, setProfileUser] = useState(null)
  const [hasPosts, setHasPosts] = useState(true)
  const [openMorePostId, setOpenMorePostId] = useState(null)
  const [postMenuPos, setPostMenuPos] = useState({ top: 0, right: 0 })
  const [hasComments, setHasComments] = useState(true)
  const [openMoreCommentId, setOpenMoreCommentId] = useState(null)
  const [commentMenuPos, setCommentMenuPos] = useState({ top: 0, right: 0 })
  const [hasSaved, setHasSaved] = useState(true)
  const [openMoreSavedId, setOpenMoreSavedId] = useState(null)
  const [savedMenuPos, setSavedMenuPos] = useState({ top: 0, right: 0 })
  const [hasUpvoted, setHasUpvoted] = useState(true)
  const [openMoreUpvotedId, setOpenMoreUpvotedId] = useState(null)
  const [upvotedMenuPos, setUpvotedMenuPos] = useState({ top: 0, right: 0 })
  const [hasDownvoted, setHasDownvoted] = useState(true)
  const [openMoreDownvotedId, setOpenMoreDownvotedId] = useState(null)
  const [downvotedMenuPos, setDownvotedMenuPos] = useState({ top: 0, right: 0 })

  useEffect(() => {
    const close = (e) => {
      if (
        !e.target.closest('.pp-more-button') &&
        !e.target.closest('.pp-global-menu')
      ) {
        setOpenMorePostId(null)
        setOpenMoreCommentId(null)
        setOpenMoreSavedId(null)
        setOpenMoreUpvotedId(null)
        setOpenMoreDownvotedId(null)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  useEffect(() => {
    if (!displayName) return

    fetch(`/api/users/by-username/${encodeURIComponent(displayName)}`)
      .then((res) => {
        if (!res.ok) return null
        return res.json()
      })
      .then((data) => {
        setProfileUser(data || null)
      })
      .catch(() => {
        setProfileUser(null)
      })
  }, [displayName])

  const handlePostMenu = (e, postId) => {
    if (openMorePostId === postId) {
      setOpenMorePostId(null)
      return
    }
    const rect = e.currentTarget.getBoundingClientRect()
    setPostMenuPos({
      top: rect.bottom + 6,
      right: window.innerWidth - rect.right,
    })
    setOpenMorePostId(postId)
  }

  const handleCommentMenu = (e, commentId) => {
    if (openMoreCommentId === commentId) {
      setOpenMoreCommentId(null)
      return
    }
    const rect = e.currentTarget.getBoundingClientRect()
    setCommentMenuPos({
      top: rect.bottom + 6,
      right: window.innerWidth - rect.right,
    })
    setOpenMoreCommentId(commentId)
  }

  const handleSavedMenu = (e, savedId) => {
    if (openMoreSavedId === savedId) {
      setOpenMoreSavedId(null)
      return
    }
    const rect = e.currentTarget.getBoundingClientRect()
    setSavedMenuPos({
      top: rect.bottom + 6,
      right: window.innerWidth - rect.right,
    })
    setOpenMoreSavedId(savedId)
  }

  const handleUpvotedMenu = (e, itemId) => {
    if (openMoreUpvotedId === itemId) {
      setOpenMoreUpvotedId(null)
      return
    }
    const rect = e.currentTarget.getBoundingClientRect()
    setUpvotedMenuPos({
      top: rect.bottom + 6,
      right: window.innerWidth - rect.right,
    })
    setOpenMoreUpvotedId(itemId)
  }

  const handleDownvotedMenu = (e, itemId) => {
    if (openMoreDownvotedId === itemId) {
      setOpenMoreDownvotedId(null)
      return
    }
    const rect = e.currentTarget.getBoundingClientRect()
    setDownvotedMenuPos({
      top: rect.bottom + 6,
      right: window.innerWidth - rect.right,
    })
    setOpenMoreDownvotedId(itemId)
  }

  const renderTab = () => {
    if (activeTab === 'Overview')
      return (
        <ProfileOverviewTab
          displayName={displayName}
          statCards={statCards}
          isOwnProfile={isOwnProfile}
        />
      )
    if (activeTab === 'Posts')
      return (
        <ProfilePostsTab
          posts={USER_POSTS}
          hasPosts={hasPosts}
          openMorePostId={openMorePostId}
          onMenuOpen={handlePostMenu}
          isOwnProfile={isOwnProfile}
        />
      )
    if (activeTab === 'Comments')
      return (
        <ProfileCommentsTab
          comments={USER_COMMENTS}
          hasComments={hasComments}
          openMoreCommentId={openMoreCommentId}
          onMenuOpen={handleCommentMenu}
          isOwnProfile={isOwnProfile}
        />
      )
    if (activeTab === 'Saved')
      return (
        <ProfileSavedTab
          items={SAVED_ITEMS}
          hasSaved={hasSaved}
          openMoreSavedId={openMoreSavedId}
          onMenuOpen={handleSavedMenu}
        />
      )
    if (activeTab === 'Upvoted')
      return (
        <ProfileVotedTab
          items={UPVOTED_POSTS}
          voteType='up'
          hasVoted={hasUpvoted}
          filterLabel='Upvoted posts'
          openId={openMoreUpvotedId}
          onMenuOpen={handleUpvotedMenu}
        />
      )
    if (activeTab === 'Downvoted')
      return (
        <ProfileVotedTab
          items={DOWNVOTED_POSTS}
          voteType='down'
          hasVoted={hasDownvoted}
          filterLabel='Downvoted posts'
          openId={openMoreDownvotedId}
          onMenuOpen={handleDownvotedMenu}
        />
      )
    return null
  }

  const profileAvatarSrc =
    normalizeImageSrc(
      profileUser?.avatarUrl || (isOwnProfile ? authUser?.avatarUrl : null),
    ) || avatar

  return (
    <main className='user-profile-page'>
      <section className='user-profile-shell'>
        <div className='user-profile-main'>
          <header className='user-hero'>
            <div className='user-hero-banner'>
              <img
                src={nature}
                alt='Profile banner'
                className='user-hero-banner-image'
              />
              {isOwnProfile && (
                <button type='button' className='user-hero-banner-button'>
                  Change banner
                </button>
              )}
            </div>

            <div className='user-hero-body'>
              <img
                src={profileAvatarSrc}
                alt='Avatar'
                className='user-hero-avatar'
              />
              <div className='user-hero-meta'>
                <h1>{displayName}</h1>
                <p>u/{displayName}</p>
              </div>
              <div className='user-hero-actions'>
                {isOwnProfile ? (
                  <>
                    <Link
                      to='/create-post'
                      className='profile-btn profile-btn-primary'
                    >
                      Create Post
                    </Link>
                    <Link
                      to='/edit-avatar'
                      className='profile-btn profile-btn-secondary'
                    >
                      Update Profile
                    </Link>
                  </>
                ) : (
                  <>
                    <button
                      type='button'
                      className='profile-btn profile-btn-primary'
                    >
                      Follow
                    </button>
                    <button
                      type='button'
                      className='profile-btn profile-btn-secondary'
                    >
                      Start Chat
                    </button>
                    <button
                      type='button'
                      className='profile-btn profile-btn-danger'
                    >
                      Report
                    </button>
                  </>
                )}
              </div>
            </div>

            <nav className='user-tabs' aria-label='Profile sections'>
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type='button'
                  onClick={() => setActiveTab(tab)}
                  className={`user-tab ${activeTab === tab ? 'user-tab-active' : ''}`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </header>

          <section className='user-feed-card'>{renderTab()}</section>
        </div>

        <aside className='user-profile-side'>
          <section className='side-card'>
            <h4>ADS in here?</h4>
            <div className='badge-row'>
              <span className='badge-pill'>Contributor</span>
              <span className='badge-pill'>Top Commenter</span>
              <span className='badge-pill'>Verified</span>
            </div>
          </section>
        </aside>
      </section>

      {openMorePostId !== null && (
        <div
          className='pp-more-menu pp-global-menu'
          role='menu'
          style={{
            position: 'fixed',
            top: postMenuPos.top,
            right: postMenuPos.right,
          }}
        >
          <button
            className='pp-more-item'
            role='menuitem'
            onClick={() => setOpenMorePostId(null)}
          >
            Edit post
          </button>
          <button
            className='pp-more-item'
            role='menuitem'
            onClick={() => setOpenMorePostId(null)}
          >
            Save
          </button>
          <button
            className='pp-more-item pp-more-item-danger'
            role='menuitem'
            onClick={() => setOpenMorePostId(null)}
          >
            Delete
          </button>
        </div>
      )}

      {openMoreCommentId !== null &&
        (() => {
          const c = USER_COMMENTS.find((x) => x.id === openMoreCommentId)
          return c ? (
            <div
              className='pp-more-menu pp-global-menu'
              role='menu'
              style={{
                position: 'fixed',
                top: commentMenuPos.top,
                right: commentMenuPos.right,
              }}
            >
              <Link
                to={getCommentPostRoute(c)}
                className='pp-more-item pc-more-link'
                role='menuitem'
                onClick={() => setOpenMoreCommentId(null)}
              >
                Edit Comment
              </Link>
              <button
                className='pp-more-item'
                role='menuitem'
                onClick={() => setOpenMoreCommentId(null)}
              >
                Save
              </button>
              <button
                className='pp-more-item pp-more-item-danger'
                role='menuitem'
                onClick={() => setOpenMoreCommentId(null)}
              >
                Delete Comment
              </button>
            </div>
          ) : null
        })()}

      {openMoreSavedId !== null &&
        (() => {
          const s = SAVED_ITEMS.find((x) => x.id === openMoreSavedId)
          return s ? (
            <div
              className='pp-more-menu pp-global-menu'
              role='menu'
              style={{
                position: 'fixed',
                top: savedMenuPos.top,
                right: savedMenuPos.right,
              }}
            >
              <button
                className='pp-more-item pp-more-item-danger'
                role='menuitem'
                onClick={() => setOpenMoreSavedId(null)}
              >
                Remove from saved
              </button>
            </div>
          ) : null
        })()}

      {openMoreUpvotedId !== null && (
        <div
          className='pp-more-menu pp-global-menu'
          role='menu'
          style={{
            position: 'fixed',
            top: upvotedMenuPos.top,
            right: upvotedMenuPos.right,
          }}
        >
          <button
            className='pp-more-item'
            role='menuitem'
            onClick={() => setOpenMoreUpvotedId(null)}
          >
            Save
          </button>
        </div>
      )}

      {openMoreDownvotedId !== null && (
        <div
          className='pp-more-menu pp-global-menu'
          role='menu'
          style={{
            position: 'fixed',
            top: downvotedMenuPos.top,
            right: downvotedMenuPos.right,
          }}
        >
          <button
            className='pp-more-item'
            role='menuitem'
            onClick={() => setOpenMoreDownvotedId(null)}
          >
            Save
          </button>
        </div>
      )}
    </main>
  )
}
