import { useEffect, useState } from 'react'
import './Styles/AdSidebar.css'
import { normalizeImageSrc } from './utils/media'
import { fetchFeedAds } from './utils/adApi'
import { useAuth } from './AuthContext'

const AD_COUNT = 3
const ROTATE_MS = 90_000 // refresh the rail every 90s for some variety

const AdCard = ({ ad }) => {
  const imageSrc = normalizeImageSrc(ad.imageUrl)
  // Non-interactive on purpose: ads are display-only, they do not navigate anywhere.
  return (
    <div className='ad-card'>
      <div className='ad-card-media'>
        {imageSrc ? (
          <img src={imageSrc} alt={ad.title} loading='lazy' />
        ) : (
          <div className='ad-card-media-fallback' aria-hidden>
            {(ad.brandLabel || ad.title || 'A').charAt(0).toUpperCase()}
          </div>
        )}
        <span className='ad-card-badge'>Ad</span>
      </div>
      <div className='ad-card-body'>
        <span className='ad-card-brand'>{ad.brandLabel}</span>
        <h4 className='ad-card-title'>{ad.title}</h4>
        {ad.body && <p className='ad-card-text'>{ad.body}</p>}
        {ad.price > 0 && (
          <div className='ad-card-footer'>
            <span className='ad-card-price'>${ad.price}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export const AdSidebar = () => {
  const { user } = useAuth()
  const isPremium = !!user?.isPremium
  const [ads, setAds] = useState([])

  useEffect(() => {
    // Premium members get an ad-free experience: skip fetching entirely. We don't clear
    // state here (the render below already returns null when premium) — calling setState
    // synchronously in an effect body would trigger cascading renders.
    if (isPremium) return

    let cancelled = false

    const load = async () => {
      const next = await fetchFeedAds(AD_COUNT)
      if (!cancelled) setAds(next)
    }

    load()
    const timer = setInterval(load, ROTATE_MS)

    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [isPremium])

  // Premium members see no ads; also render nothing if none are available.
  if (isPremium || ads.length === 0) return null

  return (
    <aside className='ad-rail' aria-label='Sponsored'>
      <div className='ad-rail-header'>
        <span className='ad-rail-header-label'>Sponsored</span>
      </div>
      <div className='ad-rail-list'>
        {ads.map((ad) => (
          <AdCard key={ad.id} ad={ad} />
        ))}
      </div>
    </aside>
  )
}
