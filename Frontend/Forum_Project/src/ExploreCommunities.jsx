import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FaFire,
  FaLeaf,
  FaMusic,
  FaRobot,
  FaCode,
  FaGamepad,
  FaUserShield,
} from 'react-icons/fa'
import { MdTravelExplore, MdLocalMovies } from 'react-icons/md'
import './Styles/ExploreCommunities.css'
import { normalizeImageSrc } from './utils/media'
import { apiFetch } from './AuthContext'

const CATEGORY_TABS = [
  'All',
  'Technology',
  'Gaming',
  'Art',
  'Movies',
  'Travel',
  'Music',
  'Food',
  'Sports',
  'Education',
]

const getIconForCategory = (category) => {
  switch (category?.toLowerCase()) {
    case 'tech':
    case 'technology':
      return FaCode
    case 'gaming':
      return FaGamepad
    case 'movies':
      return MdLocalMovies
    case 'travel':
      return MdTravelExplore
    case 'music':
      return FaMusic
    case 'food':
      return FaLeaf // Just a fallback
    default:
      return FaFire
  }
}

const getAccentForCategory = (category) => {
  switch (category?.toLowerCase()) {
    case 'tech':
    case 'technology':
      return 'linear-gradient(135deg, #1d4ed8 0%, #06b6d4 100%)'
    case 'gaming':
      return 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
    case 'travel':
      return 'linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%)'
    case 'music':
      return 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)'
    default:
      return 'linear-gradient(135deg, #6366f1 0%, #0ea5e9 100%)'
  }
}

export const ExploreCommunities = () => {
  const COMMUNITIES_CACHE_KEY = 'explore-communities-cache-v1'
  const [activeCategory, setActiveCategory] = useState('All')
  const [allCommunities, setAllCommunities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()

    const cachedValue = sessionStorage.getItem(COMMUNITIES_CACHE_KEY)
    const hasCachedData = Boolean(cachedValue)

    if (cachedValue) {
      try {
        const parsed = JSON.parse(cachedValue)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAllCommunities(parsed)
          setLoading(false)
        }
      } catch {
        sessionStorage.removeItem(COMMUNITIES_CACHE_KEY)
      }
    }

    const fetchCommunities = async () => {
      try {
        const response = await apiFetch('/api/communities', {
          signal: controller.signal,
        })
        if (response.ok) {
          const data = await response.json()
          if (isMounted) {
            setAllCommunities(data)
            sessionStorage.setItem(COMMUNITIES_CACHE_KEY, JSON.stringify(data))
          }
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Failed to fetch communities:', error)
        }
      } finally {
        if (isMounted && !hasCachedData) {
          setLoading(false)
        }
      }
    }

    fetchCommunities()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [])

  const filterByCategory = (communities) => {
    if (activeCategory === 'All') return communities
    return communities.filter(
      (community) => community.category === activeCategory,
    )
  }

  const displayedCommunities = filterByCategory(allCommunities)

  if (loading) {
    return (
      <div className='explore-page'>
        <p>Loading communities...</p>
      </div>
    )
  }

  return (
    <main className='explore-page'>
      <section className='explore-hero'>
        <div>
          <p className='explore-eyebrow'>Community discovery</p>
          <h1>Explore communities</h1>
          <p className='explore-subtitle'>
            Gaseste locul perfect pentru discutii, inspiratie si oameni cu
            interese comune.
          </p>
        </div>
      </section>

      <section className='explore-tabs' aria-label='Community categories'>
        {CATEGORY_TABS.map((tab) => (
          <button
            type='button'
            key={tab}
            className={`explore-tab ${activeCategory === tab ? 'explore-tab--active' : ''}`}
            onClick={() => setActiveCategory(tab)}
          >
            {tab}
          </button>
        ))}
      </section>

      <section className='explore-section'>
        <div className='explore-section-header'>
          <h2>Communities</h2>
        </div>

        <div className='explore-grid'>
          {displayedCommunities.map((community) => {
            const Icon = getIconForCategory(community.category)
            const communityAvatarSrc = normalizeImageSrc(community.avatarUrl)
            return (
              <article key={community.id} className='explore-card'>
                <div className='explore-card-top'>
                  <div
                    className='explore-card-logo'
                    style={{
                      background: getAccentForCategory(community.category),
                    }}
                  >
                    {communityAvatarSrc ? (
                      <img
                        src={communityAvatarSrc}
                        alt='icon'
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: '4px',
                        }}
                      />
                    ) : (
                      <Icon />
                    )}
                  </div>
                  <Link
                    to={`/community/${community.slug}`}
                    className='explore-join-btn'
                  >
                    Visit
                  </Link>
                </div>

                <h3>
                  <Link
                    to={`/community/${community.slug}`}
                    className='explore-community-link'
                  >
                    {community.title}
                  </Link>
                  {community.type?.toLowerCase() === 'restricted' && (
                    <span className='explore-type-badge explore-type-restricted'>
                      <FaUserShield /> Restricted
                    </span>
                  )}
                </h3>
                <p className='explore-visitors'>
                  {community.membersCount} members
                  {community.ownerUserName && (
                    <> · by u/{community.ownerUserName}</>
                  )}
                </p>
                <p className='explore-description'>{community.description}</p>
              </article>
            )
          })}
          {displayedCommunities.length === 0 && (
            <p>No communities found in this category.</p>
          )}
        </div>
      </section>
    </main>
  )
}
