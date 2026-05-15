import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FaTimes,
  FaPen,
  FaTrash,
  FaCloudUploadAlt,
} from 'react-icons/fa'
import { useAuth } from './AuthContext'
import { uploadImage } from './utils/imageUpload'
import './Styles/CreatePost.css'

export const CreatePost = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('Text')
  const [isDraftsOpen, setIsDraftsOpen] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  // States for backend data
  const [communities, setCommunities] = useState([])
  const [communityId, setCommunityId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [postTitle, setPostTitle] = useState('')
  const [postBody, setPostBody] = useState('')
  const [postUrl, setPostUrl] = useState('')
  const [selectedImageName, setSelectedImageName] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [selectedImageFile, setSelectedImageFile] = useState(null)
  const [drafts, setDrafts] = useState([])
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(false)
  const [draftsError, setDraftsError] = useState('')

  const dragCounterRef = useRef(0)
  const fileInputRef = useRef(null)

  const handleFile = useCallback(
    (file) => {
      if (!file || !file.type.startsWith('image/')) {
        setUploadError('Please choose an image file.')
        setSelectedImageFile(null)
        return
      }

      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setUploadError('')
      setSelectedImageName(file.name)
      setSelectedImageFile(file)
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

  useEffect(() => {
    if (!isDraftsOpen || !user?.id) return

    setIsLoadingDrafts(true)
    setDraftsError('')

    fetch(`/api/draft/user?authorId=${user.id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load drafts')
        return res.json()
      })
      .then((data) => {
        setDrafts(Array.isArray(data) ? data : [])
      })
      .catch((err) => {
        setDraftsError(err.message)
      })
      .finally(() => {
        setIsLoadingDrafts(false)
      })
  }, [isDraftsOpen, user?.id])

  // Fetch only communities where the current user is a member
  useEffect(() => {
    if (!user?.id) {
      setCommunities([])
      return
    }

    fetch(`/api/communities/user/${user.id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch communities')
        return res.json()
      })
      .then((data) => {
        setCommunities(data)
      })
      .catch((err) => console.error(err))
  }, [user?.id])

  const handleSaveDraft = async () => {
    if (!user?.id) {
      alert('Please login to save drafts.')
      return
    }

    if (!postTitle.trim()) {
      alert('Add a title first so we can map a post to this draft.')
      return
    }

    try {
      const postsResponse = await fetch(`/api/posts/user/${user.id}`)
      if (!postsResponse.ok) {
        throw new Error('Could not read your posts for draft mapping.')
      }

      const userPosts = await postsResponse.json()
      const matchingPost = userPosts.find(
        (post) =>
          (post.title || '').trim().toLowerCase() ===
          postTitle.trim().toLowerCase(),
      )

      if (!matchingPost) {
        alert(
          'Current Draft API stores references to existing posts only. Create a post first (same title), then save draft.',
        )
        return
      }

      const createDraftResponse = await fetch(`/api/draft?authorId=${user.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: matchingPost.id,
        }),
      })

      if (!createDraftResponse.ok) {
        throw new Error('Failed to save draft')
      }

      const createdDraft = await createDraftResponse.json()
      setDrafts((currentDrafts) => {
        const createdDraftId = createdDraft.id ?? createdDraft.Id
        const alreadyExists = currentDrafts.some(
          (draft) => (draft.id ?? draft.Id) === createdDraftId,
        )
        return alreadyExists ? currentDrafts : [createdDraft, ...currentDrafts]
      })
      setIsDraftsOpen(true)
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDeleteDraft = async (draftId) => {
    if (!user?.id) return

    try {
      const response = await fetch(`/api/draft/${draftId}?authorId=${user.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete draft')
      }

      setDrafts((currentDrafts) =>
        currentDrafts.filter((draft) => (draft.id ?? draft.Id) !== draftId),
      )
    } catch (err) {
      alert(err.message)
    }
  }

  const handleOpenDraft = async (draftPostId) => {
    try {
      const response = await fetch(`/api/posts/${draftPostId}`)
      if (!response.ok) {
        throw new Error('Failed to open draft post')
      }

      const post = await response.json()
      navigate(`/community/${post.communitySlug}/post/${post.id}`)
    } catch (err) {
      alert(err.message)
    }
  }

  const handleSubmit = async () => {
    if (!user?.id) {
      alert('Please login to create a post.')
      return
    }

    if (!communityId) {
      alert('Please select a community')
      return
    }
    if (!postTitle.trim()) {
      alert('Title is required')
      return
    }
    setIsSubmitting(true)

    let imageUrl = null
    if (selectedImageFile) {
      imageUrl = await uploadImage(selectedImageFile, 'posts')
    }

    const normalizedBody = postBody.trim()
    const normalizedLink = postUrl.trim()
    const hasImage = Boolean(imageUrl)
    const hasBody = Boolean(normalizedBody)
    const hasLink = Boolean(normalizedLink)
    const contentKinds = [hasBody, hasImage, hasLink].filter(Boolean).length
    const postType =
      contentKinds > 1
        ? 'Mixed'
        : hasImage
          ? 'Image'
          : hasLink
            ? 'Link'
            : 'Text'

    const postData = {
      title: postTitle,
      body: normalizedBody || null,
      imageUrl,
      linkUrl: normalizedLink || null,
      type: postType,
      communityId: parseInt(communityId, 10),
    }

    try {
      const response = await fetch(`/api/posts?authorId=${user.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      })

      if (!response.ok) {
        throw new Error('Failed to create post')
      }

      const createdPost = await response.json()
      // Use community slug from communities array for the route
      const selectedComm = communities.find(
        (c) => c.id === parseInt(communityId, 10),
      )
      if (selectedComm) {
        navigate(`/community/${selectedComm.slug}/post/${createdPost.id}`)
      } else {
        navigate('/')
      }
    } catch (error) {
      console.error(error)
      alert('An error occurred while creating the post.')
    } finally {
      setIsSubmitting(false)
    }
  }

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
            <span className='create-post-drafts-count'>{drafts.length}</span>
          </button>
        </header>

        <div className='create-post-community-wrap'>
          <select
            className='create-post-community-input'
            aria-label='Select community'
            value={communityId}
            onChange={(e) => setCommunityId(e.target.value)}
          >
            <option value='' disabled>
              {user?.id ? 'Choose a community' : 'Login to choose a community'}
            </option>
            {communities.map((comm) => (
              <option key={comm.id} value={comm.id}>
                r/{comm.slug}
              </option>
            ))}
          </select>
        </div>

        <div className='create-post-editor'>
          <div
            className='create-post-tabs'
            role='tablist'
            aria-label='Post type'
          >
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
              onClick={handleSaveDraft}
            >
              Save Draft
            </button>
            <button
              type='button'
              className='create-post-btn create-post-btn-primary'
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Posting...' : 'Post'}
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
                <span className='drafts-count'>{drafts.length}/20</span>
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
              {isLoadingDrafts ? (
                <li className='drafts-item'>
                  <div className='drafts-item-main'>Loading drafts...</div>
                </li>
              ) : draftsError ? (
                <li className='drafts-item'>
                  <div className='drafts-item-main' style={{ color: '#c62828' }}>
                    {draftsError}
                  </div>
                </li>
              ) : drafts.length === 0 ? (
                <li className='drafts-item'>
                  <div className='drafts-item-main'>No drafts available.</div>
                </li>
              ) : (
                drafts.map((draft) => {
                  const draftId = draft.id ?? draft.Id
                  const draftPostId = draft.postId ?? draft.PostId
                  const draftPostTitle = draft.postTitle ?? draft.PostTitle
                  const draftLastModifiedAt =
                    draft.lastModifiedAt ?? draft.LastModifiedAt

                  return (
                  <li className='drafts-item' key={draftId}>
                    <div className='drafts-item-main'>
                      <div className='drafts-item-title'>{draftPostTitle}</div>
                      <div className='drafts-item-sub'>
                        <span className='drafts-item-community'>
                          Post #{draftPostId}
                        </span>
                        <span className='drafts-dot'>*</span>
                        <span className='drafts-item-edited'>
                          Edited {new Date(draftLastModifiedAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className='drafts-item-actions'>
                      <button
                        type='button'
                        className='drafts-icon-btn'
                        aria-label='Open draft'
                        onClick={() => handleOpenDraft(draftPostId)}
                      >
                        <FaPen />
                      </button>
                      <button
                        type='button'
                        className='drafts-icon-btn'
                        aria-label='Delete draft'
                        onClick={() => handleDeleteDraft(draftId)}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </li>
                  )
                })
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
