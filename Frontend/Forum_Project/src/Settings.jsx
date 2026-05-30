import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FaUserEdit,
  FaEnvelope,
  FaLock,
  FaPalette,
  FaBell,
  FaShieldAlt,
  FaExclamationTriangle,
  FaUsers,
  FaCrown,
  FaChevronRight,
} from 'react-icons/fa'
import { Link } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { readResponseError } from './utils/imageUpload'
import { fetchMyCommunities } from './utils/modApi'
import './Styles/Settings.css'

const INITIAL_FORM_DATA = {
  username: '',
  email: '',
  bio: '',
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
  theme: 'light',
  language: 'en',
  profileVisibility: 'public',
  showActivity: true,
  emailNotifications: true,
  pushNotifications: false,
}

export const Settings = () => {
  const { token, user, updateUser, updateAuthTokens, logout } = useAuth()
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState('account')
  const [formData, setFormData] = useState(() => ({
    ...INITIAL_FORM_DATA,
    username: user?.userName || '',
    email: user?.email || '',
    bio: user?.bio || '',
  }))
  const [isSavingAccount, setIsSavingAccount] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [accountError, setAccountError] = useState('')
  const [accountSuccess, setAccountSuccess] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const updateUserRef = useRef(updateUser)
  const updateAuthTokensRef = useRef(updateAuthTokens)

  const [originalEmail, setOriginalEmail] = useState('')
  const [confirmEmailPassword, setConfirmEmailPassword] = useState('')

  const [showDeleteForm, setShowDeleteForm] = useState(false)
  const [deleteEmail, setDeleteEmail] = useState('')
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)

  const [myCommunities, setMyCommunities] = useState([])
  const [communitiesLoading, setCommunitiesLoading] = useState(false)
  const [communitiesError, setCommunitiesError] = useState('')

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  useEffect(() => {
    updateUserRef.current = updateUser
    updateAuthTokensRef.current = updateAuthTokens
  }, [updateUser, updateAuthTokens])

  const executeWithAuth = async (requestFactory) => {
    if (!token) return null

    let response = await requestFactory(token)
    if (response.status !== 401) return response

    // Access token expired — use the httpOnly refresh token cookie to get a new one
    const refreshResponse = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    })

    if (!refreshResponse.ok) return response

    const refreshData = await refreshResponse.json()
    if (!refreshData?.token) return response

    updateAuthTokensRef.current(refreshData.token, null, refreshData.user)

    return requestFactory(refreshData.token)
  }

  useEffect(() => {
    if (!token) return

    let cancelled = false

    const loadProfile = async () => {
      try {
        setAccountError('')

        const response = await executeWithAuth((accessToken) =>
          fetch('/api/auth/me', {
            method: 'GET',
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
        )

        if (cancelled || !response) return

        if (!response.ok) {
          const message = await readResponseError(
            response,
            'Failed to load profile settings.',
          )
          if (!cancelled) setAccountError(message)
          return
        }

        const profile = await response.json()
        if (!cancelled) {
          updateUserRef.current(profile)
          setOriginalEmail(profile?.email || '')
          setFormData((prev) => ({
            ...prev,
            username: profile?.userName || prev.username,
            email: profile?.email || prev.email,
            bio: profile?.bio || '',
          }))
        }
      } catch (error) {
        if (cancelled) return
        setAccountError(error?.message || 'Failed to load profile settings.')
      }
    }

    loadProfile()

    return () => {
      cancelled = true
    }
  }, [token])

  const handleSaveAccount = async (e) => {
    e.preventDefault()
    setAccountError('')
    setAccountSuccess('')

    if (!token) {
      setAccountError('Please login before updating account details.')
      return
    }

    const trimmedUsername = formData.username.trim()
    if (trimmedUsername.length < 6) {
      setAccountError('Username must have at least 6 characters.')
      return
    }

    const emailChanged =
      formData.email.trim().toLowerCase() !== originalEmail.toLowerCase()
    if (emailChanged && user?.hasPassword && !confirmEmailPassword) {
      setAccountError('Enter your current password to change email.')
      return
    }

    try {
      setIsSavingAccount(true)

      const body = {
        userName: trimmedUsername,
        bio: formData.bio,
        ...(emailChanged && {
          email: formData.email.trim(),
          currentPassword: confirmEmailPassword,
        }),
      }

      const response = await executeWithAuth((accessToken) =>
        fetch('/api/auth/me', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(body),
        }),
      )

      if (!response) {
        setIsSavingAccount(false)
        setAccountError('Please login before updating account details.')
        return
      }

      if (!response.ok) {
        const message = await readResponseError(
          response,
          'Failed to save account settings.',
        )
        setAccountError(message)
        setIsSavingAccount(false)
        return
      }

      const updatedUser = await response.json()
      updateUser(updatedUser)
      setOriginalEmail(updatedUser?.email || '')
      setConfirmEmailPassword('')
      setFormData((prev) => ({
        ...prev,
        username: updatedUser?.userName || prev.username,
        email: updatedUser?.email || prev.email,
        bio: updatedUser?.bio || '',
      }))
      setAccountSuccess('Account settings saved successfully.')
      setIsSavingAccount(false)
    } catch (error) {
      setAccountError(error?.message || 'Failed to save account settings.')
      setIsSavingAccount(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    if (!token) {
      setPasswordError('Please login before changing your password.')
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setPasswordError('Passwords do not match.')
      return
    }

    if (formData.newPassword.trim().length < 6) {
      setPasswordError('New password must have at least 6 characters.')
      return
    }

    try {
      setIsChangingPassword(true)

      const response = await executeWithAuth((accessToken) =>
        fetch('/api/auth/me/password', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            currentPassword: formData.currentPassword,
            newPassword: formData.newPassword,
            confirmPassword: formData.confirmPassword,
          }),
        }),
      )

      if (!response) {
        setIsChangingPassword(false)
        setPasswordError('Please login before changing your password.')
        return
      }

      if (!response.ok) {
        const message = await readResponseError(
          response,
          'Failed to update password.',
        )
        setPasswordError(message)
        setIsChangingPassword(false)
        return
      }

      setPasswordSuccess('Password changed successfully.')
      setFormData((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }))
      setIsChangingPassword(false)
    } catch (error) {
      setPasswordError(error?.message || 'Failed to update password.')
      setIsChangingPassword(false)
    }
  }

  useEffect(() => {
    if (activeSection !== 'communities' || !token) return
    let cancelled = false
    setCommunitiesLoading(true)
    setCommunitiesError('')
    fetchMyCommunities(token)
      .then((data) => {
        if (!cancelled) setMyCommunities(data)
      })
      .catch((e) => {
        if (!cancelled) setCommunitiesError(e.message)
      })
      .finally(() => {
        if (!cancelled) setCommunitiesLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [activeSection, token])

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

  const handleDeleteAccount = async (e) => {
    e.preventDefault()
    setDeleteError('')

    if (!token) {
      setDeleteError('Please login before deleting your account.')
      return
    }

    setIsDeletingAccount(true)
    try {
      const response = await executeWithAuth((accessToken) =>
        fetch('/api/auth/me', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            email: deleteEmail,
            password: deletePassword,
          }),
        }),
      )

      if (!response) {
        setDeleteError('Please login before deleting your account.')
        setIsDeletingAccount(false)
        return
      }

      if (!response.ok) {
        const message = await readResponseError(
          response,
          'Failed to delete account.',
        )
        setDeleteError(message)
        setIsDeletingAccount(false)
        return
      }

      logout()
      navigate('/login')
    } catch (error) {
      setDeleteError(error?.message || 'Failed to delete account.')
      setIsDeletingAccount(false)
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
              {accountError && (
                <p className='settings-status settings-status-error'>
                  {accountError}
                </p>
              )}
              {accountSuccess && (
                <p className='settings-status settings-status-success'>
                  {accountSuccess}
                </p>
              )}

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
                    disabled={isSavingAccount}
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
                    placeholder='Email address'
                    disabled={isSavingAccount || !user?.hasPassword}
                    title={
                      !user?.hasPassword
                        ? 'Google accounts cannot change email here.'
                        : undefined
                    }
                  />
                </div>

                {user?.hasPassword &&
                  formData.email.trim().toLowerCase() !==
                    originalEmail.toLowerCase() && (
                    <div className='settings-form-group'>
                      <label
                        htmlFor='confirmEmailPassword'
                        className='settings-label'
                      >
                        <FaLock className='settings-label-icon' />
                        Confirm with current password
                      </label>
                      <input
                        type='password'
                        id='confirmEmailPassword'
                        className='settings-input'
                        value={confirmEmailPassword}
                        onChange={(e) =>
                          setConfirmEmailPassword(e.target.value)
                        }
                        placeholder='Enter your current password'
                        disabled={isSavingAccount}
                      />
                    </div>
                  )}

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
                    maxLength={200}
                    disabled={isSavingAccount}
                  />
                  <span className='settings-char-count'>
                    {formData.bio.length}/200
                  </span>
                </div>

                <button
                  type='submit'
                  className='settings-btn settings-btn-primary'
                  disabled={isSavingAccount}
                >
                  {isSavingAccount ? 'Saving...' : 'Save Changes'}
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
              {passwordError && (
                <p className='settings-status settings-status-error'>
                  {passwordError}
                </p>
              )}
              {passwordSuccess && (
                <p className='settings-status settings-status-success'>
                  {passwordSuccess}
                </p>
              )}

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
                    disabled={isChangingPassword}
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
                    disabled={isChangingPassword}
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
                    disabled={isChangingPassword}
                  />
                </div>

                <button
                  type='submit'
                  className='settings-btn settings-btn-primary'
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? 'Updating...' : 'Update Password'}
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
                      Once you delete your account, there is no going back. Your
                      posts and comments will remain but your name will become
                      &quot;[deleted]&quot;.
                    </p>
                  </div>
                  {!showDeleteForm && (
                    <button
                      type='button'
                      className='settings-btn settings-btn-danger'
                      onClick={() => {
                        setDeleteEmail('')
                        setDeletePassword('')
                        setDeleteError('')
                        setShowDeleteForm(true)
                      }}
                    >
                      Delete Account
                    </button>
                  )}
                </div>

                {showDeleteForm && (
                  <form
                    className='settings-delete-confirm-form'
                    onSubmit={handleDeleteAccount}
                  >
                    <div className='settings-delete-warning'>
                      <FaExclamationTriangle className='settings-delete-warning-icon' />
                      <span>
                        This action is permanent. All your data will be
                        anonymized.
                      </span>
                    </div>

                    {deleteError && (
                      <p className='settings-status settings-status-error'>
                        {deleteError}
                      </p>
                    )}

                    <div className='settings-form-group'>
                      <label htmlFor='deleteEmail' className='settings-label'>
                        <FaEnvelope className='settings-label-icon' />
                        Email
                      </label>
                      <input
                        type='email'
                        id='deleteEmail'
                        className='settings-input'
                        value={deleteEmail}
                        onChange={(e) => setDeleteEmail(e.target.value)}
                        placeholder='Your email address'
                        disabled={isDeletingAccount}
                        required
                      />
                    </div>

                    {user?.hasPassword && (
                      <div className='settings-form-group'>
                        <label
                          htmlFor='deletePassword'
                          className='settings-label'
                        >
                          <FaLock className='settings-label-icon' />
                          Password
                        </label>
                        <input
                          type='password'
                          id='deletePassword'
                          className='settings-input'
                          value={deletePassword}
                          onChange={(e) => setDeletePassword(e.target.value)}
                          placeholder='Your password'
                          disabled={isDeletingAccount}
                          required
                        />
                      </div>
                    )}

                    <div className='settings-delete-confirm-actions'>
                      <button
                        type='submit'
                        className='settings-btn settings-btn-danger'
                        disabled={isDeletingAccount}
                      >
                        {isDeletingAccount ? 'Deleting...' : 'Confirm Delete'}
                      </button>
                      <button
                        type='button'
                        className='settings-btn settings-btn-primary'
                        onClick={() => setShowDeleteForm(false)}
                        disabled={isDeletingAccount}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
