import {
  FaSearch,
  FaEdit,
  FaComment,
  FaPlus,
  FaBell,
  FaChevronDown,
} from 'react-icons/fa'
import './Styles/Navbar.css'
import avatar from './img/avatar.webp'

export const Navbar = () => {
  return (
    <header className='navbar'>
      <div className='navbar-inner'>
        <a href='/' className='navbar-logo' aria-label='credit - home'>
          credit
        </a>

        <div className='navbar-search-wrap'>
          <FaSearch className='navbar-search-icon navbar-search-icon-left' />
          <input
            type='search'
            className='navbar-search'
            placeholder='Find anything'
            aria-label='Search'
          />
          <span className='navbar-search-right'>
            <FaComment className='navbar-search-icon navbar-search-icon-right' />
            <span className='navbar-search-ask'>Ask</span>
          </span>
        </div>

        {/* Actions + profile */}
        <div className='navbar-actions'>
          <button type='button' className='navbar-icon-btn' aria-label='Posts'>
            <FaEdit />
          </button>
          <button
            type='button'
            className='navbar-icon-btn'
            aria-label='Messages'
          >
            <FaComment />
          </button>
          <button
            type='button'
            className='navbar-icon-btn navbar-icon-btn-plus'
            aria-label='Create'
          >
            <FaPlus />
          </button>
          <button
            type='button'
            className='navbar-icon-btn'
            aria-label='Notifications'
          >
            <FaBell />
          </button>
          <div className='navbar-profile'>
            <img src={avatar} alt='avatar' className='navbar-avatar' />
          </div>
        </div>
      </div>
    </header>
  )
}
