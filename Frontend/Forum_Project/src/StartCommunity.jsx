import { useState, useCallback, useRef, useEffect } from 'react'
import { FaCloudUploadAlt, FaTimes } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
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
  const [selectedCategory, setSelectedCategory] = useState('Technology')
  const [selectedType, setSelectedType] = useState('public')
  const [selectedImageName, setSelectedImageName] = useState('')
  const [communityTitle, setCommunityTitle] = useState('')
  const [communityDescription, setCommunityDescription] = useState('')
  const [base64Image, setBase64Image] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const [dragActive, setDragActive] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const dragCounterRef = useRef(0)
  const fileInputRef = useRef(null)

  const handleImageChange = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) {
      setSelectedImageName('')
      setBase64Image('')
      return
    }
    setSelectedImageName(file.name)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(file))
    const reader = new FileReader()
    reader.onloadend = () => {
      setBase64Image(reader.result)
    }
    reader.readAsDataURL(file)
  }, [previewUrl])

  const handleDragEnter = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer?.items?.length) {
      dragCounterRef.current += 1
      setDragActive(true)
    }
  }, [])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current -= 1
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      dragCounterRef.current = 0
      setDragActive(false)

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleImageChange(e.dataTransfer.files[0])
      }
    },
    [handleImageChange],
  )

  const handleFileSelect = useCallback(
    (e) => {
      if (e.target.files && e.target.files[0]) {
        handleImageChange(e.target.files[0])
      }
    },
    [handleImageChange],
  )

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const handleCreateCommunity = async () => {
    if (!communityTitle.trim()) {
      setError("Title is required.")
      return
    }

    setIsLoading(true)
    setError(null)

    // Generate slug from title
    const generatedSlug = communityTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || `comm-${Date.now()}`

    const payload = {
      title: communityTitle,
      slug: generatedSlug,
      description: communityDescription || "",
      category: selectedCategory,
      type: selectedType
    }

    try {
      const response = await fetch("/api/communities?authorId=1", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to create community")
      }

      const createdCommunity = await response.json()

      if (base64Image && createdCommunity?.id) {
        const imageUpdateResponse = await fetch(`/api/communities/${createdCommunity.id}?requestingUserId=1`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            avatarUrl: base64Image,
            bannerUrl: base64Image
          })
        })

        if (!imageUpdateResponse.ok) {
          const imageErrorText = await imageUpdateResponse.text()
          throw new Error(imageErrorText || "Community created, but image upload failed")
        }
      }

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
          <h2 className='start-community-section-title'>
            Community details
          </h2>
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
            <span className='start-community-label'>Image</span>
            <div
              className={`start-community-dropzone ${dragActive ? 'start-community-dropzone-active' : ''}`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={handleUploadClick}
              role='button'
              tabIndex={0}
              style={{
                border: dragActive ? '2px dashed var(--accent)' : '2px dashed var(--border)',
                borderRadius: '8px',
                padding: '2rem',
                textAlign: 'center',
                cursor: 'pointer',
                background: dragActive ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
            >
              <input
                type='file'
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept='image/*'
                style={{ display: 'none' }}
                aria-hidden='true'
              />
              {previewUrl ? (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img src={previewUrl} alt='Preview' style={{ maxHeight: '150px', borderRadius: '4px' }} />
                  <button
                    type='button'
                    onClick={(e) => {
                      e.stopPropagation()
                      setPreviewUrl('')
                      setSelectedImageName('')
                      setBase64Image('')
                    }}
                    style={{
                      position: 'absolute',
                      top: '-10px',
                      right: '-10px',
                      background: 'var(--bg-elevated)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border)',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                    aria-label='Remove image'
                  >
                    <FaTimes size={12} />
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                  <FaCloudUploadAlt size={32} />
                  <p style={{ margin: 0 }}>
                    Drag and drop an image or <span style={{ color: 'var(--accent)', fontWeight: '500' }}>Upload</span>
                  </p>
                </div>
              )}
            </div>
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
          {error && <p className='start-community-error' style={{ color: 'red', marginBottom: '10px' }}>{error}</p>}
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
