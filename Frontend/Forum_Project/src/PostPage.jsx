import { Link, useParams } from 'react-router-dom'
import { FaCaretDown, FaCaretUp, FaComment, FaShare } from 'react-icons/fa'
import './Styles/PostPage.css'
import avatar from './img/avatar.webp'
import coding from './img/coding.jpg'
import nature from './img/nature.jpg'

const POST_LIBRARY = {
  'frontend-1': {
    title: 'How would you design a modern forum homepage?',
    body: 'I am working on a frontend forum project and would love feedback on layout, typography, and interactions. What patterns from Reddit-style communities do you think are essential?',
    image: coding,
    author: 'u/exampleUser',
    time: '6 hours ago',
    votes: 324,
    comments: 67,
  },
  'frontend-2': {
    title: 'What is your preferred structure for reusable React cards?',
    body: 'I want better composition for list cards and details cards. Curious what naming and folder conventions you use in larger apps.',
    image: nature,
    author: 'u/designPilot',
    time: '8 hours ago',
    votes: 211,
    comments: 39,
  },
  'webdev-3': {
    title: 'Best way to keep feed interactions consistent across pages',
    body: 'We currently duplicate feed UI in multiple routes. Looking for an approach that keeps style and behavior perfectly aligned.',
    image: coding,
    author: 'u/devFlow',
    time: '11 hours ago',
    votes: 189,
    comments: 24,
  },
}

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

  const communitySlug = decodeURIComponent(communityname ?? 'frontend').toLowerCase()
  const key = `${communitySlug}-${postId}`

  const fallbackPost = {
    title: `Post #${postId}`,
    body: 'Continutul complet al postarii va fi populat din backend. Aceasta este o pagina statica de preview pentru ruta de detaliu.',
    image: coding,
    author: 'u/unknownUser',
    time: 'recently',
    votes: 0,
    comments: 0,
  }

  const post = POST_LIBRARY[key] ?? fallbackPost

  return (
    <main className='post-page'>
      <section className='post-page-shell'>
        <div className='post-page-main'>
          <article className='post-page-card'>
            <header className='post-page-header'>
              <img src={avatar} alt='Community avatar' className='post-page-avatar' />
              <div className='post-page-meta'>
                <Link to={`/community/${encodeURIComponent(communitySlug)}`}>
                  r/{communitySlug}
                </Link>
                <span>&middot;</span>
                <span>{post.time}</span>
                <span>&middot;</span>
                <Link
                  to={`/user/${encodeURIComponent(getUsernameFromAuthor(post.author))}`}
                >
                  Posted by {post.author}
                </Link>
              </div>
            </header>

            <h1>{post.title}</h1>
            <p>{post.body}</p>

            <img src={post.image} alt='Post media' className='post-page-image' />

            <footer className='post-page-actions'>
              <button type='button' className='post-chip post-chip-vote'>
                <FaCaretUp className='post-chip-vote-icon' />
                <span>{post.votes}</span>
                <FaCaretDown className='post-chip-vote-icon' />
              </button>
              <button type='button' className='post-chip'>
                <FaComment /> {post.comments}
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