import { useState } from 'react'
import './Styles/EditAvatar.css'
import avatar2 from './img/avatar2.png'

const OUTFITS = [
  { id: 1, name: 'Outfit 1', src: avatar2 },
  { id: 2, name: 'Outfit 2', src: avatar2 },
  { id: 3, name: 'Outfit 3', src: avatar2 },
  { id: 4, name: 'Outfit 4', src: avatar2 },
  { id: 5, name: 'Outfit 5', src: avatar2 },
  { id: 6, name: 'Outfit 6', src: avatar2 },
  { id: 7, name: 'Outfit 7', src: avatar2 },
  { id: 8, name: 'Outfit 8', src: avatar2 },
]

export const EditAvatar = () => {
  const [selectedId, setSelectedId] = useState(OUTFITS[0].id)
  const selectedOutfit = OUTFITS.find((o) => o.id === selectedId)

  const handleSave = () => {
    console.log('Saved outfit:', selectedOutfit.name)
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
                src={selectedOutfit.src}
                alt='Selected Avatar'
                className='edit-avatar-preview-img'
              />
            </div>
            <span className='edit-avatar-username'>u/username</span>
          </div>

          <div className='edit-avatar-left-divider' />

          <div className='edit-avatar-save-section'>
            <button
              type='button'
              className='edit-avatar-save-btn'
              onClick={handleSave}
            >
              Save changes
            </button>
          </div>
        </div>

        {/* Right Panel */}
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
                onClick={() => setSelectedId(outfit.id)}
                role='button'
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ')
                    setSelectedId(outfit.id)
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
        </div>
      </div>
    </div>
  )
}
