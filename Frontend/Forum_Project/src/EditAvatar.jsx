import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { normalizeImageSrc } from './utils/media'
import { readResponseError, uploadImage } from './utils/imageUpload'
import defaultAvatar from './img/avatar.webp'
import avatar2 from './img/avatar2.png'
import manAvatar from './img/man.jpg'
import shreckAvatar from './img/shreck.png'
import './Styles/EditAvatar.css'

const OUTFITS = [
  { id: 1, name: 'Outfit 1', src: avatar2 },
  { id: 2, name: 'Outfit 2', src: defaultAvatar },
  { id: 3, name: 'Outfit 3', src: manAvatar },
  { id: 4, name: 'Outfit 4', src: shreckAvatar },
  { id: 5, name: 'Outfit 5', src: avatar2 },
  { id: 6, name: 'Outfit 6', src: defaultAvatar },
  { id: 7, name: 'Outfit 7', src: manAvatar },
  { id: 8, name: 'Outfit 8', src: shreckAvatar },
]

const getFileExtensionFromSrc = (src) => {
  const cleanSrc = src.split('?')[0]
  const match = cleanSrc.match(/\.(jpg|jpeg|png|gif|webp)$/i)
  return match ? match[1].toLowerCase() : 'png'
}

const createFileFromPreset = async (src, outfitId) => {
  const response = await fetch(src)
  if (!response.ok) {
    throw new Error('Failed to load the selected outfit image.')
  }

  const blob = await response.blob()
  const extension = getFileExtensionFromSrc(src)
  const mimeType =
    blob.type || `image/${extension === 'jpg' ? 'jpeg' : extension}`
  return new File([blob], `avatar-outfit-${outfitId}.${extension}`, {
    type: mimeType,
  })
}

export const EditAvatar = () => {
  const navigate = useNavigate()
  const { user, token, updateUser, updateAuthTokens } = useAuth()
  const fileInputRef = useRef(null)

  const [selectedId, setSelectedId] = useState(OUTFITS[0].id)
  const [selectedOutfitSrc, setSelectedOutfitSrc] = useState(OUTFITS[0].src)
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const currentAvatarSrc =
    previewUrl ||
    selectedOutfitSrc ||
    normalizeImageSrc(user?.avatarUrl) ||
    defaultAvatar

  const handleOutfitSelect = (outfitId) => {
    setSelectedId(outfitId)
    const selectedOutfit = OUTFITS.find((outfit) => outfit.id === outfitId)
    setSelectedOutfitSrc(selectedOutfit?.src || '')
    setSelectedFile(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl('')
    if (fileInputRef.current) fileInputRef.current.value = ''
    setError('')
    setSuccess('')
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]

    if (!file || !file.type.startsWith('image/')) {
      setSelectedFile(null)
      setPreviewUrl('')
      setError('Please select an image file.')
      return
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setSelectedOutfitSrc('')
    setSelectedId(null)
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setError('')
    setSuccess('')
  }

  const refreshAccessToken = async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) return null

    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })

    if (!response.ok) return null

    const data = await response.json()
    if (!data?.token) return null

    updateAuthTokens(data.token, data.refreshToken, data.user)
    return data.token
  }

  const updateAvatarProfile = (avatarUrl, accessToken) =>
    fetch('/api/auth/me', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ avatarUrl }),
    })

  const handleSave = async () => {
    if (!token) {
      setError('Please login before updating your avatar.')
      return
    }

    if (!selectedFile && !selectedOutfitSrc) {
      setError('Please choose an avatar image first.')
      return
    }

    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      let fileToUpload = selectedFile

      if (!fileToUpload && selectedOutfitSrc) {
        fileToUpload = await createFileFromPreset(selectedOutfitSrc, selectedId)
      }

      if (!fileToUpload) {
        throw new Error('Please choose an avatar image first.')
      }

      const avatarUrl = await uploadImage(fileToUpload, 'users')
      if (!avatarUrl) {
        throw new Error('Avatar upload failed.')
      }

      let response = await updateAvatarProfile(avatarUrl, token)

      if (response.status === 401) {
        const refreshedToken = await refreshAccessToken()
        if (refreshedToken) {
          response = await updateAvatarProfile(avatarUrl, refreshedToken)
        }
      }

      if (!response.ok) {
        const errorMessage = await readResponseError(
          response,
          'Failed to update avatar.',
        )
        throw new Error(errorMessage)
      }

      const updatedUser = await response.json()
      updateUser(updatedUser)
      setSuccess('Avatar updated successfully.')

      setTimeout(() => {
        const targetUserName =
          updatedUser?.userName ||
          updatedUser?.username ||
          user?.userName ||
          user?.username ||
          'profile'
        navigate(`/user/${encodeURIComponent(targetUserName)}`)
      }, 500)
    } catch (err) {
      setError(err.message || 'Avatar update failed.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className='edit-avatar-page'>
      <div className='edit-avatar-page-header'>
        <h1 className='edit-avatar-title'>Edit Avatar</h1>
        <p className='edit-avatar-subtitle'>
          Choose an outfit to represent yourself
        </p>
      </div>

      <div className='edit-avatar-container'>
        <div className='edit-avatar-left'>
          <div className='edit-avatar-preview-section'>
            <span className='edit-avatar-preview-label'>Preview</span>
            <div className='edit-avatar-preview-circle'>
              <img
                src={currentAvatarSrc}
                alt='Selected Avatar'
                className='edit-avatar-preview-img'
              />
            </div>
            <span className='edit-avatar-username'>
              u/{user?.userName || 'username'}
            </span>
          </div>

          <div className='edit-avatar-left-divider' />

          <div className='edit-avatar-save-section'>
            {error && (
              <p className='edit-avatar-status edit-avatar-status-error'>
                {error}
              </p>
            )}
            {success && (
              <p className='edit-avatar-status edit-avatar-status-success'>
                {success}
              </p>
            )}
            <button
              type='button'
              className='edit-avatar-save-btn'
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>

        <div className='edit-avatar-right'>
          <div className='edit-avatar-tabs'>
            <button type='button' className='edit-avatar-tab active'>
              Outfits
            </button>
          </div>

          <div className='outfit-grid'>
            {OUTFITS.map((outfit) => (
              <div
                key={outfit.id}
                className={`outfit-card${selectedId === outfit.id ? ' selected' : ''}`}
                onClick={() => handleOutfitSelect(outfit.id)}
                role='button'
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ')
                    handleOutfitSelect(outfit.id)
                }}
                aria-label={outfit.name}
                aria-pressed={selectedId === outfit.id}
              >
                <div className='outfit-card-img-wrap'>
                  <img src={outfit.src} alt={outfit.name} />
                </div>
                <span className='outfit-card-name'>{outfit.name}</span>
              </div>
            ))}
          </div>

          <div className='edit-avatar-upload-actions'>
            <input
              ref={fileInputRef}
              type='file'
              accept='image/*'
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <button
              type='button'
              className='edit-avatar-save-btn'
              onClick={() => fileInputRef.current?.click()}
            >
              Choose image
            </button>
            <p className='edit-avatar-upload-hint'>
              {selectedFile
                ? selectedFile.name
                : 'Pick an image, then press Save changes.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
