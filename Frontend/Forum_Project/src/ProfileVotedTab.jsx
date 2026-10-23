import { Link } from 'react-router-dom'
import { FaCaretUp, FaCaretDown, FaComment } from 'react-icons/fa'
import avatar from './img/avatar.webp'
import { normalizeImageSrc } from './utils/media'

const getCommunitySlug = (community) => community.replace(/^r\//, '')
const getVotedPostRoute = (item) =>
  `/community/${encodeURIComponent(getCommunitySlug(item.community))}/post/${item.postId}`

export function ProfileVotedTab({
  items,
  voteType,
  hasVoted,
  filterLabel,
  openId,
  onMenuOpen,
  token,
  postVotesById,
  pendingPostVotes,
  onVote,
}) {
  if (!hasVoted) {
    return (
      <section className='tab-panel'>
        <div className='feed-filter'>
          <span>{filterLabel}</span>
        </div>
        <div className='feed-empty'>
          <div className='feed-empty-icon'>
            {voteType === 'up' ? '\u25B3' : '\u25BD'}
          </div>
          <h2>
            {voteType === 'up' ? 'No upvoted posts' : 'No downvoted posts'}
          </h2>
          <p>
            {voteType === 'up'
              ? 'Posts you upvote will appear here so you can find them again easily.'
              : 'Posts you downvote will appear here so you can track your votes.'}
          </p>
          <Link to='/home' className='profile-btn profile-btn-primary'>
            Explore Feed
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className='tab-panel'>
      <div className='feed-filter'>
        <span>{filterLabel}</span>
      </div>
      <div className='profile-posts-list'>
        {items.map((item) => (
          <article className='profile-post' key={item.id}>
            <div className='pp-post-main'>
              <header className='pp-post-header'>
                <Link to={`/community/${encodeURIComponent(getCommunitySlug(item.community))}`}>
                  <img src={normalizeImageSrc(item.communityAvatarUrl) || avatar} alt='Community' className='pp-avatar' />
                </Link>
                <div className='pp-post-meta'>
                  <Link
                    to={`/community/${encodeURIComponent(getCommunitySlug(item.community))}`}
                    className='pp-community-link'
                  >
                    {item.community}
                  </Link>
                  <span className='pp-meta-sep'>&middot;</span>
                  <span className='pp-time'>{item.time}</span>
                  <span className='pp-meta-sep'>&middot;</span>
                  <Link
                    to={`/user/${encodeURIComponent(item.author.replace(/^u\//, ''))}`}
                    className='pp-author-link'
                  >
                    {item.author}
                  </Link>
                </div>
                <div className='pp-post-actions'>
                  <button
                    type='button'
                    className='pp-more-button'
                    onClick={(e) => onMenuOpen(e, item.id)}
                    aria-expanded={openId === item.id}
                    aria-haspopup='menu'
                    aria-label='Post options'
                  >
                    ...
                  </button>
                </div>
              </header>

              <div className='pp-post-body'>
                <h3 className='pp-post-title'>
                  <Link
                    to={getVotedPostRoute(item)}
                    className='pp-post-title-link'
                  >
                    {item.title}
                  </Link>
                </h3>
                <p className='pp-post-text'>{item.text}</p>
                {item.image && (
                  <div className='pp-post-media'>
                    <Link
                      to={getVotedPostRoute(item)}
                      className='pp-post-media-link'
                    >
                      <img
                        src={item.image}
                        alt='Post content'
                        className='pp-post-img'
                      />
                    </Link>
                  </div>
                )}
              </div>

              <footer className='pp-post-footer'>
                {(() => {
                  const currentType =
                    postVotesById?.[item.postId]?.type ??
                    (voteType === 'up' ? 1 : -1)
                  const interactive = Boolean(token && onVote)
                  const isPending = pendingPostVotes?.[item.postId]
                  const chipStyle = interactive
                    ? {
                        pointerEvents: isPending ? 'none' : 'auto',
                        opacity: isPending ? 0.4 : 1,
                        cursor: 'pointer',
                      }
                    : undefined
                  return (
                    <div
                      className={`pp-action-chip pp-vote-chip ${
                        currentType === 1
                          ? 'vote-chip-upvoted'
                          : currentType === -1
                            ? 'vote-chip-downvoted'
                            : ''
                      }`}
                    >
                      <FaCaretUp
                        className={`pp-vote-icon pp-upvote ${currentType === 1 ? 'pp-upvote-active' : ''}`}
                        onClick={() => interactive && onVote(item.postId, 'up')}
                        style={chipStyle}
                      />
                      <span className='pp-vote-count'>{item.votes}</span>
                      <FaCaretDown
                        className={`pp-vote-icon pp-downvote ${currentType === -1 ? 'pp-downvote-active' : ''}`}
                        onClick={() =>
                          interactive && onVote(item.postId, 'down')
                        }
                        style={chipStyle}
                      />
                    </div>
                  )
                })()}
                <Link to={getVotedPostRoute(item)} className='pp-action-chip'>
                  <FaComment className='pp-comment-icon' />
                  <span className='pp-comment-count'>{item.comments}</span>
                </Link>
              </footer>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
