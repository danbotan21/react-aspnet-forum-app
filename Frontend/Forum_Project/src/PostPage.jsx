import { Link, useParams } from 'react-router-dom'
import { FaCaretDown, FaCaretUp, FaComment, FaShare } from 'react-icons/fa'
import './Styles/PostPage.css'
import avatar from './img/avatar.webp'
import { normalizeImageSrc } from './utils/media'
import { useAuth } from './AuthContext'
import {
  deleteCommentVote,
  deletePostVote,
  fetchUserCommentVotes,
  fetchUserPostVotes,
  submitCommentVote,
  submitPostVote,
  voteValueFromDirection,
} from './utils/voteApi'

import { useState, useEffect } from 'react'

export function PostPage() {
  const { communityname, postId } = useParams()
  const { user } = useAuth()
  const [post, setPost] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [comments, setComments] = useState([])
  const [isLoadingComments, setIsLoadingComments] = useState(true)
  const [newCommentText, setNewCommentText] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [postVote, setPostVote] = useState({ id: null, type: 0 })
  const [commentVotesById, setCommentVotesById] = useState({})
  const [isPostVotePending, setIsPostVotePending] = useState(false)
  const [pendingCommentVotes, setPendingCommentVotes] = useState({})

  useEffect(() => {
    setIsLoading(true)
    fetch(`/api/posts/${postId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Post not found')
        return res.json()
      })
      .then((data) => {
        setPost(data)
        setIsLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setIsLoading(false)
      })
  }, [postId])

  useEffect(() => {
    setIsLoadingComments(true)
    fetch(`/api/comments/post/${postId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load comments')
        return res.json()
      })
      .then((data) => {
        setComments(data)
        setIsLoadingComments(false)
      })
      .catch((err) => {
        console.error(err)
        setIsLoadingComments(false)
      })
  }, [postId])

  useEffect(() => {
    if (!user?.id || !post?.id) {
      setPostVote({ id: null, type: 0 })
      return
    }

    let cancelled = false
    fetchUserPostVotes([post.id], user.id).then((votesMap) => {
      if (!cancelled) {
        setPostVote(votesMap[post.id] || { id: null, type: 0 })
      }
    })

    return () => {
      cancelled = true
    }
  }, [post?.id, user?.id])

  useEffect(() => {
    if (!user?.id || comments.length === 0) {
      setCommentVotesById({})
      return
    }

    let cancelled = false
    fetchUserCommentVotes(
      comments.map((comment) => comment.id || comment.ID),
      user.id,
    ).then((votesMap) => {
      if (!cancelled) {
        setCommentVotesById(votesMap)
      }
    })

    return () => {
      cancelled = true
    }
  }, [comments, user?.id])

  const communitySlug = decodeURIComponent(
    communityname ?? 'community',
  ).toLowerCase()
  const postImageSrc = normalizeImageSrc(post?.imageUrl ?? post?.ImageUrl)

  const handlePostVote = async (direction) => {
    if (!user?.id || !post?.id) {
      alert('Please login to vote.')
      return
    }
    if (isPostVotePending) return

    const nextVoteType = voteValueFromDirection(direction)
    const previousVote = postVote || { id: null, type: 0 }
    const previousVoteType = previousVote.type ?? 0

    if (previousVoteType === nextVoteType && !previousVote.id) return

    setIsPostVotePending(true)

    if (previousVoteType === nextVoteType && previousVote.id) {
      setPost((currentPost) =>
        currentPost
          ? { ...currentPost, votes: (currentPost.votes ?? 0) - previousVoteType }
          : currentPost,
      )
      setPostVote({ id: null, type: 0 })

      try {
        await deletePostVote({ voteId: previousVote.id, userId: user.id })
      } catch (voteError) {
        setPost((currentPost) =>
          currentPost
            ? { ...currentPost, votes: (currentPost.votes ?? 0) + previousVoteType }
            : currentPost,
        )
        setPostVote(previousVote)
        alert(voteError.message)
      } finally {
        setIsPostVotePending(false)
      }
      return
    }

    const voteDelta = nextVoteType - previousVoteType

    setPost((currentPost) =>
      currentPost ? { ...currentPost, votes: (currentPost.votes ?? 0) + voteDelta } : currentPost,
    )
    setPostVote((currentVote) => ({ ...currentVote, type: nextVoteType }))

    try {
      const vote = await submitPostVote({
        postId: post.id,
        voteType: nextVoteType,
        userId: user.id,
      })
      setPostVote({ id: vote.id, type: vote.type })
    } catch (voteError) {
      setPost((currentPost) =>
        currentPost
          ? { ...currentPost, votes: (currentPost.votes ?? 0) - voteDelta }
          : currentPost,
      )
      setPostVote((currentVote) => ({ ...currentVote, type: previousVoteType }))
      alert(voteError.message)
    } finally {
      setIsPostVotePending(false)
    }
  }

  const handleCommentVote = async (commentId, direction) => {
    if (!user?.id) {
      alert('Please login to vote.')
      return
    }
    if (pendingCommentVotes[commentId]) return

    const nextVoteType = voteValueFromDirection(direction)
    const previousVote = commentVotesById[commentId] || { id: null, type: 0 }
    const previousVoteType = previousVote.type ?? 0

    if (previousVoteType === nextVoteType && !previousVote.id) return

    setPendingCommentVotes((currentPending) => ({
      ...currentPending,
      [commentId]: true,
    }))

    if (previousVoteType === nextVoteType && previousVote.id) {
      setComments((currentComments) =>
        currentComments.map((comment) =>
          (comment.id || comment.ID) === commentId
            ? {
                ...comment,
                votes:
                  (comment.votes ?? comment.Votes ?? 0) - previousVoteType,
              }
            : comment,
        ),
      )
      setCommentVotesById((currentVotes) => ({
        ...currentVotes,
        [commentId]: { id: null, type: 0 },
      }))

      try {
        await deleteCommentVote({ voteId: previousVote.id, userId: user.id })
      } catch (voteError) {
        setComments((currentComments) =>
          currentComments.map((comment) =>
            (comment.id || comment.ID) === commentId
              ? {
                  ...comment,
                  votes:
                    (comment.votes ?? comment.Votes ?? 0) + previousVoteType,
                }
              : comment,
          ),
        )
        setCommentVotesById((currentVotes) => ({
          ...currentVotes,
          [commentId]: previousVote,
        }))
        alert(voteError.message)
      } finally {
        setPendingCommentVotes((currentPending) => ({
          ...currentPending,
          [commentId]: false,
        }))
      }
      return
    }

    const voteDelta = nextVoteType - previousVoteType

    setComments((currentComments) =>
      currentComments.map((comment) =>
        (comment.id || comment.ID) === commentId
          ? { ...comment, votes: (comment.votes ?? comment.Votes ?? 0) + voteDelta }
          : comment,
      ),
    )
    setCommentVotesById((currentVotes) => ({
      ...currentVotes,
      [commentId]: { ...(currentVotes[commentId] || {}), type: nextVoteType },
    }))

    try {
      const vote = await submitCommentVote({
        commentId,
        voteType: nextVoteType,
        userId: user.id,
      })
      setCommentVotesById((currentVotes) => ({
        ...currentVotes,
        [commentId]: { id: vote.id, type: vote.type },
      }))
    } catch (voteError) {
      setComments((currentComments) =>
        currentComments.map((comment) =>
          (comment.id || comment.ID) === commentId
            ? { ...comment, votes: (comment.votes ?? comment.Votes ?? 0) - voteDelta }
            : comment,
        ),
      )
      setCommentVotesById((currentVotes) => ({
        ...currentVotes,
        [commentId]: {
          ...(currentVotes[commentId] || {}),
          type: previousVoteType,
        },
      }))
      alert(voteError.message)
    } finally {
      setPendingCommentVotes((currentPending) => ({
        ...currentPending,
        [commentId]: false,
      }))
    }
  }

  const handleCreateComment = async () => {
    if (!user?.id) {
      alert('Please login to comment.')
      return
    }

    const trimmedComment = newCommentText.trim()
    if (!trimmedComment) return

    setIsSubmittingComment(true)

    try {
      const response = await fetch(`/api/comments?authorId=${user.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          body: trimmedComment,
          postId: Number(postId),
          parentCommentId: null,
        }),
      })

      if (!response.ok) throw new Error('Failed to create comment')

      const createdComment = await response.json()
      setComments((currentComments) => [...currentComments, createdComment])
      setPost((currentPost) =>
        currentPost
          ? {
              ...currentPost,
              commentsCount: (currentPost.commentsCount ?? 0) + 1,
            }
          : currentPost,
      )
      setNewCommentText('')
    } catch (submitError) {
      alert(submitError.message)
    } finally {
      setIsSubmittingComment(false)
    }
  }

  if (isLoading)
    return (
      <main className='post-page'>
        <p style={{ textAlign: 'center', padding: '2rem' }}>Loading post...</p>
      </main>
    )
  if (error || !post)
    return (
      <main className='post-page'>
        <p style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>
          Error: {error}
        </p>
      </main>
    )

  return (
    <main className='post-page'>
      <section className='post-page-shell'>
        <div className='post-page-main'>
          <article className='post-page-card'>
            <header className='post-page-header'>
              <img
                src={avatar}
                alt='Community avatar'
                className='post-page-avatar'
              />
              <div className='post-page-meta'>
                <Link
                  to={`/community/${encodeURIComponent(post.communitySlug)}`}
                >
                  r/{post.communitySlug}
                </Link>
                <span>&middot;</span>
                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                <span>&middot;</span>
                <Link to={`/user/${encodeURIComponent(post.authorName)}`}>
                  Posted by u/{post.authorName}
                </Link>
              </div>
            </header>

            <h1>{post.title}</h1>
            {post.body && <p>{post.body}</p>}

            {postImageSrc && (
                <img
                  src={postImageSrc}
                  alt='Post media'
                  className='post-page-image'
                />
            )}

            {post.linkUrl && (
              <a
                href={post.linkUrl}
                target='_blank'
                rel='noopener noreferrer'
                style={{
                  display: 'block',
                  margin: '1rem 0',
                  color: '#0066cc',
                  textDecoration: 'underline',
                }}
              >
                {post.linkUrl}
              </a>
            )}

            <footer className='post-page-actions'>
              <button type='button' className='post-chip post-chip-vote'>
                <FaCaretUp
                  className={`post-chip-vote-icon ${postVote.type === 1 ? 'active upvote' : 'upvote'}`}
                  onClick={() => handlePostVote('up')}
                  style={{
                    pointerEvents: isPostVotePending ? 'none' : 'auto',
                    opacity: isPostVotePending ? 0.6 : 1,
                  }}
                />
                <span>{post.votes}</span>
                <FaCaretDown
                  className={`post-chip-vote-icon ${postVote.type === -1 ? 'active downvote' : 'downvote'}`}
                  onClick={() => handlePostVote('down')}
                  style={{
                    pointerEvents: isPostVotePending ? 'none' : 'auto',
                    opacity: isPostVotePending ? 0.6 : 1,
                  }}
                />
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
            <div style={{ marginBottom: '12px' }}>
              <textarea
                rows={3}
                placeholder='Write a comment...'
                value={newCommentText}
                onChange={(event) => setNewCommentText(event.target.value)}
                style={{
                  width: '100%',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                  borderRadius: '8px',
                  border: '1px solid #d7e1ef',
                  padding: '10px',
                  resize: 'vertical',
                }}
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  marginTop: '8px',
                }}
              >
                <button
                  type='button'
                  className='post-chip post-comment-submit'
                  onClick={handleCreateComment}
                  disabled={isSubmittingComment}
                >
                  {isSubmittingComment ? 'Posting...' : 'Comment'}
                </button>
              </div>
            </div>

            {isLoadingComments ? (
              <p>Loading comments...</p>
            ) : comments.length === 0 ? (
              <p>No comments yet.</p>
            ) : (
              comments.map((comment) => {
                const commentId = comment.id || comment.ID
                const commentBody = comment.body || comment.Body
                const commentVotes = comment.votes ?? comment.Votes ?? 0
                const commentAuthor = comment.authorName || comment.AuthorName
                const commentCreatedAt = comment.createdAt || comment.CreatedAt

                return (
                  <article key={commentId} className='post-comment-card'>
                    <header>
                      <Link to={`/user/${encodeURIComponent(commentAuthor)}`}>
                        u/{commentAuthor}
                      </Link>
                      <span>{new Date(commentCreatedAt).toLocaleString()}</span>
                    </header>
                    <p>{commentBody}</p>
                    <footer>
                      <button
                        type='button'
                        onClick={() => handleCommentVote(commentId, 'up')}
                        disabled={pendingCommentVotes[commentId]}
                      >
                        <FaCaretUp
                          className={`post-comment-vote-icon upvote ${
                            commentVotesById[commentId]?.type === 1 ? 'active' : ''
                          }`}
                        />
                      </button>
                      <span>{commentVotes}</span>
                      <button
                        type='button'
                        onClick={() => handleCommentVote(commentId, 'down')}
                        disabled={pendingCommentVotes[commentId]}
                      >
                        <FaCaretDown
                          className={`post-comment-vote-icon downvote ${
                            commentVotesById[commentId]?.type === -1 ? 'active' : ''
                          }`}
                        />
                      </button>
                    </footer>
                  </article>
                )
              })
            )}
          </section>
        </div>

        <aside className='post-page-side'>
          <section className='post-page-side-card'>
            <h3>About r/{communitySlug}</h3>
            <p>
              Pagina de postare foloseste ruta dinamica pentru comunitate si
              id-ul postarii. Datele reale vor fi conectate din backend.
            </p>
          </section>
        </aside>
      </section>
    </main>
  )
}
