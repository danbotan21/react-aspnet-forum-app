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

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) {
      setSelectedImageName('')
      return
    }
    setSelectedImageName(file.name)
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
          <button type='button' className='start-community-submit'>
            Create Community
          </button>
        </div>
      </div>
    </div>
  )
}
