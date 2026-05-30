import { useEffect, useMemo, useState } from 'react'
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
import { fetchUserSavedPosts, savePost, unsaveItem } from './utils/savedItemApi'

const normalizeComment = (rawComment) => ({
  id: rawComment.id ?? rawComment.ID,
  body: rawComment.body ?? rawComment.Body ?? '',
  votes: rawComment.votes ?? rawComment.Votes ?? 0,
  createdAt: rawComment.createdAt ?? rawComment.CreatedAt ?? null,
  authorName: rawComment.authorName ?? rawComment.AuthorName ?? 'unknown',
  postId: rawComment.postId ?? rawComment.PostId,
  parentCommentId:
    rawComment.parentCommentId ?? rawComment.ParentCommentId ?? null,
})

const parseErrorText = async (response, fallbackMessage) => {
  const text = (await response.text()).trim()
  if (!text) return fallbackMessage
  return text.replace(/^"+|"+$/g, '')
}

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
  const [replyDraftByCommentId, setReplyDraftByCommentId] = useState({})
  const [openReplyBoxByCommentId, setOpenReplyBoxByCommentId] = useState({})
  const [submittingReplyByCommentId, setSubmittingReplyByCommentId] = useState(
    {},
  )
  const [expandedCommentIds, setExpandedCommentIds] = useState({})

  const [postVote, setPostVote] = useState({ id: null, type: 0 })
  const [commentVotesById, setCommentVotesById] = useState({})
  const [isPostVotePending, setIsPostVotePending] = useState(false)
  const [pendingCommentVotes, setPendingCommentVotes] = useState({})

  const [savedPostEntry, setSavedPostEntry] = useState(null)
  const [isPostSavePending, setIsPostSavePending] = useState(false)
  const [isCommunityMember, setIsCommunityMember] = useState(false)
  const [isMembershipResolved, setIsMembershipResolved] = useState(false)

  useEffect(() => {
    setIsLoading(true)
    fetch(`/api/posts/${postId}`)
      .then((response) => {
        if (!response.ok) throw new Error('Post not found')
        return response.json()
      })
      .then((data) => {
        setPost(data)
        setIsLoading(false)
      })
      .catch((fetchError) => {
        setError(fetchError.message)
        setIsLoading(false)
      })
  }, [postId])

  useEffect(() => {
    setIsLoadingComments(true)
    fetch(`/api/comments/post/${postId}`)
      .then((response) => {
        if (!response.ok) throw new Error('Failed to load comments')
        return response.json()
      })
      .then((data) => {
        const normalizedComments = data
          .map(normalizeComment)
          .sort(
            (left, right) =>
              new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
          )
        setComments(normalizedComments)
        setIsLoadingComments(false)
      })
      .catch((fetchError) => {
        console.error(fetchError)
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
    if (!user?.id || !post?.id) {
      setSavedPostEntry(null)
      return
    }

    let cancelled = false

    fetchUserSavedPosts([post.id], user.id).then((savedMap) => {
      if (!cancelled) {
        setSavedPostEntry(savedMap[post.id] ?? null)
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
      comments.map((comment) => comment.id),
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

  useEffect(() => {
    if (!post?.communitySlug) return

    if (!user?.id) {
      setIsCommunityMember(false)
      setIsMembershipResolved(true)
      return
    }

    let cancelled = false
    setIsMembershipResolved(false)

    const resolveMembership = async () => {
      try {
        const communityResponse = await fetch(
          `/api/communities/${encodeURIComponent(post.communitySlug)}`,
        )
        if (!communityResponse.ok) {
          if (!cancelled) {
            setIsCommunityMember(false)
            setIsMembershipResolved(true)
          }
          return
        }

        const community = await communityResponse.json()
        const memberResponse = await fetch(
          `/api/communities/${community.id}/ismember?userId=${user.id}`,
        )
        if (!memberResponse.ok) {
          if (!cancelled) {
            setIsCommunityMember(false)
            setIsMembershipResolved(true)
          }
          return
        }

        const membershipValue = await memberResponse.json()
        if (!cancelled) {
          setIsCommunityMember(membershipValue === true)
          setIsMembershipResolved(true)
        }
      } catch {
        if (!cancelled) {
          setIsCommunityMember(false)
          setIsMembershipResolved(true)
        }
      }
    }

    resolveMembership()

    return () => {
      cancelled = true
    }
  }, [post?.communitySlug, user?.id])

  const commentsByParentId = useMemo(() => {
    const map = new Map()
    const existingCommentIds = new Set(comments.map((comment) => comment.id))

    for (const comment of comments) {
      const validParentId =
        comment.parentCommentId && existingCommentIds.has(comment.parentCommentId)
          ? comment.parentCommentId
          : 0

      const parentBucket = map.get(validParentId) || []
      parentBucket.push(comment)
      map.set(validParentId, parentBucket)
    }

    for (const [key, value] of map.entries()) {
      map.set(
        key,
        [...value].sort(
          (left, right) =>
            new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
        ),
      )
    }

    return map
  }, [comments])

  const topLevelComments = commentsByParentId.get(0) || []

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
      currentPost
        ? { ...currentPost, votes: (currentPost.votes ?? 0) + voteDelta }
        : currentPost,
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
          comment.id === commentId
            ? { ...comment, votes: (comment.votes ?? 0) - previousVoteType }
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
            comment.id === commentId
              ? { ...comment, votes: (comment.votes ?? 0) + previousVoteType }
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
        comment.id === commentId
          ? { ...comment, votes: (comment.votes ?? 0) + voteDelta }
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
          comment.id === commentId
            ? { ...comment, votes: (comment.votes ?? 0) - voteDelta }
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

  const handleToggleSavePost = async () => {
    if (!user?.id || !post?.id) {
      alert('Please login to save posts.')
      return
    }
    if (isPostSavePending) return

    const previousSavedEntry = savedPostEntry
    setIsPostSavePending(true)

    try {
      if (previousSavedEntry?.id) {
        setSavedPostEntry(null)
        await unsaveItem({ savedItemId: previousSavedEntry.id, userId: user.id })
      } else {
        const createdSavedItem = await savePost({ postId: post.id, userId: user.id })
        setSavedPostEntry({
          id: createdSavedItem.id,
          postId: createdSavedItem.postId,
        })
      }
    } catch (saveError) {
      setSavedPostEntry(previousSavedEntry)
      alert(saveError.message)
    } finally {
      setIsPostSavePending(false)
    }
  }

  const handleCreateComment = async (parentCommentId = null) => {
    if (!user?.id) {
      alert('Please login to comment.')
      return
    }

    if (!isCommunityMember) {
      alert('You need to join this community before commenting.')
      return
    }

    const draft = parentCommentId
      ? replyDraftByCommentId[parentCommentId] ?? ''
      : newCommentText
    const trimmedComment = draft.trim()
    if (!trimmedComment) return

    if (parentCommentId) {
      setSubmittingReplyByCommentId((current) => ({
        ...current,
        [parentCommentId]: true,
      }))
    } else {
      setIsSubmittingComment(true)
    }

    try {
      const response = await fetch(`/api/comments?authorId=${user.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          body: trimmedComment,
          postId: Number(postId),
          parentCommentId,
        }),
      })

      if (!response.ok) {
        const message = await parseErrorText(response, 'Failed to create comment')
        throw new Error(message)
      }

      const createdComment = normalizeComment(await response.json())
      setComments((currentComments) => [...currentComments, createdComment])
      setPost((currentPost) =>
        currentPost
          ? {
              ...currentPost,
              commentsCount: (currentPost.commentsCount ?? 0) + 1,
            }
          : currentPost,
      )

      if (parentCommentId) {
        setReplyDraftByCommentId((current) => ({ ...current, [parentCommentId]: '' }))
        setOpenReplyBoxByCommentId((current) => ({
          ...current,
          [parentCommentId]: false,
        }))
        setExpandedCommentIds((current) => ({ ...current, [parentCommentId]: true }))
      } else {
        setNewCommentText('')
      }
    } catch (submitError) {
      alert(submitError.message)
    } finally {
      if (parentCommentId) {
        setSubmittingReplyByCommentId((current) => ({
          ...current,
          [parentCommentId]: false,
        }))
      } else {
        setIsSubmittingComment(false)
      }
    }
  }

  const renderCommentThread = (comment, depth = 0) => {
    const childComments = commentsByParentId.get(comment.id) || []
    const hasReplies = childComments.length > 0
    const areRepliesExpanded = expandedCommentIds[comment.id] === true
    const isReplyBoxOpen = openReplyBoxByCommentId[comment.id] === true
    const isReplySubmitting = submittingReplyByCommentId[comment.id] === true
    const nestingLevel = Math.min(depth, 6)

    return (
      <div
        key={comment.id}
        className='post-comment-thread-node'
        style={{ marginLeft: nestingLevel * 18 }}
      >
        <article className='post-comment-card'>
          <header>
            <Link to={`/user/${encodeURIComponent(comment.authorName)}`}>
              u/{comment.authorName}
            </Link>
            <span>{new Date(comment.createdAt).toLocaleString()}</span>
          </header>

          {hasReplies ? (
            <button
              type='button'
              className='post-comment-body-toggle'
              onClick={() =>
                setExpandedCommentIds((current) => ({
                  ...current,
                  [comment.id]: !current[comment.id],
                }))
              }
            >
              {comment.body}
            </button>
          ) : (
            <p>{comment.body}</p>
          )}

          <div className='post-comment-actions-row'>
            <footer>
              <button
                type='button'
                onClick={() => handleCommentVote(comment.id, 'up')}
                disabled={pendingCommentVotes[comment.id]}
              >
                <FaCaretUp
                  className={`post-comment-vote-icon upvote ${
                    commentVotesById[comment.id]?.type === 1 ? 'active' : ''
                  }`}
                />
              </button>
              <span>{comment.votes}</span>
              <button
                type='button'
                onClick={() => handleCommentVote(comment.id, 'down')}
                disabled={pendingCommentVotes[comment.id]}
              >
                <FaCaretDown
                  className={`post-comment-vote-icon downvote ${
                    commentVotesById[comment.id]?.type === -1 ? 'active' : ''
                  }`}
                />
              </button>
            </footer>

            <button
              type='button'
              className='post-chip post-comment-inline-btn'
              onClick={() =>
                setOpenReplyBoxByCommentId((current) => ({
                  ...current,
                  [comment.id]: !current[comment.id],
                }))
              }
              disabled={!user?.id || (isMembershipResolved && !isCommunityMember)}
            >
              Reply
            </button>

            {hasReplies && (
              <button
                type='button'
                className='post-chip post-comment-inline-btn'
                onClick={() =>
                  setExpandedCommentIds((current) => ({
                    ...current,
                    [comment.id]: !current[comment.id],
                  }))
                }
              >
                {areRepliesExpanded
                  ? `Hide replies (${childComments.length})`
                  : `View replies (${childComments.length})`}
              </button>
            )}
          </div>

          {isReplyBoxOpen && (
            <div className='post-reply-box'>
              <textarea
                rows={2}
                placeholder='Write a reply...'
                value={replyDraftByCommentId[comment.id] ?? ''}
                onChange={(event) =>
                  setReplyDraftByCommentId((current) => ({
                    ...current,
                    [comment.id]: event.target.value,
                  }))
                }
              />
              <div className='post-reply-actions'>
                <button
                  type='button'
                  className='post-chip post-comment-submit'
                  onClick={() => handleCreateComment(comment.id)}
                  disabled={
                    isReplySubmitting ||
                    !user?.id ||
                    (isMembershipResolved && !isCommunityMember)
                  }
                >
                  {isReplySubmitting ? 'Posting...' : 'Reply'}
                </button>
                <button
                  type='button'
                  className='post-chip'
                  onClick={() =>
                    setOpenReplyBoxByCommentId((current) => ({
                      ...current,
                      [comment.id]: false,
                    }))
                  }
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </article>

        {hasReplies && areRepliesExpanded && (
          <div className='post-comment-children'>
            {childComments.map((childComment) =>
              renderCommentThread(childComment, depth + 1),
            )}
          </div>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <main className='post-page'>
        <p style={{ textAlign: 'center', padding: '2rem' }}>Loading post...</p>
      </main>
    )
  }

  if (error || !post) {
    return (
      <main className='post-page'>
        <p style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>
          Error: {error}
        </p>
      </main>
    )
  }

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
                <Link to={`/community/${encodeURIComponent(post.communitySlug)}`}>
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
              <img src={postImageSrc} alt='Post media' className='post-page-image' />
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
              <button
                type='button'
                className='post-chip'
                onClick={handleToggleSavePost}
                disabled={isPostSavePending}
              >
                {savedPostEntry?.id ? 'Unsave' : 'Save'}
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
                placeholder={
                  !user?.id
                    ? 'Login to comment...'
                    : isMembershipResolved && !isCommunityMember
                      ? 'Join community to comment...'
                      : 'Write a comment...'
                }
                value={newCommentText}
                onChange={(event) => setNewCommentText(event.target.value)}
                disabled={!user?.id || (isMembershipResolved && !isCommunityMember)}
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
                  onClick={() => handleCreateComment(null)}
                  disabled={
                    isSubmittingComment ||
                    !user?.id ||
                    (isMembershipResolved && !isCommunityMember)
                  }
                >
                  {!user?.id
                    ? 'Login to comment'
                    : isMembershipResolved && !isCommunityMember
                      ? 'Join to comment'
                      : isSubmittingComment
                        ? 'Posting...'
                        : 'Comment'}
                </button>
              </div>
            </div>

            {isLoadingComments ? (
              <p>Loading comments...</p>
            ) : comments.length === 0 ? (
              <p>No comments yet.</p>
            ) : (
              topLevelComments.map((topLevelComment) =>
                renderCommentThread(topLevelComment, 0),
              )
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
