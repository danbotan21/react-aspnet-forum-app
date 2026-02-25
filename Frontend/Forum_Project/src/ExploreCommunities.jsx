import { useMemo, useState } from 'react'
import {
  FaFire,
  FaLeaf,
  FaMusic,
  FaRobot,
  FaCode,
  FaGamepad,
} from 'react-icons/fa'
import { MdTravelExplore, MdLocalMovies } from 'react-icons/md'
import './Styles/ExploreCommunities.css'

const CATEGORY_TABS = [
  'All',
  'Most Visited',
  'Tech',
  'Gaming',
  'Movies',
  'Lifestyle',
  'Travel',
  'Music',
]

const ALL_COMMUNITIES = [
  {
    id: 'devtalk',
    name: 'DevTalk',
    visitors: '92K',
    description:
      'Discutii zilnice despre React, backend, AI si proiecte reale.',
    category: 'Tech',
    icon: FaCode,
    accent: 'linear-gradient(135deg, #1d4ed8 0%, #06b6d4 100%)',
  },
  {
    id: 'cinehub',
    name: 'CineHub',
    visitors: '61K',
    description: 'Recenzii, recomandari si debate-uri despre filme si seriale.',
    category: 'Movies',
    icon: MdLocalMovies,
    accent: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)',
  },
  {
    id: 'pixelarena',
    name: 'PixelArena',
    visitors: '114K',
    description: 'Community pentru esports, stiri si lansari de jocuri.',
    category: 'Gaming',
    icon: FaGamepad,
    accent: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
  },
  {
    id: 'wandernotes',
    name: 'WanderNotes',
    visitors: '48K',
    description: 'Planuri de city break, ghiduri si locuri ascunse.',
    category: 'Travel',
    icon: MdTravelExplore,
    accent: 'linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%)',
  },
  {
    id: 'sounddistrict',
    name: 'SoundDistrict',
    visitors: '73K',
    description: 'Albume noi, setup audio si recomandari pentru playlist.',
    category: 'Music',
    icon: FaMusic,
    accent: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
  },
  {
    id: 'greenhabit',
    name: 'GreenHabit',
    visitors: '39K',
    description: 'Tips de productivitate, wellbeing si obiceiuri sanatoase.',
    category: 'Lifestyle',
    icon: FaLeaf,
    accent: 'linear-gradient(135deg, #14b8a6 0%, #22c55e 100%)',
  },
  {
    id: 'futurelab',
    name: 'FutureLab',
    visitors: '86K',
    description: 'AI tools, prompts si trenduri tech explicate simplu.',
    category: 'Tech',
    icon: FaRobot,
    accent: 'linear-gradient(135deg, #6366f1 0%, #0ea5e9 100%)',
  },
  {
    id: 'trendpulse',
    name: 'TrendPulse',
    visitors: '55K',
    description: 'Subiecte virale, opinii si cele mai active discutii.',
    category: 'Most Visited',
    icon: FaFire,
    accent: 'linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)',
  },
]

const SECTION_CONFIG = [
  {
    title: 'Recommended For You',
    key: 'recommended',
    ids: [
      'devtalk',
      'futurelab',
      'cinehub',
      'greenhabit',
      'sounddistrict',
      'wandernotes',
    ],
  },
  {
    title: 'Fast Growing Now',
    key: 'growing',
    ids: [
      'pixelarena',
      'devtalk',
      'trendpulse',
      'futurelab',
      'cinehub',
      'wandernotes',
    ],
  },
  {
    title: 'Because You Like Tech',
    key: 'tech',
    ids: [
      'futurelab',
      'devtalk',
      'pixelarena',
      'sounddistrict',
      'trendpulse',
      'cinehub',
    ],
  },
]

export const ExploreCommunities = () => {
  const [activeCategory, setActiveCategory] = useState('All')

  const mapById = useMemo(
    () =>
      Object.fromEntries(
        ALL_COMMUNITIES.map((community) => [community.id, community]),
      ),
    [],
  )

  const filterByCategory = (communities) => {
    if (activeCategory === 'All') return communities
    if (activeCategory === 'Most Visited') {
      return communities.filter(
        (community) =>
          community.category === 'Most Visited' ||
          Number.parseInt(community.visitors, 10) >= 70,
      )
    }
    return communities.filter(
      (community) => community.category === activeCategory,
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

      {SECTION_CONFIG.map((section) => {
        const communities = filterByCategory(
          section.ids.map((id) => mapById[id]).filter(Boolean),
        )

        if (communities.length === 0) return null

        return (
          <section key={section.key} className='explore-section'>
            <div className='explore-section-header'>
              <h2>{section.title}</h2>
            </div>

            <div className='explore-grid'>
              {communities.map((community) => {
                const Icon = community.icon
                return (
                  <article key={community.id} className='explore-card'>
                    <div className='explore-card-top'>
                      <div
                        className='explore-card-logo'
                        style={{ background: community.accent }}
                      >
                        <Icon />
                      </div>
                      <button type='button' className='explore-join-btn'>
                        Join
                      </button>
                    </div>

                    <h3>{community.name}</h3>
                    <p className='explore-visitors'>
                      {community.visitors} weekly visitors
                    </p>
                    <p className='explore-description'>
                      {community.description}
                    </p>
                  </article>
                )
              })}
            </div>
          </section>
        )
      })}
    </main>
  )
}
