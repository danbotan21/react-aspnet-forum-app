import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FaSearch,
  FaComment,
  FaPlus,
  FaBell,
  FaUserCircle,
  FaUsers,
  FaCog,
  FaSignOutAlt,
  FaShieldAlt,
} from 'react-icons/fa'
import { useAuth, apiFetch } from './AuthContext'
import { useNotifications } from './NotificationContext'
import { useChat } from './ChatContext'
import { normalizeImageSrc } from './utils/media'
import { PremiumBadge } from './PremiumBadge'
import './Styles/Navbar.css'
import defaultAvatar from './img/avatar.webp'

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const profileRef = useRef(null)
  const searchRef = useRef(null)
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { unreadCount } = useNotifications()
  const { totalUnread: unreadMessages } = useChat()
  const [searchTerm, setSearchTerm] = useState('')
  const [searchCommunities, setSearchCommunities] = useState([])
  const [searchPosts, setSearchPosts] = useState([])
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const searchRequestId = useRef(0)
  const [pushEnabled, setPushEnabled] = useState(
    () => localStorage.getItem('pushNotifications') !== 'false',
  )

  useEffect(() => {
    const sync = () =>
      setPushEnabled(localStorage.getItem('pushNotifications') !== 'false')
    window.addEventListener('push-notifications-changed', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('push-notifications-changed', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  // Folosim username-ul real din context, sau fallback
  const loggedUser = user?.userName || 'username'
  const userKarma = user?.karma ?? 0
  const userAvatarSrc = normalizeImageSrc(user?.avatarUrl) || defaultAvatar
  const isPremium = !!user?.isPremium

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsOpen(false)
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      const term = searchTerm.trim()
      const currentId = ++searchRequestId.current
      if (term !== '') {
        try {
          const [commRes, postRes] = await Promise.all([
            apiFetch(
              `/api/Communities/search?term=${encodeURIComponent(term)}`,
            ),
            fetch(`/api/Posts/search?term=${encodeURIComponent(term)}&limit=3`),
          ])
          if (currentId !== searchRequestId.current) return
          const communities = commRes.ok ? await commRes.json() : []
          const posts = postRes.ok ? await postRes.json() : []
          setSearchCommunities(communities.slice(0, 3))
          setSearchPosts(posts)
          setShowSearchDropdown(communities.length > 0 || posts.length > 0)
        } catch (err) {
          if (currentId !== searchRequestId.current) return
          console.error('Search error:', err)
        }
      } else {
        setSearchCommunities([])
        setSearchPosts([])
        setShowSearchDropdown(false)
      }
    }, 300)
    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm])

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchTerm.trim() !== '') {
      setShowSearchDropdown(false)
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`)
    }
  }

  const handleLogout = () => {
    setIsOpen(false)
    logout()
    navigate('/login', { replace: true })
  }

  // No session → render nothing (protected routes already redirect to /login).
  // Prevents the fallback "u/username" + default-avatar profile from ever showing.
  if (!user) return null

  return (
    <header className='navbar'>
      <div className='navbar-inner'>
        <Link to='/home' className='navbar-logo' aria-label='InfoMeet - home'>
          InfoMeet
        </Link>

        <div
          className='navbar-search-wrap'
          ref={searchRef}
          style={{ position: 'relative' }}
        >
          <FaSearch className='navbar-search-icon navbar-search-icon-left' />
          <input
            type='search'
            className='navbar-search'
            placeholder='Find anything'
            aria-label='Search'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            onFocus={() => {
              if (searchTerm.trim() !== '') setShowSearchDropdown(true)
            }}
          />
          {showSearchDropdown && (
            <div className='navbar-search-dropdown'>
              {searchCommunities.length > 0 && (
                <>
                  <div className='navbar-search-dropdown-label'>
                    Communities
                  </div>
                  {searchCommunities.map((c) => (
                    <div
                      key={c.id}
                      className='navbar-search-dropdown-item'
                      onClick={() => {
                        setShowSearchDropdown(false)
                        setSearchTerm('')
                        navigate(`/community/${c.slug}`)
                      }}
                    >
                      <strong>{c.title}</strong>
                      <span>
                        c/{c.slug} · {c.membersCount} members
                      </span>
                    </div>
                  ))}
                </>
              )}
              {searchPosts.length > 0 && (
                <>
                  <div className='navbar-search-dropdown-label'>Posts</div>
                  {searchPosts.map((p) => (
                    <div
                      key={p.id}
                      className='navbar-search-dropdown-item'
                      onClick={() => {
                        setShowSearchDropdown(false)
                        setSearchTerm('')
                        navigate(`/community/${p.communitySlug}/post/${p.id}`)
                      }}
                    >
                      <strong>{p.title}</strong>
                      <span>
                        c/{p.communitySlug} · by u/{p.authorName}
                      </span>
                    </div>
                  ))}
                </>
              )}
              {searchTerm.trim() !== '' && (
                <div
                  className='navbar-search-dropdown-item navbar-search-dropdown-all'
                  onClick={() => {
                    setShowSearchDropdown(false)
                    navigate(
                      `/search?q=${encodeURIComponent(searchTerm.trim())}`,
                    )
                  }}
                >
                  See all results for &quot;{searchTerm}&quot;
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions + profile */}
        <div className='navbar-actions'>
          <Link
            to='/messages'
            className='navbar-icon-btn'
            aria-label='Messages'
            style={{ position: 'relative' }}
          >
            <FaComment />
            {unreadMessages > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  backgroundColor: '#e53e3e',
                  color: '#fff',
                  borderRadius: '50%',
                  minWidth: '16px',
                  height: '16px',
                  fontSize: '10px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 2px',
                  lineHeight: 1,
                  pointerEvents: 'none',
                }}
              >
                {unreadMessages > 99 ? '99+' : unreadMessages}
              </span>
            )}
          </Link>

          <Link
            to='/create-post'
            className='navbar-icon-btn navbar-icon-btn-plus'
            aria-label='Create post'
          >
            <FaPlus />
          </Link>

          <Link
            to='/notification'
            className='navbar-icon-btn'
            style={{ position: 'relative' }}
          >
            <FaBell />
            {pushEnabled && unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  backgroundColor: '#e53e3e',
                  color: '#fff',
                  borderRadius: '50%',
                  minWidth: '16px',
                  height: '16px',
                  fontSize: '10px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 2px',
                  lineHeight: 1,
                  pointerEvents: 'none',
                }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>

          <div
            className='navbar-profile'
            ref={profileRef}
            onClick={() => setIsOpen((prev) => !prev)}
          >
            <span
              className={`navbar-avatar-wrap ${isPremium ? 'navbar-avatar-wrap--premium' : ''}`}
              title={isPremium ? 'Premium member' : undefined}
            >
              <img src={userAvatarSrc} alt='avatar' className='navbar-avatar' />
            </span>

            {isOpen && (
              <div
                className='profile-dropdown'
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className={`profile-dropdown-header ${isPremium ? 'profile-dropdown-header--premium' : ''}`}
                >
                  <span
                    className={`profile-dropdown-avatar-wrap ${isPremium ? 'profile-dropdown-avatar-wrap--premium' : ''}`}
                  >
                    <img
                      src={userAvatarSrc}
                      alt='avatar'
                      className='profile-dropdown-avatar'
                    />
                  </span>
                  <span className='profile-dropdown-username'>
                    u/{loggedUser}
                  </span>
                  {isPremium && <PremiumBadge size='sm' />}
                  <span className='profile-dropdown-karma'>
                    {userKarma} karma
                  </span>
                </div>

                <div className='profile-dropdown-divider' />

                <Link
                  to='/edit-avatar'
                  className='profile-dropdown-item'
                  onClick={() => setIsOpen(false)}
                >
                  <FaUserCircle className='profile-dropdown-item-icon' />
                  <span>Edit Avatar</span>
                </Link>

                <Link
                  to={`/user/${loggedUser}`}
                  className='profile-dropdown-item'
                  onClick={() => setIsOpen(false)}
                >
                  <FaUsers className='profile-dropdown-item-icon' />
                  <span>Your Profile</span>
                </Link>

                <Link
                  to='/settings'
                  className='profile-dropdown-item'
                  onClick={() => setIsOpen(false)}
                >
                  <FaCog className='profile-dropdown-item-icon' />
                  <span>Settings</span>
                </Link>

                {user?.role === 'Admin' && (
                  <>
                    <div className='profile-dropdown-divider' />
                    <Link
                      to='/admin'
                      className='profile-dropdown-item profile-dropdown-admin'
                      onClick={() => setIsOpen(false)}
                    >
                      <FaShieldAlt className='profile-dropdown-item-icon' />
                      <span>Admin Panel</span>
                    </Link>
                  </>
                )}

                <div className='profile-dropdown-divider' />

                <button
                  type='button'
                  className='profile-dropdown-item profile-dropdown-logout'
                  onClick={handleLogout}
                >
                  <FaSignOutAlt className='profile-dropdown-item-icon' />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
