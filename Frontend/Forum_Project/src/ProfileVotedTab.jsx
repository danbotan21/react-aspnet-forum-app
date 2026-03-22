import { Link } from 'react-router-dom'
import { FaCaretUp, FaCaretDown, FaComment } from 'react-icons/fa'
import avatar from './img/avatar.webp'

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
          <Link to='/' className='profile-btn profile-btn-primary'>
            Browse communities
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
                <img src={avatar} alt='Avatar' className='pp-avatar' />
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
                <div
                  className={`pp-action-chip pp-vote-chip ${
                    voteType === 'up'
                      ? 'vote-chip-upvoted'
                      : 'vote-chip-downvoted'
                  }`}
                >
                  <FaCaretUp
                    className={`pp-vote-icon ${
                      voteType === 'up'
                        ? 'pp-upvote pp-upvote-active'
                        : 'pp-upvote'
                    }`}
                  />
                  <span className='pp-vote-count'>{item.votes}</span>
                  <FaCaretDown
                    className={`pp-vote-icon ${
                      voteType === 'down'
                        ? 'pp-downvote pp-downvote-active'
                        : 'pp-downvote'
                    }`}
                  />
                </div>
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
