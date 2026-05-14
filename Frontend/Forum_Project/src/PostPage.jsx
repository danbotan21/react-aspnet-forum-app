import { Link, useParams } from 'react-router-dom'
import { FaCaretDown, FaCaretUp, FaComment, FaShare } from 'react-icons/fa'
import './Styles/PostPage.css'
import avatar from './img/avatar.webp'
import coding from './img/coding.jpg'
import nature from './img/nature.jpg'

import { useState, useEffect } from 'react'

const COMMENTS = [
  {
    id: 1,
    author: 'u/Grace_TheCook',
    body: 'Great point. A shared PostCard and a dedicated feed hook usually keeps behavior consistent.',
    time: '1 hr. ago',
    votes: 14,
  },
  {
    id: 2,
    author: 'u/frontendAce',
    body: 'I would also keep sort + dropdown logic centralized in one utility so each page behaves the same.',
    time: '42 min. ago',
    votes: 9,
  },
]

const getUsernameFromAuthor = (author) => author.replace(/^u\//, '')

export function PostPage() {
  const { communityname, postId } = useParams()
  const [post, setPost] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setIsLoading(true)
    fetch(`/api/posts/${postId}`)
      .then(res => {
        if (!res.ok) throw new Error('Post not found')
        return res.json()
      })
      .then(data => {
        setPost(data)
        setIsLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setIsLoading(false)
      })
  }, [postId])

  const communitySlug = decodeURIComponent(communityname ?? 'community').toLowerCase()

  if (isLoading) return <main className='post-page'><p style={{ textAlign: 'center', padding: '2rem' }}>Loading post...</p></main>
  if (error || !post) return <main className='post-page'><p style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>Error: {error}</p></main>

  return (
    <main className='post-page'>
      <section className='post-page-shell'>
        <div className='post-page-main'>
          <article className='post-page-card'>
            <header className='post-page-header'>
              <img src={avatar} alt='Community avatar' className='post-page-avatar' />
              <div className='post-page-meta'>
                <Link to={`/community/${encodeURIComponent(post.communitySlug)}`}>
                  r/{post.communitySlug}
                </Link>
                <span>&middot;</span>
                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                <span>&middot;</span>
                <Link
                  to={`/user/${encodeURIComponent(post.authorName)}`}
                >
                  Posted by u/{post.authorName}
                </Link>
              </div>
            </header>

            <h1>{post.title}</h1>
            {post.body && <p>{post.body}</p>}

            {(post.imageUrl || post.linkUrl) && (
              post.imageUrl ? (
                <img src={post.imageUrl} alt='Post media' className='post-page-image' />
              ) : (
                <a href={post.linkUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', margin: '1rem 0', color: '#0066cc', textDecoration: 'underline' }}>{post.linkUrl}</a>
              )
            )}

            <footer className='post-page-actions'>
              <button type='button' className='post-chip post-chip-vote'>
                <FaCaretUp className='post-chip-vote-icon' />
                <span>{post.votes}</span>
                <FaCaretDown className='post-chip-vote-icon' />
              </button>
              <button type='button' className='post-chip'>
                <FaComment /> {post.commentsCount}
              </button>
              <button type='button' className='post-chip'>
                <FaShare /> Share
              </button>
            </footer>
          </article>

          <section className='post-comments'>
            <h2>Comments</h2>
            {COMMENTS.map((comment) => (
              <article key={comment.id} className='post-comment-card'>
                <header>
                  <Link
                    to={`/user/${encodeURIComponent(getUsernameFromAuthor(comment.author))}`}
                  >
                    {comment.author}
                  </Link>
                  <span>{comment.time}</span>
                </header>
                <p>{comment.body}</p>
                <footer>
                  <button type='button'>
                    <FaCaretUp />
                  </button>
                  <span>{comment.votes}</span>
                  <button type='button'>
                    <FaCaretDown />
                  </button>
                </footer>
              </article>
            ))}
          </section>
        </div>

        <aside className='post-page-side'>
          <section className='post-page-side-card'>
            <h3>About r/{communitySlug}</h3>
            <p>
              Pagina de postare foloseste ruta dinamica pentru comunitate si id-ul
              postarii. Datele reale vor fi conectate din backend.
            </p>
          </section>
        </aside>
      </section>
    </main>
  )
}