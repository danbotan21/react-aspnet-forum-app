import { useState, useCallback, useRef } from 'react'
import { FaCloudUploadAlt, FaTimes } from 'react-icons/fa'
import './Styles/ImageDropzone.css'

/**
 * Reusable drag-and-drop image picker used by the community-create form
 * (icon + banner) and the create-post image tab, so the three share one look
 * and behaviour. Drag feedback is shown immediately on dragenter/dragover (not
 * only after the file is dropped) and a remove (×) button lets the user clear
 * their choice if they change their mind.
 *
 * variant: 'avatar' (square crop preview) | 'banner' (wide cropped preview,
 * mirrors how the banner is shown on the community page) | 'post' (whole image
 * shown, contained).
 */
export const ImageDropzone = ({
  variant = 'post',
  previewUrl,
  fileName,
  onFile,
  onRemove,
  hint = 'Drag and drop an image or',
}) => {
  const [dragActive, setDragActive] = useState(false)
  const dragCounter = useRef(0)
  const inputRef = useRef(null)

  const pickFile = useCallback(
    (file) => {
      if (file && file.type.startsWith('image/')) onFile(file)
    },
    [onFile],
  )

  const handleDragEnter = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer?.items?.length) {
      dragCounter.current += 1
      setDragActive(true)
    }
  }, [])

  // Also flag on dragover: guarantees the highlight appears the moment the
  // pointer is over the zone even if a dragenter event was missed.
  const handleDragOver = useCallback(
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      if (!dragActive) setDragActive(true)
    },
    [dragActive],
  )

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current -= 1
    if (dragCounter.current <= 0) {
      dragCounter.current = 0
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      dragCounter.current = 0
      setDragActive(false)
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        pickFile(e.dataTransfer.files[0])
      }
    },
    [pickFile],
  )

  const handleSelect = useCallback(
    (e) => {
      if (e.target.files && e.target.files[0]) pickFile(e.target.files[0])
      // Reset so picking the same file again still fires onChange.
      e.target.value = ''
    },
    [pickFile],
  )

  const openPicker = useCallback(() => inputRef.current?.click(), [])

  return (
    <div className={`image-dropzone image-dropzone--${variant}`}>
      <div
        className={`image-dropzone__zone ${dragActive ? 'is-dragging' : ''} ${
          previewUrl ? 'has-preview' : ''
        }`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={previewUrl ? undefined : openPicker}
        role='button'
        tabIndex={0}
        onKeyDown={(e) => {
          if (!previewUrl && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            openPicker()
          }
        }}
      >
        <input
          type='file'
          ref={inputRef}
          accept='image/*'
          onChange={handleSelect}
          className='image-dropzone__input'
          aria-hidden='true'
          tabIndex={-1}
        />

        {previewUrl ? (
          <div className='image-dropzone__preview-wrap'>
            <img
              src={previewUrl}
              alt='Preview'
              className='image-dropzone__preview'
            />
            <div className='image-dropzone__overlay'>
              <button
                type='button'
                className='image-dropzone__action'
                onClick={(e) => {
                  e.stopPropagation()
                  openPicker()
                }}
              >
                Change
              </button>
            </div>
            <button
              type='button'
              className='image-dropzone__remove'
              aria-label='Remove image'
              onClick={(e) => {
                e.stopPropagation()
                onRemove?.()
              }}
            >
              <FaTimes size={12} />
            </button>
          </div>
        ) : (
          <div className='image-dropzone__placeholder'>
            <FaCloudUploadAlt className='image-dropzone__icon' />
            <p className='image-dropzone__hint'>
              {hint} <span className='image-dropzone__cta'>Upload</span>
            </p>
          </div>
        )}
      </div>

      {fileName && <p className='image-dropzone__filename'>{fileName}</p>}
    </div>
  )
}

export default ImageDropzone
