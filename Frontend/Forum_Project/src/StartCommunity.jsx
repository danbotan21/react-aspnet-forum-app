import { useState } from 'react'
import { FaCloudUploadAlt } from 'react-icons/fa'
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

  const [selectedCategory, setSelectedCategory] = useState('Technology')
  const [selectedType, setSelectedType] = useState('public')
  const [selectedImageName, setSelectedImageName] = useState('')
  const [communityTitle, setCommunityTitle] = useState('')
  const [communityDescription, setCommunityDescription] = useState('')
  const [base64Image, setBase64Image] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) {
      setSelectedImageName('')
      setBase64Image('')
      return
    }
    setSelectedImageName(file.name)
    const reader = new FileReader()
    reader.onloadend = () => {
      setBase64Image(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleCreateCommunity = async () => {
    if (!communityTitle.trim()) {
      setError("Title is required.")
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(false)

    // Generate slug from title
    const generatedSlug = communityTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || `comm-${Date.now()}`

    const payload = {
      title: communityTitle,
      slug: generatedSlug,
      description: communityDescription || "",
      category: selectedCategory,
      type: selectedType,
      avatarUrl: base64Image || null
    }

    try {
      const response = await fetch("http://localhost:5129/api/Communities?authorId=1", {
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

      setSuccess(true)
      // Optional: Reset form fields here if needed
      setCommunityTitle('')
      setCommunityDescription('')
      setSelectedImageName('')
      setBase64Image('')
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
            <label htmlFor='community-image' className='start-community-upload'>
              <FaCloudUploadAlt className='start-community-upload-icon' />
              <span className='start-community-upload-text'>
                Upload a community image
              </span>
              {selectedImageName && (
                <span className='start-community-upload-file'>
                  {selectedImageName}
                </span>
              )}
            </label>
            <input
              id='community-image'
              type='file'
              accept='image/*'
              className='start-community-file-input'
              onChange={handleImageChange}
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
          {error && <p className='start-community-error' style={{ color: 'red', marginBottom: '10px' }}>{error}</p>}
          {success && <p className='start-community-success' style={{ color: 'green', marginBottom: '10px' }}>Community created successfully!</p>}
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
