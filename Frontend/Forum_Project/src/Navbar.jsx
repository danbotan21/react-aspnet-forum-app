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
import './Styles/Navbar.css'
import defaultAvatar from './img/avatar.webp'

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const profileRef = useRef(null)
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  // Folosim username-ul real din context, sau fallback
  const loggedUser = user?.userName || 'username'
  const userKarma = user?.karma ?? 0

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    setIsOpen(false)
    logout()
    navigate('/login')
  }

  return (
    <header className='navbar'>
      <div className='navbar-inner'>
        <a
          href='http://localhost:5173/Home'
          className='navbar-logo'
          aria-label='credit - home'
        >
          {/* ON Line  */}
          InfoMeet
          {/* SPEAK-Line */}
        </a>

        <div className='navbar-search-wrap'>
          <FaSearch className='navbar-search-icon navbar-search-icon-left' />
          <input
            type='search'
            className='navbar-search'
            placeholder='Find anything'
            aria-label='Search'
          />
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
            <img src={defaultAvatar} alt='avatar' className='navbar-avatar' />

            {isOpen && (
              <div
                className='profile-dropdown'
                onClick={(e) => e.stopPropagation()}
              >
                <div className='profile-dropdown-header'>
                  <img
                    src={defaultAvatar}
                    alt='avatar'
                    className='profile-dropdown-avatar'
                  />
                  <span className='profile-dropdown-username'>
                    u/{loggedUser}
                  </span>
                  <span className='profile-dropdown-karma'>{userKarma} karma</span>
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
