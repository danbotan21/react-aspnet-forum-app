import { Link } from 'react-router-dom'
import { FaCaretUp, FaCaretDown, FaComment, FaShare } from 'react-icons/fa'
import avatar from './img/avatar.webp'

const getCommunitySlug = (community) => community.replace(/^r\//, '')
const getCommentPostRoute = (comment) =>
  `/community/${encodeURIComponent(getCommunitySlug(comment.community))}/post/${comment.postId}`

export function ProfileCommentsTab({
  comments,
  hasComments,
  openMoreCommentId,
  onMenuOpen,
  isOwnProfile,
}) {
  if (isOwnProfile && !hasComments) {
    return (
      <section className='tab-panel'>
        <div className='feed-filter'>
          <span>Showing all comments</span>
        </div>
        <div className='feed-empty'>
          <div className='feed-empty-icon'>0</div>
          <h2>No comments yet</h2>
          <p>
            When you share your thoughts on a post in any community, your
            comments will appear here.
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
        <span>Showing all comments</span>
      </div>
      <div className='profile-comments-list'>
        {comments.map((comment) => (
          <article className='pc-comment-card' key={comment.id}>
            <div className='pc-card-header'>
              <img src={avatar} alt='Community' className='pc-avatar' />
              <div className='pc-header-meta'>
                <Link
                  to={`/community/${encodeURIComponent(getCommunitySlug(comment.community))}`}
                  className='pc-community-link'
                >
                  {comment.community}
                </Link>
                <span className='pc-meta-sep'>&middot;</span>
                <Link
                  to={getCommentPostRoute(comment)}
                  className='pc-post-title-link'
                >
                  {comment.postTitle}
                </Link>
              </div>
              <span className='pc-time'>{comment.time}</span>
              {isOwnProfile && (
                <div className='pc-comment-actions'>
                  <button
                    type='button'
                    className='pp-more-button'
                    onClick={(e) => onMenuOpen(e, comment.id)}
                    aria-expanded={openMoreCommentId === comment.id}
                    aria-haspopup='menu'
                    aria-label='Comment options'
                  >
                    ...
                  </button>
                </div>
              )}
            </div>

            <Link to={getCommentPostRoute(comment)} className='pc-body-link'>
              <p className='pc-content'>{comment.content}</p>
            </Link>

            <div className='pc-footer'>
              <div className='pp-action-chip pp-vote-chip'>
                <FaCaretUp className='pp-vote-icon pp-upvote' />
                <span className='pp-vote-count'>{comment.votes}</span>
                <FaCaretDown className='pp-vote-icon pp-downvote' />
              </div>
              <Link
                to={getCommentPostRoute(comment)}
                className='pp-action-chip'
              >
                <FaComment className='pp-comment-icon' />
                <span>Reply</span>
              </Link>
              <button type='button' className='pp-action-chip'>
                <FaShare className='pp-comment-icon' />
                <span>Share</span>
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
