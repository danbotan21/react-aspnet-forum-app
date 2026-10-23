import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { uploadImage } from './utils/imageUpload'
import { ImageDropzone } from './ImageDropzone'
import './Styles/StartCommunity.css'

export const StartCommunity = () => {
  const categories = [
    'Gaming',
    'Technology',
    'Art',
    'Music',
    'Sports',
    'Education',
    'Travel',
    'Food',
  ]

  const communityTypes = [
    {
      id: 'public',
      title: 'Public',
      desc: 'Anyone can view, post and comment.',
    },
    {
      id: 'restricted',
      title: 'Restricted',
      desc: 'Anyone can view, but only approved users can post.',
    },
    {
      id: 'private',
      title: 'Private',
      desc: 'Only approved users can view and participate.',
    },
  ]

  const navigate = useNavigate()
  const { user, token } = useAuth()
  const [selectedCategory, setSelectedCategory] = useState('Technology')
  const [selectedType, setSelectedType] = useState('public')
  const [selectedAvatarImageName, setSelectedAvatarImageName] = useState('')
  const [selectedBannerImageName, setSelectedBannerImageName] = useState('')
  const [communityTitle, setCommunityTitle] = useState('')
  const [communityDescription, setCommunityDescription] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [bannerFile, setBannerFile] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState('')
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState('')

  const handleAvatarFile = (file) => {
    if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl)
    setSelectedAvatarImageName(file.name)
    setAvatarFile(file)
    setAvatarPreviewUrl(URL.createObjectURL(file))
  }

  const clearAvatar = () => {
    if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl)
    setSelectedAvatarImageName('')
    setAvatarFile(null)
    setAvatarPreviewUrl('')
  }

  const handleBannerFile = (file) => {
    if (bannerPreviewUrl) URL.revokeObjectURL(bannerPreviewUrl)
    setSelectedBannerImageName(file.name)
    setBannerFile(file)
    setBannerPreviewUrl(URL.createObjectURL(file))
  }

  const clearBanner = () => {
    if (bannerPreviewUrl) URL.revokeObjectURL(bannerPreviewUrl)
    setSelectedBannerImageName('')
    setBannerFile(null)
    setBannerPreviewUrl('')
  }

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl)
      if (bannerPreviewUrl) URL.revokeObjectURL(bannerPreviewUrl)
    }
  }, [avatarPreviewUrl, bannerPreviewUrl])

  const handleCreateCommunity = async () => {
    if (!user?.id) {
      setError('Please log in before creating a community.')
      return
    }

    if (!communityTitle.trim()) {
      setError('Title is required.')
      return
    }

    setIsLoading(true)
    setError(null)

    // Generate slug from title
    const generatedSlug =
      communityTitle
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') || `comm-${Date.now()}`

    const payload = {
      title: communityTitle,
      slug: generatedSlug,
      description: communityDescription || '',
      category: selectedCategory,
      type: selectedType,
    }

    try {
      const response = await fetch('/api/communities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to create community')
      }

      const createdCommunity = await response.json()

      const imageUpdatePayload = {}

      if (avatarFile) {
        imageUpdatePayload.avatarUrl = await uploadImage(
          avatarFile,
          'communities',
        )
      }

      if (bannerFile) {
        imageUpdatePayload.bannerUrl = await uploadImage(
          bannerFile,
          'communities',
        )
      }

      if (Object.keys(imageUpdatePayload).length > 0 && createdCommunity?.id) {
        const imageUpdateResponse = await fetch(
          `/api/communities/${createdCommunity.id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(imageUpdatePayload),
          },
        )

        if (!imageUpdateResponse.ok) {
          const data = await imageUpdateResponse.json().catch(() => ({}))
          throw new Error(
            data.message || 'Community created, but image upload failed',
          )
        }
      }

      // Tell the sidebar (and anything else listening) to refresh the user's
      // community list so the newly created community shows up without a manual reload.
      window.dispatchEvent(new Event('communities-membership-updated'))

      navigate(`/community/${createdCommunity?.slug || generatedSlug}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='start-community-page'>
      <div className='start-community-card'>
        <p className='start-community-eyebrow'>Community setup</p>
        <h1 className='start-community-title-page'>Start a Community</h1>
        <p className='start-community-subtitle'>
          Configure category, details and privacy to launch your space.
        </p>

        <section className='start-community-section'>
          <h2 className='start-community-section-title'>Choose a category</h2>
          <div className='start-community-categories'>
            {categories.map((category) => (
              <button
                key={category}
                type='button'
                aria-pressed={selectedCategory === category}
                className={`start-community-chip ${selectedCategory === category ? 'start-community-chip--active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        <section className='start-community-section'>
          <h2 className='start-community-section-title'>Community details</h2>
          <div className='start-community-field'>
            <label htmlFor='community-title' className='start-community-label'>
              Title
            </label>
            <input
              id='community-title'
              type='text'
              placeholder='Enter community title'
              className='start-community-input'
              value={communityTitle}
              onChange={(e) => setCommunityTitle(e.target.value)}
            />
          </div>

          <div className='start-community-field'>
            <label
              htmlFor='community-description'
              className='start-community-label'
            >
              Description
            </label>
            <textarea
              id='community-description'
              rows={5}
              placeholder='Tell people what your community is about'
              className='start-community-textarea'
              value={communityDescription}
              onChange={(e) => setCommunityDescription(e.target.value)}
            />
          </div>

          <div className='start-community-field'>
            <span className='start-community-label'>Community icon</span>
            <ImageDropzone
              variant='avatar'
              previewUrl={avatarPreviewUrl}
              fileName={
                selectedAvatarImageName
                  ? `Icon: ${selectedAvatarImageName}`
                  : ''
              }
              onFile={handleAvatarFile}
              onRemove={clearAvatar}
            />
          </div>

          <div className='start-community-field'>
            <span className='start-community-label'>
              Banner image (optional)
            </span>
            <ImageDropzone
              variant='banner'
              previewUrl={bannerPreviewUrl}
              fileName={
                selectedBannerImageName
                  ? `Banner: ${selectedBannerImageName}`
                  : ''
              }
              onFile={handleBannerFile}
              onRemove={clearBanner}
            />
          </div>
        </section>

        <section className='start-community-section'>
          <h2 className='start-community-section-title'>Community type</h2>
          <div className='start-community-types'>
            {communityTypes.map((type) => (
              <button
                key={type.id}
                type='button'
                aria-pressed={selectedType === type.id}
                className={`start-community-type-btn ${selectedType === type.id ? 'start-community-type-btn--active' : ''}`}
                onClick={() => setSelectedType(type.id)}
              >
                <span className='start-community-type-title'>{type.title}</span>
                <span className='start-community-type-desc'>{type.desc}</span>
              </button>
            ))}
          </div>
        </section>

        <div className='start-community-actions'>
          {error && (
            <p
              className='start-community-error'
              style={{ color: 'red', marginBottom: '10px' }}
            >
              {error}
            </p>
          )}
          <button
            type='button'
            className='start-community-submit'
            onClick={handleCreateCommunity}
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Community'}
          </button>
        </div>
      </div>
    </div>
  )
}
