import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FaCaretUp, FaCaretDown, FaComment, FaShare } from 'react-icons/fa'
import './Styles/CommunityPage.css'
import avatar from './img/avatar.webp'
import man from './img/man.jpg'
import shreck from './img/shreck.png'
import nature from './img/nature.jpg'
import coding from './img/coding.jpg'

const SORT_OPTIONS = ['Popular', 'New', 'Top']

const COMMUNITY_DATA = {
  frontend: {
    name: 'frontend',
    title: 'Frontend Lounge',
    description:
      'Comunitate dedicata UI engineering, React patterns, design systems si performanta web.',
    banner: coding,
    image: avatar,
    members: '92K',
    online: '1.4K',
    rules: [
      'Fii respectuos in discutii si argumenteaza tehnic.',
      'Postarile trebuie sa aiba context clar si titlu relevant.',
      'Fara self-promo agresiv sau link farming.',
      'Include cod minim reproductibil pentru intrebari de debugging.',
    ],
  },
  webdev: {
    name: 'webdev',
    title: 'WebDev Circle',
    description:
      'Discutii practice despre frontend, backend, deploy, arhitectura si tool-uri moderne.',
    banner: nature,
    image: man,
    members: '77K',
    online: '880',
    rules: [
      'Respecta ghidul de postare si evita titlurile vagi.',
      'Mentioneaza stack-ul folosit in intrebari tehnice.',
      'Nu publica continut duplicat in aceeasi zi.',
      'Feedback constructiv, fara atacuri personale.',
    ],
  },
  memes: {
    name: 'memes',
    title: 'Meme Factory',
    description:
      'Meme-uri fresh, cultura internet si cele mai virale thread-uri ale saptamanii.',
    banner: shreck,
    image: avatar,
    members: '128K',
    online: '5.2K',
    rules: [
      'Fara continut ofensator sau spam repetitiv.',
      'Publica doar media care respecta regulile platformei.',
      'Evita repost-ul aceluiasi meme in 24h.',
      'Foloseste flair-ul corect pentru postare.',
    ],
  },
  travel: {
    name: 'travel',
    title: 'Travel Notes',
    description:
      'Ghiduri de calatorie, idei de city break si recomandari reale de la comunitate.',
    banner: nature,
    image: avatar,
    members: '61K',
    online: '740',
    rules: [
      'Include costuri aproximative si perioada recomandata.',
      'Fara dezinformare despre documente sau vize.',
      'Pastreaza discutiile on-topic.',
      'Respecta normele locale din destinatiile discutate.',
    ],
  },
  devtalk: {
    name: 'devtalk',
    title: 'DevTalk',
    description:
      'Discutii zilnice despre React, backend, AI si proiecte reale.',
    banner: coding,
    image: man,
    members: '92K',
    online: '1.3K',
    rules: [
      'Feedback tehnic argumentat.',
      'Nu publica cod incomplet fara context.',
      'Titluri clare si descriptive.',
      'Respecta intotdeauna ceilalti membri.',
    ],
  },
  pixelarena: {
    name: 'pixelarena',
    title: 'PixelArena',
    description: 'Community pentru esports, stiri si lansari de jocuri.',
    banner: shreck,
    image: avatar,
    members: '114K',
    online: '3.1K',
    rules: [
      'Fara leak-uri neverificate.',
      'Posteaza in categoria corecta.',
      'Respecta ceilalti jucatori.',
      'Nu promova cheaturi.',
    ],
  },
}

// Posts will be fetched from backend.

const getPostRoute = (communityName, postId) =>
  `/community/${encodeURIComponent(communityName)}/post/${postId}`

export function CommunityPage() {
  const { communityname } = useParams()
  const [sortBy, setSortBy] = useState('Popular')
  const [openMorePostId, setOpenMorePostId] = useState(null)

  const postsWrapRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (postsWrapRef.current && !postsWrapRef.current.contains(e.target)) {
        setOpenMorePostId(null)
        return
      }

      if (!e.target.closest('.post-header-actions')) {
        setOpenMorePostId(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const slug = decodeURIComponent(communityname ?? 'frontend').toLowerCase()

  const [realCommunity, setRealCommunity] = useState(null)
  const [posts, setPosts] = useState([])
  const [isLoadingPosts, setIsLoadingPosts] = useState(true)

  // Fetch community from backend
  useEffect(() => {
    fetch(`/api/communities/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error('Community not found')
        return res.json()
      })
      .then((data) => setRealCommunity(data))
      .catch((err) => console.error(err))
  }, [slug])

  // Fetch posts from backend using the real community ID
  useEffect(() => {
    if (!realCommunity?.id) return
    setIsLoadingPosts(true)
    fetch(`/api/posts/community/${realCommunity.id}?sortBy=${sortBy.toLowerCase()}`)
      .then((res) => res.json())
      .then((data) => {
        setPosts(data)
        setIsLoadingPosts(false)
      })
      .catch((err) => {
        console.error(err)
        setIsLoadingPosts(false)
      })
  }, [realCommunity?.id, sortBy])

  const community = useMemo(() => {
    const fallback = COMMUNITY_DATA[slug] || {
      name: slug,
      title: slug
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' '),
      description:
        'Aceasta comunitate este noua. Datele de continut vor fi sincronizate dupa conectarea cu backend-ul.',
      banner: coding,
      image: avatar,
      members: '0',
      online: '0',
      rules: [
        'Fii respectuos cu ceilalti membri.',
        'Posteaza continut relevant comunitatii.',
        'Evita spam-ul si continutul duplicat.',
        'Respecta regulile generale ale platformei.',
      ],
    }

    if (realCommunity) {
      return {
        ...fallback,
        title: realCommunity.title || fallback.title,
        description: realCommunity.description || fallback.description,
        members: realCommunity.membersCount || fallback.members,
        name: realCommunity.slug || fallback.name,
      }
    }

    return fallback
  }, [slug, realCommunity])

  return (
    <main className='community-page'>
      <section className='community-shell'>
        <div className='community-main'>
          <header className='community-hero'>
            <div className='community-banner'>
              <img src={community.banner} alt='Community banner' />
            </div>

            <div className='community-head'>
              <img
                src={community.image}
                alt='Community avatar'
                className='community-avatar'
              />
              <div className='community-meta'>
                <h1>{community.title}</h1>
                <p>r/{community.name}</p>
                <span>
                  {community.members} members • {community.online} online
                </span>
              </div>
              <button type='button' className='community-join-btn'>
                Join
              </button>
            </div>
          </header>

          <section className='community-sort-bar'>
            <div className='community-sort-options'>
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option}
                  type='button'
                  className={`community-sort-option ${sortBy === option ? 'community-sort-option-active' : ''}`}
                  onClick={() => setSortBy(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </section>

          <section className='community-feed' ref={postsWrapRef}>
            {isLoadingPosts && realCommunity ? (
              <p style={{ textAlign: 'center', padding: '2rem' }}>Loading posts...</p>
            ) : posts.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '2rem' }}>No posts found in this community.</p>
            ) : (
              posts.map((post) => (
                <article key={post.id} className='post'>
                  <div className='post-main'>
                    <header className='post-header'>
                      <Link
                        to={`/user/${encodeURIComponent(post.authorName)}`}
                      >
                        <img
                          src={avatar}
                          alt={post.authorName}
                          className='avatar'
                        />
                      </Link>
                      <div className='post-meta'>
                        <Link
                          to={`/user/${encodeURIComponent(post.authorName)}`}
                          className='author author-link'
                        >
                          u/{post.authorName}
                        </Link>
                        <span className='meta-separator'>&middot;</span>
                        <span className='time-posted'>{new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>

                      <div className='post-header-actions'>
                        <button
                          type='button'
                          className='more-button'
                          onClick={() =>
                            setOpenMorePostId((prev) =>
                              prev === post.id ? null : post.id,
                            )
                          }
                          aria-expanded={openMorePostId === post.id}
                          aria-haspopup='menu'
                          aria-label='Open post options'
                        >
                          ...
                        </button>
                        {openMorePostId === post.id && (
                          <div className='more-menu' role='menu'>
                            <Link
                              to={getPostRoute(community.name, post.id)}
                              className='more-menu-item more-menu-link'
                              role='menuitem'
                              onClick={() => setOpenMorePostId(null)}
                            >
                              Open post
                            </Link>
                            <button className='more-menu-item' role='menuitem'>
                              Save
                            </button>
                            <button
                              className='more-menu-item more-menu-danger'
                              role='menuitem'
                            >
                              Report
                            </button>
                          </div>
                        )}
                      </div>
                    </header>

                    <div className='post-body'>
                      <h3 className='post-title'>
                        <Link
                          to={getPostRoute(community.name, post.id)}
                          className='post-title-link'
                        >
                          {post.title}
                        </Link>
                      </h3>
                      {post.body && <p className='post-text'>{post.body}</p>}

                      {(post.imageUrl || post.linkUrl) && (
                        <div className='post-media'>
                          {post.imageUrl ? (
                            <Link
                              to={getPostRoute(community.name, post.id)}
                              className='post-media-link'
                            >
                              <div className='media-placeholder'>
                                <img src={post.imageUrl} alt='Post content' />
                              </div>
                            </Link>
                          ) : (
                            <div className='media-placeholder'>
                              <a href={post.linkUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#0066cc', textDecoration: 'underline' }}>{post.linkUrl}</a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <footer className='post-footer'>
                      <div className='action-chip vote-chip'>
                        <FaCaretUp className='vote-icon upvote' />
                        <span className='vote-count'>{post.votes}</span>
                        <FaCaretDown className='vote-icon downvote' />
                      </div>

                      <button type='button' className='action-chip'>
                        <FaComment className='comment-icon' />
                        <span className='comment-count'>{post.commentsCount}</span>
                      </button>

                      <button type='button' className='action-chip'>
                        <FaShare className='share-icon' />
                      </button>
                    </footer>
                  </div>
                </article>
              ))
            )}
          </section>
        </div>

        <aside className='community-side'>
          <section className='community-side-card'>
            <h2>About community</h2>
            <p>{community.description}</p>
          </section>

          <section className='community-side-card'>
            <h3>Rules</h3>
            <ol>
              {community.rules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ol>
          </section>
        </aside>
      </section>
    </main>
  )
}
