import { useState, useCallback, useEffect, useRef } from 'react'
import {
  FaSearch,
  FaTimes,
  FaPen,
  FaTrash,
  FaCloudUploadAlt,
} from 'react-icons/fa'
import './Styles/CreatePost.css'

export const CreatePost = () => {
  const [activeTab, setActiveTab] = useState('Text')
  const [isDraftsOpen, setIsDraftsOpen] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [community, setCommunity] = useState('')
  const [postTitle, setPostTitle] = useState('')
  const [postBody, setPostBody] = useState('')
  const [postUrl, setPostUrl] = useState('')
  const [selectedImageName, setSelectedImageName] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')

  const dragCounterRef = useRef(0)
  const fileInputRef = useRef(null)

  const handleFile = useCallback(
    (file) => {
      if (!file || !file.type.startsWith('image/')) {
        setUploadError('Please choose an image file.')
        return
      }

      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setUploadError('')
      setSelectedImageName(file.name)
      setPreviewUrl(URL.createObjectURL(file))
    },
    [previewUrl],
  )

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
        handleFile(e.dataTransfer.files[0])
      }
    },
    [handleFile],
  )

  const handleFileSelect = useCallback(
    (e) => {
      if (e.target.files && e.target.files[0]) {
        handleFile(e.target.files[0])
      }
    },
    [handleFile],
  )

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  useEffect(() => {
    if (!isDraftsOpen) return undefined

    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsDraftsOpen(false)
    }

    document.addEventListener('keydown', handleEscape)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = previousOverflow
    }
  }, [isDraftsOpen])

  return (
    <div className='create-post-page'>
      <div className='create-post-card'>
        <header className='create-post-header'>
          <div>
            <p className='create-post-eyebrow'>Community publishing</p>
            <h1 className='create-post-title'>Create a Post</h1>
            <p className='create-post-subtitle'>
              Publish text, links or media using the same polished flow as your
              community pages.
            </p>
          </div>
          <button
            type='button'
            className='create-post-drafts'
            onClick={() => setIsDraftsOpen(true)}
            aria-haspopup='dialog'
            aria-expanded={isDraftsOpen}
          >
            <span className='create-post-drafts-label'>Drafts</span>
            <span className='create-post-drafts-count'>2</span>
          </button>
        </header>

        <div className='create-post-community-wrap'>
          <FaSearch className='create-post-search-icon' aria-hidden />
          <input
            type='text'
            placeholder='Choose a community'
            className='create-post-community-input'
            aria-label='Search community'
            value={community}
            onChange={(e) => setCommunity(e.target.value)}
          />
        </div>

        <div className='create-post-editor'>
          <div className='create-post-tabs' role='tablist' aria-label='Post type'>
            <button
              type='button'
              role='tab'
              aria-selected={activeTab === 'Text'}
              aria-controls='panel-text'
              className={`create-post-tab ${activeTab === 'Text' ? 'create-post-tab--active' : ''}`}
              onClick={() => setActiveTab('Text')}
            >
              Text
            </button>
            <button
              type='button'
              role='tab'
              aria-selected={activeTab === 'Images'}
              aria-controls='panel-images'
              className={`create-post-tab ${activeTab === 'Images' ? 'create-post-tab--active' : ''}`}
              onClick={() => setActiveTab('Images')}
            >
              Images
            </button>
            <button
              type='button'
              role='tab'
              aria-selected={activeTab === 'Link'}
              aria-controls='panel-link'
              className={`create-post-tab ${activeTab === 'Link' ? 'create-post-tab--active' : ''}`}
              onClick={() => setActiveTab('Link')}
            >
              Link
            </button>
          </div>

          <div className='create-post-title-wrap'>
            <input
              type='text'
              placeholder='Title'
              className='create-post-title-input'
              aria-label='Post title'
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
            />
          </div>

          <div className='create-post-body-wrap'>
            {activeTab === 'Text' && (
              <textarea
                id='panel-text'
                name='body'
                rows={10}
                placeholder='Text (optional)'
                className='create-post-body-input'
                aria-label='Post body'
                value={postBody}
                onChange={(e) => setPostBody(e.target.value)}
              />
            )}

            {activeTab === 'Images' && (
              <div
                id='panel-images'
                className={`create-post-upload-wrap ${dragActive ? 'drag-active' : ''}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <div className='create-post-upload-content'>
                  <span className='create-post-upload-text'>
                    Drag and drop or upload media
                  </span>
                  {selectedImageName && (
                    <span className='create-post-upload-file'>
                      {selectedImageName}
                    </span>
                  )}
                  <input
                    type='file'
                    id='file-upload'
                    accept='image/*'
                    onChange={handleFileSelect}
                    ref={fileInputRef}
                    className='create-post-file-input'
                  />
                  <button
                    type='button'
                    className='create-post-upload-btn'
                    onClick={handleUploadClick}
                  >
                    <FaCloudUploadAlt />
                  </button>
                </div>

                {uploadError && (
                  <p className='create-post-upload-error'>{uploadError}</p>
                )}

                {previewUrl && (
                  <div className='create-post-preview-wrap'>
                    <img
                      src={previewUrl}
                      alt='Selected upload preview'
                      className='create-post-preview'
                    />
                  </div>
                )}
              </div>
            )}

            {activeTab === 'Link' && (
              <textarea
                id='panel-link'
                name='url'
                rows={2}
                placeholder='URL'
                className='create-post-body-input create-post-link-input'
                aria-label='Post URL'
                value={postUrl}
                onChange={(e) => setPostUrl(e.target.value)}
              />
            )}
          </div>

          <div className='create-post-actions'>
            <button
              type='button'
              className='create-post-btn create-post-btn-secondary'
            >
              Save Draft
            </button>
            <button
              type='button'
              className='create-post-btn create-post-btn-primary'
            >
              Post
            </button>
          </div>
        </div>

        {/* <footer className='create-post-footer'>
          <a href='#' className='create-post-footer-link'>
            About
          </a>
          <a href='#' className='create-post-footer-link'>
            Contact
          </a>
          <a href='#' className='create-post-footer-link'>
            FAQ
          </a>
          <a href='#' className='create-post-footer-link'>
            Terms
          </a>
        </footer> */}
      </div>

      {isDraftsOpen && (
        <div
          className='drafts-modal-overlay'
          role='dialog'
          aria-modal='true'
          aria-label='Drafts'
          onClick={() => setIsDraftsOpen(false)}
        >
          <div className='drafts-modal' onClick={(e) => e.stopPropagation()}>
            <div className='drafts-header'>
              <div className='drafts-title'>
                <span>Drafts</span>
                <span className='drafts-count'>2/20</span>
              </div>
              <button
                type='button'
                className='drafts-icon-btn drafts-close'
                aria-label='Close drafts'
                onClick={() => setIsDraftsOpen(false)}
              >
                <FaTimes />
              </button>
            </div>

            <ul className='drafts-list'>
              <li className='drafts-item'>
                <div className='drafts-item-main'>
                  <div className='drafts-item-title'>Incerc Draft</div>
                  <div className='drafts-item-sub'>
                    <span className='drafts-item-community'>r/15minutefood</span>
                    <span className='drafts-dot'>*</span>
                    <span className='drafts-item-edited'>Edited 44 min. ago</span>
                  </div>
                </div>
                <div className='drafts-item-actions'>
                  <button
                    type='button'
                    className='drafts-icon-btn'
                    aria-label='Edit draft'
                  >
                    <FaPen />
                  </button>
                  <button
                    type='button'
                    className='drafts-icon-btn'
                    aria-label='Delete draft'
                  >
                    <FaTrash />
                  </button>
                </div>
              </li>

              <li className='drafts-item'>
                <div className='drafts-item-main'>
                  <div className='drafts-item-title'>
                    Idee postare despre frontend
                  </div>
                  <div className='drafts-item-sub'>
                    <span className='drafts-item-community'>r/webdev</span>
                    <span className='drafts-dot'>*</span>
                    <span className='drafts-item-edited'>Edited 2 hours ago</span>
                  </div>
                </div>
                <div className='drafts-item-actions'>
                  <button
                    type='button'
                    className='drafts-icon-btn'
                    aria-label='Edit draft'
                  >
                    <FaPen />
                  </button>
                  <button
                    type='button'
                    className='drafts-icon-btn'
                    aria-label='Delete draft'
                  >
                    <FaTrash />
                  </button>
                </div>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
