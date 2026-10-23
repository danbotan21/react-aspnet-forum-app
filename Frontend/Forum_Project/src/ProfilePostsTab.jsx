import { Link } from 'react-router-dom'
import { FaCaretUp, FaCaretDown, FaComment } from 'react-icons/fa'
import avatar from './img/avatar.webp'
import { normalizeImageSrc } from './utils/media'

const getCommunitySlug = (community) => community.replace(/^r\//, '')
const getPostRoute = (post) =>
  `/community/${encodeURIComponent(getCommunitySlug(post.community))}/post/${post.id}`

export function ProfilePostsTab({
  posts,
  hasPosts,
  openMorePostId,
  onMenuOpen,
  isOwnProfile,
  token,
  postVotesById,
  pendingPostVotes,
  onVote,
}) {
  if (isOwnProfile && !hasPosts) {
    return (
      <section className='tab-panel'>
        <div className='feed-filter'>
          <span>Showing all posts</span>
        </div>
        <div className='feed-empty'>
          <div className='feed-empty-icon'>0</div>
          <h2>You do not have any posts yet</h2>
          <p>
            Once you publish in a community, your activity will appear here.
          </p>
          <Link to='/create-post' className='profile-btn profile-btn-primary'>
            Create first post
          </Link>
        </div>
      </section>
    )
  }

  if (!isOwnProfile && !hasPosts) {
    return (
      <section className='tab-panel'>
        <div className='feed-filter'>
          <span>Showing all posts</span>
        </div>
        <div className='feed-empty'>
          <div className='feed-empty-icon'>0</div>
          <h2>This user hasn&apos;t posted anything yet</h2>
        </div>
      </section>
    )
  }

  return (
    <section className='tab-panel'>
      <div className='feed-filter'>
        <span>Showing all posts</span>
      </div>
      <div className='profile-posts-list'>
        {posts.map((post) => (
          <article className='profile-post' key={post.id}>
            <div className='pp-post-main'>
              <header className='pp-post-header'>
                <Link to={`/community/${encodeURIComponent(getCommunitySlug(post.community))}`}>
                  <img src={normalizeImageSrc(post.communityAvatarUrl) || avatar} alt='Community' className='pp-avatar' />
                </Link>
                <div className='pp-post-meta'>
                  <Link
                    to={`/community/${encodeURIComponent(getCommunitySlug(post.community))}`}
                    className='pp-community-link'
                  >
                    {post.community}
                  </Link>
                  <span className='pp-meta-sep'>&middot;</span>
                  <span className='pp-time'>{post.time}</span>
                </div>
                {isOwnProfile && (
                  <div className='pp-post-actions'>
                    <button
                      type='button'
                      className='pp-more-button'
                      onClick={(e) => onMenuOpen(e, post.id)}
                      aria-expanded={openMorePostId === post.id}
                      aria-haspopup='menu'
                      aria-label='Post options'
                    >
                      ...
                    </button>
                  </div>
                )}
              </header>

              <div className='pp-post-body'>
                <h3 className='pp-post-title'>
                  <Link to={getPostRoute(post)} className='pp-post-title-link'>
                    {post.title}
                  </Link>
                </h3>
                <p className='pp-post-text'>{post.text}</p>
                {post.image && (
                  <div className='pp-post-media'>
                    <Link
                      to={getPostRoute(post)}
                      className='pp-post-media-link'
                    >
                      <img
                        src={post.image}
                        alt='Post content'
                        className='pp-post-img'
                      />
                    </Link>
                  </div>
                )}
              </div>

              <footer className='pp-post-footer'>
                <div className='pp-action-chip pp-vote-chip'>
                  <FaCaretUp
                    className={`pp-vote-icon pp-upvote ${postVotesById?.[post.id]?.type === 1 ? 'pp-upvote-active' : ''}`}
                    onClick={() => token && onVote?.(post.id, 'up')}
                    style={{
                      pointerEvents: pendingPostVotes?.[post.id] ? 'none' : 'auto',
                      opacity: pendingPostVotes?.[post.id] ? 0.4 : 1,
                      cursor: token ? 'pointer' : 'default',
                    }}
                  />
                  <span className='pp-vote-count'>{post.votes}</span>
                  <FaCaretDown
                    className={`pp-vote-icon pp-downvote ${postVotesById?.[post.id]?.type === -1 ? 'pp-downvote-active' : ''}`}
                    onClick={() => token && onVote?.(post.id, 'down')}
                    style={{
                      pointerEvents: pendingPostVotes?.[post.id] ? 'none' : 'auto',
                      opacity: pendingPostVotes?.[post.id] ? 0.4 : 1,
                      cursor: token ? 'pointer' : 'default',
                    }}
                  />
                </div>
                <Link to={getPostRoute(post)} className='pp-action-chip'>
                  <FaComment className='pp-comment-icon' />
                  <span className='pp-comment-count'>{post.comments}</span>
                </Link>
              </footer>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
