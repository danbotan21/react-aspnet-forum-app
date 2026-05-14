import { useState } from 'react'
import {
  FaUserEdit,
  FaEnvelope,
  FaLock,
  FaPalette,
  FaBell,
  FaShieldAlt,
  FaExclamationTriangle,
} from 'react-icons/fa'
import './Styles/Settings.css'

export const Settings = () => {
  const [activeSection, setActiveSection] = useState('account')
  const [formData, setFormData] = useState({
    username: 'username',
    email: 'user@example.com',
    bio: '',
    bioSaved: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    theme: 'light',
    language: 'en',
    profileVisibility: 'public',
    showActivity: true,
    emailNotifications: true,
    pushNotifications: false,
  })

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSaveAccount = (e) => {
    e.preventDefault()
    setFormData((prev) => ({ ...prev, bioSaved: prev.bio }))
    console.log('Saving account settings:', formData)
    alert('Account settings saved!')
  }

  const handleChangePassword = (e) => {
    e.preventDefault()
    if (formData.newPassword !== formData.confirmPassword) {
      alert('Passwords do not match!')
      return
    }
    console.log('Changing password')
    alert('Password changed successfully!')
    setFormData((prev) => ({
      ...prev,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }))
  }

  const handleSavePreferences = (e) => {
    e.preventDefault()
    console.log('Saving preferences:', formData)
    alert('Preferences saved!')
  }

  const handleSavePrivacy = (e) => {
    e.preventDefault()
    console.log('Saving privacy settings:', formData)
    alert('Privacy settings saved!')
  }

  const handleSaveNotifications = (e) => {
    e.preventDefault()
    console.log('Saving notification settings:', formData)
    alert('Notification settings saved!')
  }

  const handleDeleteAccount = () => {
    if (
      window.confirm(
        'Are you sure you want to delete your account? This action cannot be undone!',
      )
    ) {
      console.log('Deleting account')
      alert('Account deleted!')
    }
  }

  return (
    <div className='settings-page'>
      <div className='settings-header'>
        <h1 className='settings-title'>Settings</h1>
        <p className='settings-subtitle'>Manage your account and preferences</p>
      </div>

      <div className='settings-container'>
        {/* Sidebar Navigation */}
        <nav className='settings-nav'>
          <button
            className={`settings-nav-item ${activeSection === 'account' ? 'active' : ''}`}
            onClick={() => setActiveSection('account')}
          >
            <FaUserEdit className='settings-nav-icon' />
            <span>Account</span>
          </button>
          <button
            className={`settings-nav-item ${activeSection === 'password' ? 'active' : ''}`}
            onClick={() => setActiveSection('password')}
          >
            <FaLock className='settings-nav-icon' />
            <span>Password</span>
          </button>
          <button
            className={`settings-nav-item ${activeSection === 'preferences' ? 'active' : ''}`}
            onClick={() => setActiveSection('preferences')}
          >
            <FaPalette className='settings-nav-icon' />
            <span>Preferences</span>
          </button>
          <button
            className={`settings-nav-item ${activeSection === 'privacy' ? 'active' : ''}`}
            onClick={() => setActiveSection('privacy')}
          >
            <FaShieldAlt className='settings-nav-icon' />
            <span>Privacy</span>
          </button>
          <button
            className={`settings-nav-item ${activeSection === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveSection('notifications')}
          >
            <FaBell className='settings-nav-icon' />
            <span>Notifications</span>
          </button>
          <button
            className={`settings-nav-item ${activeSection === 'danger' ? 'active' : ''}`}
            onClick={() => setActiveSection('danger')}
          >
            <FaExclamationTriangle className='settings-nav-icon' />
            <span>Danger Zone</span>
          </button>
        </nav>

        {/* Main Content */}
        <div className='settings-content'>
          {/* Account Settings */}
          {activeSection === 'account' && (
            <div className='settings-section'>
              <h2 className='settings-section-title'>Account Information</h2>
              <p className='settings-section-subtitle'>
                Update your account details
              </p>

              <form className='settings-form' onSubmit={handleSaveAccount}>
                <div className='settings-form-group'>
                  <label htmlFor='username' className='settings-label'>
                    <FaUserEdit className='settings-label-icon' />
                    Username
                  </label>
                  <input
                    type='text'
                    id='username'
                    name='username'
                    className='settings-input'
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder='Enter username'
                  />
                </div>

                <div className='settings-form-group'>
                  <label htmlFor='email' className='settings-label'>
                    <FaEnvelope className='settings-label-icon' />
                    Email Address
                  </label>
                  <input
                    type='email'
                    id='email'
                    name='email'
                    className='settings-input'
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder='Enter email'
                  />
                </div>

                <div className='settings-form-group'>
                  <label htmlFor='bio' className='settings-label'>
                    <FaUserEdit className='settings-label-icon' />
                    Biography
                  </label>
                  <textarea
                    id='bio'
                    name='bio'
                    className='settings-input settings-textarea'
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder='Tell the community a bit about yourself...'
                    rows={4}
                    maxLength={300}
                  />
                  <span className='settings-char-count'>
                    {formData.bio.length}/300
                  </span>
                </div>

                <button
                  type='submit'
                  className='settings-btn settings-btn-primary'
                >
                  Save Changes
                </button>
              </form>
            </div>
          )}

          {/* Password Settings */}
          {activeSection === 'password' && (
            <div className='settings-section'>
              <h2 className='settings-section-title'>Change Password</h2>
              <p className='settings-section-subtitle'>
                Update your password to keep your account secure
              </p>

              <form className='settings-form' onSubmit={handleChangePassword}>
                <div className='settings-form-group'>
                  <label htmlFor='currentPassword' className='settings-label'>
                    <FaLock className='settings-label-icon' />
                    Current Password
                  </label>
                  <input
                    type='password'
                    id='currentPassword'
                    name='currentPassword'
                    className='settings-input'
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    placeholder='Enter current password'
                  />
                </div>

                <div className='settings-form-group'>
                  <label htmlFor='newPassword' className='settings-label'>
                    <FaLock className='settings-label-icon' />
                    New Password
                  </label>
                  <input
                    type='password'
                    id='newPassword'
                    name='newPassword'
                    className='settings-input'
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    placeholder='Enter new password'
                  />
                </div>

                <div className='settings-form-group'>
                  <label htmlFor='confirmPassword' className='settings-label'>
                    <FaLock className='settings-label-icon' />
                    Confirm New Password
                  </label>
                  <input
                    type='password'
                    id='confirmPassword'
                    name='confirmPassword'
                    className='settings-input'
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder='Confirm new password'
                  />
                </div>

                <button
                  type='submit'
                  className='settings-btn settings-btn-primary'
                >
                  Update Password
                </button>
              </form>
            </div>
          )}

          {/* Display Preferences */}
          {activeSection === 'preferences' && (
            <div className='settings-section'>
              <h2 className='settings-section-title'>Display Preferences</h2>
              <p className='settings-section-subtitle'>
                Customize how InfoMeet looks and feels
              </p>

              <form className='settings-form' onSubmit={handleSavePreferences}>
                <div className='settings-form-group'>
                  <label htmlFor='theme' className='settings-label'>
                    <FaPalette className='settings-label-icon' />
                    Theme
                  </label>
                  <select
                    id='theme'
                    name='theme'
                    className='settings-select'
                    value={formData.theme}
                    onChange={handleInputChange}
                  >
                    <option value='light'>Light</option>
                    <option value='dark'>Dark</option>
                    <option value='auto'>Auto (System)</option>
                  </select>
                </div>

                <div className='settings-form-group'>
                  <label htmlFor='language' className='settings-label'>
                    Language
                  </label>
                  <select
                    id='language'
                    name='language'
                    className='settings-select'
                    value={formData.language}
                    onChange={handleInputChange}
                  >
                    <option value='en'>English</option>
                    <option value='ro'>Română</option>
                    <option value='es'>Español</option>
                    <option value='fr'>Français</option>
                  </select>
                </div>

                <button
                  type='submit'
                  className='settings-btn settings-btn-primary'
                >
                  Save Preferences
                </button>
              </form>
            </div>
          )}

          {/* Privacy Settings */}
          {activeSection === 'privacy' && (
            <div className='settings-section'>
              <h2 className='settings-section-title'>Privacy Settings</h2>
              <p className='settings-section-subtitle'>
                Control who can see your information
              </p>

              <form className='settings-form' onSubmit={handleSavePrivacy}>
                <div className='settings-form-group'>
                  <label htmlFor='profileVisibility' className='settings-label'>
                    <FaShieldAlt className='settings-label-icon' />
                    Profile Visibility
                  </label>
                  <select
                    id='profileVisibility'
                    name='profileVisibility'
                    className='settings-select'
                    value={formData.profileVisibility}
                    onChange={handleInputChange}
                  >
                    <option value='public'>Public</option>
                    <option value='private'>Private</option>
                    <option value='friends'>Friends Only</option>
                  </select>
                </div>

                <div className='settings-toggle-group'>
                  <div className='settings-toggle-item'>
                    <div className='settings-toggle-label'>
                      <span className='settings-toggle-title'>
                        Show Activity Status
                      </span>
                      <span className='settings-toggle-description'>
                        Let others see when you're active
                      </span>
                    </div>
                    <label className='settings-toggle'>
                      <input
                        type='checkbox'
                        name='showActivity'
                        checked={formData.showActivity}
                        onChange={handleInputChange}
                      />
                      <span className='settings-toggle-slider'></span>
                    </label>
                  </div>
                </div>

                <button
                  type='submit'
                  className='settings-btn settings-btn-primary'
                >
                  Save Privacy Settings
                </button>
              </form>
            </div>
          )}

          {/* Notification Settings */}
          {activeSection === 'notifications' && (
            <div className='settings-section'>
              <h2 className='settings-section-title'>
                Notification Preferences
              </h2>
              <p className='settings-section-subtitle'>
                Choose what notifications you want to receive
              </p>

              <form
                className='settings-form'
                onSubmit={handleSaveNotifications}
              >
                <div className='settings-toggle-group'>
                  <div className='settings-toggle-item'>
                    <div className='settings-toggle-label'>
                      <span className='settings-toggle-title'>
                        <FaEnvelope className='settings-toggle-icon' />
                        Email Notifications
                      </span>
                      <span className='settings-toggle-description'>
                        Receive updates via email
                      </span>
                    </div>
                    <label className='settings-toggle'>
                      <input
                        type='checkbox'
                        name='emailNotifications'
                        checked={formData.emailNotifications}
                        onChange={handleInputChange}
                      />
                      <span className='settings-toggle-slider'></span>
                    </label>
                  </div>

                  <div className='settings-toggle-item'>
                    <div className='settings-toggle-label'>
                      <span className='settings-toggle-title'>
                        <FaBell className='settings-toggle-icon' />
                        Push Notifications
                      </span>
                      <span className='settings-toggle-description'>
                        Receive push notifications in browser
                      </span>
                    </div>
                    <label className='settings-toggle'>
                      <input
                        type='checkbox'
                        name='pushNotifications'
                        checked={formData.pushNotifications}
                        onChange={handleInputChange}
                      />
                      <span className='settings-toggle-slider'></span>
                    </label>
                  </div>
                </div>

                <button
                  type='submit'
                  className='settings-btn settings-btn-primary'
                >
                  Save Notification Settings
                </button>
              </form>
            </div>
          )}

          {/* Danger Zone */}
          {activeSection === 'danger' && (
            <div className='settings-section'>
              <h2 className='settings-section-title'>Danger Zone</h2>
              <p className='settings-section-subtitle'>
                Irreversible actions for your account
              </p>

              <div className='settings-danger-zone'>
                <div className='settings-danger-item'>
                  <div className='settings-danger-content'>
                    <h3 className='settings-danger-title'>Delete Account</h3>
                    <p className='settings-danger-description'>
                      Once you delete your account, there is no going back. All
                      your posts, comments, and data will be permanently
                      removed.
                    </p>
                  </div>
                  <button
                    type='button'
                    className='settings-btn settings-btn-danger'
                    onClick={handleDeleteAccount}
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
