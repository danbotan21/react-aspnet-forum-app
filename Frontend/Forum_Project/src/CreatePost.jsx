import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaTimes, FaPen, FaTrash, FaUserShield } from 'react-icons/fa'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'
import { uploadImage } from './utils/imageUpload'
import { normalizeImageSrc } from './utils/media'
import { fetchMyBannedStatus } from './utils/modApi'
import { ImageDropzone } from './ImageDropzone'
import './Styles/CreatePost.css'

export const CreatePost = () => {
  const navigate = useNavigate()
  const { user, token } = useAuth()
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('Text')
  const [isDraftsOpen, setIsDraftsOpen] = useState(false)

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
  const [currentDraftId, setCurrentDraftId] = useState(null)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [myRoleInSelected, setMyRoleInSelected] = useState(null)
  const [isBannedInSelected, setIsBannedInSelected] = useState(false)

  const blobUrlRef = useRef(null)

  const revokeBlobUrl = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = null
    }
  }, [])

  const handleFile = useCallback(
    (file) => {
      if (!file || !file.type.startsWith('image/')) {
        setUploadError('Please choose an image file.')
        setSelectedImageFile(null)
        return
      }

      revokeBlobUrl()
      const objectUrl = URL.createObjectURL(file)
      blobUrlRef.current = objectUrl
      setUploadError('')
      setSelectedImageName(file.name)
      setSelectedImageFile(file)
      setPreviewUrl(objectUrl)
    },
    [revokeBlobUrl],
  )

  const handleRemoveImage = useCallback(() => {
    revokeBlobUrl()
    setSelectedImageFile(null)
    setSelectedImageName('')
    setPreviewUrl('')
    setUploadError('')
  }, [revokeBlobUrl])

  useEffect(() => {
    return () => revokeBlobUrl()
  }, [revokeBlobUrl])

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

  // Fetch drafts on mount so the counter is correct immediately
  useEffect(() => {
    if (!user?.id || !token) return
    fetch('/api/draft/user', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setDrafts(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [user?.id, token])

  useEffect(() => {
    if (!isDraftsOpen || !user?.id) return

    setIsLoadingDrafts(true)
    setDraftsError('')

    fetch('/api/draft/user', {
      headers: { Authorization: `Bearer ${token}` },
    })
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
  }, [isDraftsOpen, token])

  // Fetch only communities where the current user is a member
  useEffect(() => {
    if (!user?.id || !token) {
      setCommunities([])
      return
    }

    fetch(`/api/communities/user/${user.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch communities')
        return res.json()
      })
      .then((data) => {
        setCommunities(data)
      })
      .catch((err) => console.error(err))
  }, [user?.id, token])

  // When a community is selected, fetch role and banned status
  useEffect(() => {
    setMyRoleInSelected(null)
    setIsBannedInSelected(false)
    setSubmitError('')
    if (!communityId || !token) return

    fetchMyBannedStatus(communityId, token)
      .then((s) => setIsBannedInSelected(s.isBanned))
      .catch(() => setIsBannedInSelected(false))

    const selected = communities.find(
      (c) => String(c.id) === String(communityId),
    )
    if (selected?.type?.toLowerCase() !== 'restricted') return

    fetch(`/api/communities/${communityId}/myrole`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setMyRoleInSelected(data?.role ?? null))
      .catch(() => setMyRoleInSelected(null))
  }, [communityId, token, communities])

  const handleSaveDraft = async () => {
    if (!token) {
      toast.error('Please login to save drafts.')
      return
    }
    if (!postTitle.trim()) {
      toast.error('Add a title before saving a draft.')
      return
    }
    if (isSavingDraft) return

    setIsSavingDraft(true)
    try {
      // Resolve imageUrl: upload new file, or keep already-uploaded URL from loaded draft
      let imageUrl = null
      if (selectedImageFile) {
        imageUrl = await uploadImage(selectedImageFile, 'posts')
        // Swap the local blob for the permanent Cloudinary URL
        revokeBlobUrl()
        setSelectedImageFile(null)
        setPreviewUrl(imageUrl ?? '')
      } else if (previewUrl && !previewUrl.startsWith('blob:')) {
        imageUrl = previewUrl
      }

      // Always persist all content fields so nothing is lost when switching tabs
      const draftPayload = {
        title: postTitle.trim(),
        body: postBody.trim() || null,
        linkUrl: postUrl.trim() || null,
        imageUrl,
        communityId: communityId ? parseInt(communityId, 10) : null,
      }

      if (currentDraftId) {
        const res = await fetch(`/api/draft/${currentDraftId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(draftPayload),
        })
        if (!res.ok) throw new Error('Failed to update draft')
        const updated = await res.json()
        setDrafts((prev) =>
          prev.map((d) => ((d.id ?? d.Id) === currentDraftId ? updated : d)),
        )
      } else {
        const res = await fetch('/api/draft', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(draftPayload),
        })
        if (!res.ok) throw new Error('Failed to save draft')
        const created = await res.json()
        setCurrentDraftId(created.id ?? created.Id)
        setDrafts((prev) => [created, ...prev])
      }

      setIsDraftsOpen(true)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsSavingDraft(false)
    }
  }

  const handleDeleteDraft = async (draftId) => {
    if (!token) return

    try {
      const response = await fetch(`/api/draft/${draftId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error('Failed to delete draft')
      }

      setDrafts((currentDrafts) =>
        currentDrafts.filter((draft) => (draft.id ?? draft.Id) !== draftId),
      )
      if (draftId === currentDraftId) setCurrentDraftId(null)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleOpenDraft = (draft) => {
    const draftId = draft.id ?? draft.Id
    const imgUrl = draft.imageUrl ?? draft.ImageUrl ?? null
    const linkUrl = draft.linkUrl ?? draft.LinkUrl ?? ''
    const body = draft.body ?? draft.Body ?? ''
    const commId = draft.communityId ?? draft.CommunityId ?? null

    setCurrentDraftId(draftId)
    setPostTitle(draft.title ?? draft.Title ?? '')
    setPostBody(body)
    setPostUrl(linkUrl)
    setCommunityId(commId ? String(commId) : '')

    if (imgUrl) {
      revokeBlobUrl()
      setSelectedImageFile(null)
      setPreviewUrl(imgUrl)
      setSelectedImageName('Saved image')
      setActiveTab('Images')
    } else if (linkUrl) {
      setActiveTab('Link')
    } else {
      setActiveTab('Text')
    }

    setIsDraftsOpen(false)
  }

  const handleSubmit = async () => {
    setSubmitError('')

    if (!token) {
      setSubmitError('Please login to create a post.')
      return
    }

    if (!communityId) {
      setSubmitError('Please select a community.')
      return
    }
    if (isBannedInSelected) {
      setSubmitError('You are banned from this community and cannot post.')
      return
    }
    if (!postTitle.trim()) {
      setSubmitError('Title is required.')
      return
    }

    const selectedComm = communities.find(
      (c) => String(c.id) === String(communityId),
    )
    if (selectedComm?.type?.toLowerCase() === 'restricted') {
      if (myRoleInSelected !== 'owner' && myRoleInSelected !== 'moderator') {
        setSubmitError(
          'This is a restricted community — only moderators can post here.',
        )
        return
      }
    }

    setIsSubmitting(true)

    let imageUrl = null
    if (selectedImageFile) {
      imageUrl = await uploadImage(selectedImageFile, 'posts')
    } else if (previewUrl && !previewUrl.startsWith('blob:')) {
      imageUrl = previewUrl
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
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(postData),
      })

      if (!response.ok) {
        throw new Error('Failed to create post')
      }

      const createdPost = await response.json()

      if (currentDraftId) {
        await fetch(`/api/draft/${currentDraftId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {})
        setCurrentDraftId(null)
      }

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
      setSubmitError(
        'An error occurred while creating the post. Please try again.',
      )
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
                {comm.type === 'restricted'
                  ? ' (restricted)'
                  : comm.type === 'private'
                    ? ' (private)'
                    : ''}
              </option>
            ))}
          </select>
        </div>

        {(() => {
          const sel = communities.find(
            (c) => String(c.id) === String(communityId),
          )
          if (!sel) return null
          if (
            sel.type?.toLowerCase() === 'restricted' &&
            myRoleInSelected !== 'owner' &&
            myRoleInSelected !== 'moderator'
          ) {
            return (
              <div className='create-post-restricted-banner'>
                <FaUserShield className='create-post-restricted-icon' />
                <span>
                  <strong>Restricted community</strong> — Only moderators and
                  the owner can post here.
                </span>
              </div>
            )
          }
          return null
        })()}

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
              <div id='panel-images'>
                <ImageDropzone
                  variant='post'
                  previewUrl={
                    previewUrl
                      ? (normalizeImageSrc(previewUrl) ?? previewUrl)
                      : ''
                  }
                  fileName={selectedImageName}
                  onFile={handleFile}
                  onRemove={handleRemoveImage}
                  hint='Drag and drop media or'
                />
                {uploadError && (
                  <p className='create-post-upload-error'>{uploadError}</p>
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

          {submitError && (
            <div className='create-post-submit-error'>{submitError}</div>
          )}

          <div className='create-post-actions'>
            <button
              type='button'
              className='create-post-btn create-post-btn-secondary'
              onClick={handleSaveDraft}
              disabled={isSavingDraft}
            >
              {isSavingDraft
                ? 'Saving...'
                : currentDraftId
                  ? 'Update Draft'
                  : 'Save Draft'}
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
                  <div
                    className='drafts-item-main'
                    style={{ color: '#c62828' }}
                  >
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
                  const draftTitle = draft.title ?? draft.Title ?? 'Untitled'
                  const draftCommunitySlug =
                    draft.communitySlug ?? draft.CommunitySlug
                  const draftLastModifiedAt =
                    draft.lastModifiedAt ?? draft.LastModifiedAt
                  const isActive = draftId === currentDraftId

                  return (
                    <li
                      className={`drafts-item${isActive ? ' drafts-item--active' : ''}`}
                      key={draftId}
                    >
                      <div
                        className='drafts-item-main'
                        role='button'
                        tabIndex={0}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleOpenDraft(draft)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            handleOpenDraft(draft)
                          }
                        }}
                      >
                        <div className='drafts-item-title'>{draftTitle}</div>
                        <div className='drafts-item-sub'>
                          {draftCommunitySlug ? (
                            <span className='drafts-item-community'>
                              r/{draftCommunitySlug}
                            </span>
                          ) : (
                            <span className='drafts-item-community'>
                              No community
                            </span>
                          )}
                          <span className='drafts-dot'>·</span>
                          <span className='drafts-item-edited'>
                            Edited{' '}
                            {new Date(draftLastModifiedAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className='drafts-item-actions'>
                        <button
                          type='button'
                          className='drafts-icon-btn'
                          aria-label='Load draft'
                          onClick={() => handleOpenDraft(draft)}
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
