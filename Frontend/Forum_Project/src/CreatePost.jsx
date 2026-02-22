import { useState, useCallback } from 'react'
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

  // 1. DEFINIM MAI ÎNTÂI handleFile
  const handleFile = useCallback((file) => {
    // Verifică dacă e imagine
    if (!file.type.startsWith('image/')) {
      console.log('❌ Fișierul selectat nu este o imagine:', file.name)
      alert('Te rog selectează o imagine!')
      return
    }

    // Afișează în consolă numele fișierului
    console.log('✅ Imagine încărcată cu succes:', file.name)
    console.log('📊 Detalii fișier:', {
      nume: file.name,
      tip: file.type,
      dimensiune: `${(file.size / 1024).toFixed(2)} KB`,
      data_modificare: new Date(file.lastModified).toLocaleString(),
    })
  }, []) // handleFile nu are dependențe

  // 2. APOI DEFINIM FUNCȚIILE CARE FOLOSESC handleFile
  const handleDrag = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0]
        handleFile(file)
      }
    },
    [handleFile], // Acum handleFile există aici
  )

  const handleFileSelect = useCallback(
    (e) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0]
        handleFile(file)
      }
    },
    [handleFile], // Acum handleFile există aici
  )

  const handleUploadClick = useCallback(() => {
    document.getElementById('file-upload').click()
  }, [])

  return (
    <div className='create-post-page'>
      <div className='create-post-card'>
        <header className='create-post-header'>
          <h1 className='create-post-title'>Create Post</h1>
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
          />
        </div>

        <div className='create-post-editor'>
          <div className='create-post-tabs' role='tablist'>
            <button
              type='button'
              role='tab'
              aria-selected={activeTab === 'Text'}
              className={`create-post-tab ${activeTab === 'Text' ? 'create-post-tab--active' : ''}`}
              onClick={() => setActiveTab('Text')}
            >
              Text
            </button>
            <button
              type='button'
              role='tab'
              aria-selected={activeTab === 'Images'}
              className={`create-post-tab ${activeTab === 'Images' ? 'create-post-tab--active' : ''}`}
              onClick={() => setActiveTab('Images')}
            >
              Images
            </button>
            <button
              type='button'
              role='tab'
              aria-selected={activeTab === 'Link'}
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
            />
          </div>

          <div className='create-post-body-wrap'>
            {activeTab === 'Text' && (
              <textarea
                name='body'
                rows={10}
                placeholder='Text (optional)'
                className='create-post-body-input'
                aria-label='Post body'
              />
            )}
            {activeTab === 'Images' && (
              <div
                className={`create-post-upload-wrap ${dragActive ? 'drag-active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className='create-post-upload-content'>
                  <span className='create-post-upload-text'>
                    Drag and Drop or upload media
                  </span>
                  <input
                    type='file'
                    id='file-upload'
                    accept='image/*'
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                  <button
                    type='button'
                    className='create-post-upload-btn'
                    onClick={handleUploadClick}
                  >
                    <FaCloudUploadAlt />
                  </button>
                </div>
              </div>
            )}
            {activeTab === 'Link' && (
              <textarea
                name='url'
                rows={2}
                placeholder='Url'
                className='create-post-body-input create-post-link-input'
                aria-label='Post URL'
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

        <footer className='create-post-footer'>
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
        </footer>
      </div>

      {isDraftsOpen && (
        <div
          className='drafts-modal-overlay'
          role='dialog'
          aria-modal='true'
          aria-label='Drafts'
        >
          <div className='drafts-modal'>
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
              {/* Primul draft */}
              <li className='drafts-item'>
                <div className='drafts-item-main'>
                  <div className='drafts-item-title'>Incerc Draft</div>
                  <div className='drafts-item-sub'>
                    <span className='drafts-item-community'>
                      r/15minutefood
                    </span>
                    <span className='drafts-dot'>•</span>
                    <span className='drafts-item-edited'>
                      Edited 44 min. ago
                    </span>
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

              {/* Al doilea draft */}
              <li className='drafts-item'>
                <div className='drafts-item-main'>
                  <div className='drafts-item-title'>
                    Idee postare despre frontend
                  </div>
                  <div className='drafts-item-sub'>
                    <span className='drafts-item-community'>r/webdev</span>
                    <span className='drafts-dot'>•</span>
                    <span className='drafts-item-edited'>
                      Edited 2 hours ago
                    </span>
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
