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
} from 'react-icons/fa'
import { useAuth } from './AuthContext'
import { normalizeImageSrc } from './utils/media'
import './Styles/Navbar.css'
import defaultAvatar from './img/avatar.webp'

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const profileRef = useRef(null)
  const searchRef = useRef(null)
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [searchCommunities, setSearchCommunities] = useState([])
  const [searchPosts, setSearchPosts] = useState([])
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)

  // Folosim username-ul real din context, sau fallback
  const loggedUser = user?.userName || 'username'
  const userKarma = user?.karma ?? 0
  const userAvatarSrc = normalizeImageSrc(user?.avatarUrl) || defaultAvatar

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
      if (term !== '') {
        try {
          const [commRes, postRes] = await Promise.all([
            fetch(`/api/Communities/search?term=${encodeURIComponent(term)}`),
            fetch(`/api/Posts/search?term=${encodeURIComponent(term)}&limit=3`),
          ])
          const communities = commRes.ok ? await commRes.json() : []
          const posts = postRes.ok ? await postRes.json() : []
          setSearchCommunities(communities.slice(0, 3))
          setSearchPosts(posts)
          setShowSearchDropdown(communities.length > 0 || posts.length > 0)
        } catch (err) {
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
    navigate('/login')
  }

  return (
    <header className='navbar'>
      <div className='navbar-inner'>
        <Link
          to='/home'
          className='navbar-logo'
          aria-label='InfoMeet - home'
        >
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
                  <div className='navbar-search-dropdown-label'>Communities</div>
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
                      <span>c/{c.slug} · {c.membersCount} members</span>
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
                      <span>c/{p.communitySlug} · by u/{p.authorName}</span>
                    </div>
                  ))}
                </>
              )}
              {searchTerm.trim() !== '' && (
                <div
                  className='navbar-search-dropdown-item navbar-search-dropdown-all'
                  onClick={() => {
                    setShowSearchDropdown(false)
                    navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`)
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
          <button
            type='button'
            className='navbar-icon-btn'
            aria-label='Messages'
          >
            <FaComment />
          </button>

          <Link
            to='/create-post'
            className='navbar-icon-btn navbar-icon-btn-plus'
            aria-label='Create post'
          >
            <FaPlus />
          </Link>

          <Link to='/notification' className='navbar-icon-btn'>
            <FaBell />
          </Link>

          <div
            className='navbar-profile'
            ref={profileRef}
            onClick={() => setIsOpen((prev) => !prev)}
          >
            <img src={userAvatarSrc} alt='avatar' className='navbar-avatar' />

            {isOpen && (
              <div
                className='profile-dropdown'
                onClick={(e) => e.stopPropagation()}
              >
                <div className='profile-dropdown-header'>
                  <img
                    src={userAvatarSrc}
                    alt='avatar'
                    className='profile-dropdown-avatar'
                  />
                  <span className='profile-dropdown-username'>
                    u/{loggedUser}
                  </span>
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
