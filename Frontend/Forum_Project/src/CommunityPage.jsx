import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FaCaretUp, FaCaretDown, FaComment, FaShare } from 'react-icons/fa'
import { useAuth } from './AuthContext'
import './Styles/CommunityPage.css'
import avatar from './img/avatar.webp'
import coding from './img/coding.jpg'
import { normalizeImageSrc } from './utils/media'

const SORT_OPTIONS = ['Popular', 'New', 'Top']

const getPostRoute = (communitySlug, postId) =>
  `/community/${encodeURIComponent(communitySlug)}/post/${postId}`

export function CommunityPage() {
  const { communityname } = useParams()
  const { user } = useAuth()
  const [sortBy, setSortBy] = useState('Popular')
  const [openMorePostId, setOpenMorePostId] = useState(null)

  const [community, setCommunity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isMember, setIsMember] = useState(false)

  const [posts, setPosts] = useState([])
  const [isLoadingPosts, setIsLoadingPosts] = useState(true)

  const postsWrapRef = useRef(null)

  useEffect(() => {
    const fetchCommunityAndMembership = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/Communities/${communityname}`)
        if (!response.ok) {
          throw new Error('Community not found')
        }
        const data = await response.json()
        setCommunity(data)

        if (user?.id && data?.id) {
          const membershipRes = await fetch(`/api/Communities/${data.id}/ismember?userId=${user.id}`);
          if (membershipRes.ok) {
            const memberStatus = await membershipRes.json();
            setIsMember(memberStatus === true);
          }
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchCommunityAndMembership()
  }, [communityname, user])

  useEffect(() => {
    if (!community?.id) return
    setIsLoadingPosts(true)
    fetch(`/api/posts/community/${community.id}?sortBy=${sortBy.toLowerCase()}`)
      .then((res) => res.json())
      .then((data) => {
        setPosts(data)
        setIsLoadingPosts(false)
      })
      .catch((err) => {
        console.error(err)
        setIsLoadingPosts(false)
      })
  }, [community?.id, sortBy])

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

  if (loading) return <div className='community-page'><p>Loading...</p></div>;
  if (error || !community) return <div className='community-page'><p>Error: {error || 'Not found'}</p></div>;

  const communityBannerSrc = normalizeImageSrc(community.bannerUrl) || normalizeImageSrc(community.avatarUrl)
  const communityAvatarSrc = normalizeImageSrc(community.avatarUrl)

  return (
    <main className='community-page'>
      <section className='community-shell'>
        <div className='community-main'>
          <header className='community-hero'>
            <div className='community-banner'>
              {communityBannerSrc ? (
                <img src={communityBannerSrc} alt='Community banner' />
              ) : (
                <img src={coding} alt='Community banner fallback' />
              )}
            </div>

            <div className='community-head'>
              {communityAvatarSrc ? (
                <img src={communityAvatarSrc} alt='Community avatar' className='community-avatar' />
              ) : (
                <img src={avatar} alt='Community avatar fallback' className='community-avatar' />
              )}
              <div className='community-meta'>
                <h1>{community.title}</h1>
                <p>c/{community.slug}</p>
                <span>
                  {community.membersCount} members
                </span>
              </div>
              <button
                type='button'
                className={`community-join-btn ${isMember ? 'community-leave-btn' : ''}`}
                style={isMember ? { backgroundColor: 'transparent', color: 'white', border: '1px solid white' } : {}}
              >
                {isMember ? 'Leave' : 'Join'}
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
            {isLoadingPosts ? (
              <p style={{ textAlign: 'center', padding: '2rem' }}>Loading posts...</p>
            ) : posts.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '2rem' }}>No posts found in this community.</p>
            ) : (
              posts.map((post) => {
                const postImageSrc = normalizeImageSrc(post.imageUrl ?? post.ImageUrl)
                return (
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
                            to={getPostRoute(community.slug, post.id)}
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
                        to={getPostRoute(community.slug, post.id)}
                        className='post-title-link'
                      >
                        {post.title}
                      </Link>
                    </h3>
                    {post.body && <p className='post-text'>{post.body}</p>}

                    {(postImageSrc || post.linkUrl) && (
                      <div className='post-media'>
                        {postImageSrc ? (
                          <Link
                            to={getPostRoute(community.slug, post.id)}
                            className='post-media-link'
                          >
                            <div className='media-placeholder'>
                              <img src={postImageSrc} alt='Post content' />
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
                )
              })
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
              {(community.rules || [
                'Fii respectuos in discutii.',
                'Postarile trebuie sa aiba context clar.',
                'Fara comportament toxic.'
              ]).map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ol>
          </section>
        </aside>
      </section>
    </main>
  )
}