import { Link } from 'react-router-dom'
import { FaCaretUp, FaCaretDown, FaComment, FaShare } from 'react-icons/fa'
import avatar from './img/avatar.webp'
import { normalizeImageSrc } from './utils/media'

const getCommunitySlug = (community) => community.replace(/^r\//, '')
const getSavedPostRoute = (item) =>
  `/community/${encodeURIComponent(getCommunitySlug(item.community))}/post/${item.postId}`

export function ProfileSavedTab({
  items,
  hasSaved,
  openMoreSavedId,
  onMenuOpen,
}) {
  if (!hasSaved) {
    return (
      <section className='tab-panel'>
        <div className='feed-filter'>
          <span>Saved items</span>
        </div>
        <div className='feed-empty'>
          <div className='feed-empty-icon'>&#9673;</div>
          <h2>Nothing saved yet</h2>
          <p>
            When you save a post or comment, it will appear here so you can find
            it easily later.
          </p>
          <Link to='/' className='profile-btn profile-btn-primary'>
            Explore communities
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className='tab-panel'>
      <div className='feed-filter'>
        <span>Saved items</span>
      </div>
      <div className='profile-posts-list'>
        {items.map((item) =>
          item.type === 'post' ? (
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
                      aria-expanded={openMoreSavedId === item.id}
                      aria-haspopup='menu'
                      aria-label='Saved item options'
                    >
                      ...
                    </button>
                  </div>
                </header>

                <div className='pp-post-body'>
                  <h3 className='pp-post-title'>
                    <Link
                      to={getSavedPostRoute(item)}
                      className='pp-post-title-link'
                    >
                      {item.title}
                    </Link>
                  </h3>
                  <p className='pp-post-text'>{item.text}</p>
                  {item.image && (
                    <div className='pp-post-media'>
                      <Link
                        to={getSavedPostRoute(item)}
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
                  <div className='pp-action-chip pp-vote-chip'>
                    <FaCaretUp className='pp-vote-icon pp-upvote' />
                    <span className='pp-vote-count'>{item.votes}</span>
                    <FaCaretDown className='pp-vote-icon pp-downvote' />
                  </div>
                  <Link to={getSavedPostRoute(item)} className='pp-action-chip'>
                    <FaComment className='pp-comment-icon' />
                    <span className='pp-comment-count'>{item.comments}</span>
                  </Link>
                </footer>
              </div>
            </article>
          ) : (
            <article className='pc-comment-card' key={item.id}>
              <div className='pc-card-header'>
                <img src={avatar} alt='Avatar' className='pc-avatar' />
                <div className='pc-header-meta'>
                  <Link
                    to={`/community/${encodeURIComponent(getCommunitySlug(item.community))}`}
                    className='pc-community-link'
                  >
                    {item.community}
                  </Link>
                  <span className='pc-meta-sep'>&middot;</span>
                  <Link
                    to={getSavedPostRoute(item)}
                    className='pc-post-title-link'
                  >
                    {item.postTitle}
                  </Link>
                </div>
                <span className='pc-time'>{item.time}</span>

                <div className='pc-comment-actions'>
                  <button
                    type='button'
                    className='pp-more-button'
                    onClick={(e) => onMenuOpen(e, item.id)}
                    aria-expanded={openMoreSavedId === item.id}
                    aria-haspopup='menu'
                    aria-label='Saved item options'
                  >
                    ...
                  </button>
                </div>
              </div>

              <Link to={getSavedPostRoute(item)} className='pc-body-link'>
                <p className='pc-content'>{item.content}</p>
              </Link>

              <div className='pc-footer'>
                <div className='pp-action-chip pp-vote-chip'>
                  <FaCaretUp className='pp-vote-icon pp-upvote' />
                  <span className='pp-vote-count'>{item.votes}</span>
                  <FaCaretDown className='pp-vote-icon pp-downvote' />
                </div>
                <Link to={getSavedPostRoute(item)} className='pp-action-chip'>
                  <FaComment className='pp-comment-icon' />
                  <span>Reply</span>
                </Link>
                <button type='button' className='pp-action-chip'>
                  <FaShare className='pp-comment-icon' />
                  <span>Share</span>
                </button>
              </div>
            </article>
          ),
        )}
      </div>
    </section>
  )
}
