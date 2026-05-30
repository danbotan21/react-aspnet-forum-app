import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  FaCaretDown,
  FaCaretUp,
  FaComment,
  FaEdit,
  FaFlag,
  FaShare,
  FaTrash,
} from 'react-icons/fa'
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
import { uploadImage } from './utils/imageUpload'
import { ReportModal } from './ReportModal'

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
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, token } = useAuth()

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
  const [reportTarget, setReportTarget] = useState(null) // { type: 0|1, id, label }
  const [isCommunityOwner, setIsCommunityOwner] = useState(false)
  const [isCommunityModerator, setIsCommunityModerator] = useState(false)
  const [isBanned, setIsBanned] = useState(false)

  const [showDeletePostModal, setShowDeletePostModal] = useState(false)
  const [isDeletingPost, setIsDeletingPost] = useState(false)
  const [deletePostError, setDeletePostError] = useState('')
  const [confirmDeleteCommentId, setConfirmDeleteCommentId] = useState(null)
  const [isDeletingComment, setIsDeletingComment] = useState(false)

  // ── Edit post state ───────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editBody, setEditBody] = useState('')
  const [editLinkUrl, setEditLinkUrl] = useState('')
  const [editImageFile, setEditImageFile] = useState(null)
  const [editImagePreview, setEditImagePreview] = useState('')
  const [editImageRemoved, setEditImageRemoved] = useState(false)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [editError, setEditError] = useState('')
  const editFileInputRef = useRef(null)

  const isAuthor =
    user?.userName &&
    post?.authorName &&
    user.userName.toLowerCase() === post.authorName.toLowerCase()

  // Global admins can moderate any content directly from the app.
  const isAdmin = user?.role === 'Admin'

  // Auto-enter edit mode when navigated with ?edit=true
  useEffect(() => {
    if (searchParams.get('edit') === 'true' && isAuthor && post && !isEditing) {
      setEditTitle(post.title || '')
      setEditBody(post.body || '')
      setEditLinkUrl(post.linkUrl || '')
      setEditImageFile(null)
      setEditImagePreview('')
      setEditImageRemoved(false)
      setEditError('')
      setIsEditing(true)
      // Remove ?edit=true from URL to avoid re-triggering
      searchParams.delete('edit')
      setSearchParams(searchParams, { replace: true })
    }
  }, [isAuthor, post, searchParams, setSearchParams, isEditing])

  useEffect(() => {
    setIsLoading(true)
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    fetch(`/api/posts/${postId}`, { headers })
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
  }, [postId, token])

  useEffect(() => {
    setIsLoadingComments(true)
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    fetch(`/api/comments/post/${postId}`, { headers })
      .then((response) => {
        if (!response.ok) throw new Error('Failed to load comments')
        return response.json()
      })
      .then((data) => {
        const normalizedComments = data
          .map(normalizeComment)
          .sort(
            (left, right) =>
              new Date(left.createdAt).getTime() -
              new Date(right.createdAt).getTime(),
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
    if (!token || !post?.id) {
      setPostVote({ id: null, type: 0 })
      return
    }

    let cancelled = false

    fetchUserPostVotes([post.id], token).then((votesMap) => {
      if (!cancelled) {
        setPostVote(votesMap[post.id] || { id: null, type: 0 })
      }
    })

    return () => {
      cancelled = true
    }
  }, [post?.id, token])

  useEffect(() => {
    if (!token || !post?.id) {
      setSavedPostEntry(null)
      return
    }

    let cancelled = false

    fetchUserSavedPosts([post.id], token).then((savedMap) => {
      if (!cancelled) {
        setSavedPostEntry(savedMap[post.id] ?? null)
      }
    })

    return () => {
      cancelled = true
    }
  }, [post?.id, token])

  useEffect(() => {
    if (!token || comments.length === 0) {
      setCommentVotesById({})
      return
    }

    let cancelled = false

    fetchUserCommentVotes(
      comments.map((comment) => comment.id),
      token,
    ).then((votesMap) => {
      if (!cancelled) {
        setCommentVotesById(votesMap)
      }
    })

    return () => {
      cancelled = true
    }
  }, [comments, token])

  useEffect(() => {
    if (!post?.communitySlug) return

        if (!user?.id) {
          setIsCommunityMember(false)
          setIsCommunityOwner(false)
          setIsCommunityModerator(false)
          setIsBanned(false)
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
                setIsCommunityOwner(false)
                setIsCommunityModerator(false)
                setIsBanned(false)
                setIsMembershipResolved(true)
              }
              return
            }

            const community = await communityResponse.json()
            const [memberResponse, ownerResponse, roleResponse, banResponse] = await Promise.all([
              fetch(`/api/communities/${community.id}/ismember?userId=${user.id}`),
              fetch(`/api/communities/${community.id}/isowner?userId=${user.id}`),
              token
                ? fetch(`/api/communities/${community.id}/myrole`, {
                    headers: { Authorization: `Bearer ${token}` },
                  })
                : Promise.resolve({ ok: false }),
              token
                ? fetch(`/api/communities/${community.id}/mybannedstatus`, {
                    headers: { Authorization: `Bearer ${token}` },
                  })
                : Promise.resolve({ ok: false }),
            ])

            if (!memberResponse.ok || !ownerResponse.ok) {
              if (!cancelled) {
                setIsCommunityMember(false)
                setIsCommunityOwner(false)
                setIsCommunityModerator(false)
                setIsBanned(false)
                setIsMembershipResolved(true)
              }
              return
            }

            const [membershipValue, ownerValue] = await Promise.all([
              memberResponse.json(),
              ownerResponse.json(),
            ])

            let moderatorValue = false
            if (roleResponse.ok) {
              const roleData = await roleResponse.json()
              moderatorValue = roleData?.role === 'moderator' || roleData?.role === 'owner'
            }

            let bannedValue = false
            if (banResponse.ok) {
              const banData = await banResponse.json()
              bannedValue = banData?.isBanned === true
            }

            if (!cancelled) {
              setIsCommunityMember(membershipValue === true)
              setIsCommunityOwner(ownerValue === true)
              setIsCommunityModerator(moderatorValue)
              setIsBanned(bannedValue)
              setIsMembershipResolved(true)
            }
          } catch {
            if (!cancelled) {
              setIsCommunityMember(false)
              setIsCommunityOwner(false)
              setIsCommunityModerator(false)
              setIsBanned(false)
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
        comment.parentCommentId &&
        existingCommentIds.has(comment.parentCommentId)
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
            new Date(left.createdAt).getTime() -
            new Date(right.createdAt).getTime(),
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
    if (!token || !post?.id) {
      alert('Please login to vote.')
      return
    }
    if (isBanned) {
      alert('You are banned from this community and cannot interact.')
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
          ? {
              ...currentPost,
              votes: (currentPost.votes ?? 0) - previousVoteType,
            }
          : currentPost,
      )
      setPostVote({ id: null, type: 0 })

      try {
        await deletePostVote({ voteId: previousVote.id, token })
      } catch (voteError) {
        setPost((currentPost) =>
          currentPost
            ? {
                ...currentPost,
                votes: (currentPost.votes ?? 0) + previousVoteType,
              }
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
        token,
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
    if (!token) {
      alert('Please login to vote.')
      return
    }
    if (isBanned) {
      alert('You are banned from this community and cannot interact.')
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
        await deleteCommentVote({ voteId: previousVote.id, token })
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
        token,
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
    if (!token || !post?.id) {
      alert('Please login to save posts.')
      return
    }
    if (isBanned) {
      alert('You are banned from this community.')
      return
    }
    if (isPostSavePending) return

    const previousSavedEntry = savedPostEntry
    setIsPostSavePending(true)

    try {
      if (previousSavedEntry?.id) {
        setSavedPostEntry(null)
        await unsaveItem({ savedItemId: previousSavedEntry.id, token })
      } else {
        const createdSavedItem = await savePost({ postId: post.id, token })
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

  // ── Edit post handlers ──────────────────────────────────────
  const handleStartEdit = () => {
    setEditTitle(post.title || '')
    setEditBody(post.body || '')
    setEditLinkUrl(post.linkUrl || '')
    setEditImageFile(null)
    setEditImagePreview('')
    setEditImageRemoved(false)
    setEditError('')
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditError('')
    setEditImageFile(null)
    if (editImagePreview) URL.revokeObjectURL(editImagePreview)
    setEditImagePreview('')
    setEditImageRemoved(false)
  }

  const handleEditImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) {
      setEditError('Please select a valid image file.')
      return
    }
    if (editImagePreview) URL.revokeObjectURL(editImagePreview)
    setEditImageFile(file)
    setEditImagePreview(URL.createObjectURL(file))
    setEditImageRemoved(false)
    setEditError('')
  }

  const handleEditImageRemove = () => {
    setEditImageFile(null)
    if (editImagePreview) URL.revokeObjectURL(editImagePreview)
    setEditImagePreview('')
    setEditImageRemoved(true)
    if (editFileInputRef.current) editFileInputRef.current.value = ''
  }

  const handleSaveEdit = async () => {
    if (!token || !post?.id) return

    const trimmedTitle = editTitle.trim()
    if (!trimmedTitle) {
      setEditError('Title cannot be empty.')
      return
    }

    setIsSavingEdit(true)
    setEditError('')

    try {
      let finalImageUrl = post.imageUrl ?? post.ImageUrl ?? null

      if (editImageFile) {
        finalImageUrl = await uploadImage(editImageFile, 'posts')
      } else if (editImageRemoved) {
        finalImageUrl = null
      }

      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: trimmedTitle,
          body: editBody.trim() || null,
          imageUrl: finalImageUrl,
          linkUrl: editLinkUrl.trim() || null,
        }),
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || 'Failed to update post.')
      }

      const updatedPost = await response.json()
      setPost(updatedPost)
      setIsEditing(false)
      setEditImageFile(null)
      if (editImagePreview) URL.revokeObjectURL(editImagePreview)
      setEditImagePreview('')
      setEditImageRemoved(false)
    } catch (saveEditError) {
      setEditError(saveEditError.message)
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleDeletePost = async () => {
    if (!token || !post?.id) return
    setIsDeletingPost(true)
    setDeletePostError('')
    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || 'Failed to delete post.')
      }
      navigate(`/community/${encodeURIComponent(post.communitySlug)}`)
    } catch (err) {
      setDeletePostError(err.message)
      setIsDeletingPost(false)
    }
  }

  const handleCreateComment = async (parentCommentId = null) => {
    if (!token) {
      alert('Please login to comment.')
      return
    }

    if (isBanned) {
      alert('You are banned from this community and cannot comment.')
      return
    }

    if (!isCommunityMember) {
      alert('You need to join this community before commenting.')
      return
    }

    const draft = parentCommentId
      ? (replyDraftByCommentId[parentCommentId] ?? '')
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
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          body: trimmedComment,
          postId: Number(postId),
          parentCommentId,
        }),
      })

      if (!response.ok) {
        const message = await parseErrorText(
          response,
          'Failed to create comment',
        )
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
        setReplyDraftByCommentId((current) => ({
          ...current,
          [parentCommentId]: '',
        }))
        setOpenReplyBoxByCommentId((current) => ({
          ...current,
          [parentCommentId]: false,
        }))
        setExpandedCommentIds((current) => ({
          ...current,
          [parentCommentId]: true,
        }))
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

  const handleDeleteComment = async (commentId) => {
    if (!token) return
    setIsDeletingComment(true)
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) {
        const msg = await parseErrorText(response, 'Failed to delete comment')
        throw new Error(msg)
      }
      setComments((prev) => prev.filter((c) => c.id !== commentId))
      setConfirmDeleteCommentId(null)
      setPost((current) =>
        current
          ? {
              ...current,
              commentsCount: Math.max((current.commentsCount ?? 1) - 1, 0),
            }
          : current,
      )
    } catch (err) {
      alert(err.message)
    } finally {
      setIsDeletingComment(false)
    }
  }

  const renderCommentThread = (comment, depth = 0) => {
    const childComments = commentsByParentId.get(comment.id) || []
    const hasReplies = childComments.length > 0
    const areRepliesExpanded = expandedCommentIds[comment.id] === true
    const isReplyBoxOpen = openReplyBoxByCommentId[comment.id] === true
    const isReplySubmitting = submittingReplyByCommentId[comment.id] === true
    const nestingLevel = Math.min(depth, 6)
    const isOwnComment =
      user?.userName &&
      comment.authorName !== '[deleted]' &&
      user.userName.toLowerCase() === comment.authorName.toLowerCase()

    return (
      <div
        key={comment.id}
        className='post-comment-thread-node'
        style={{ marginLeft: nestingLevel * 18 }}
      >
        <article className='post-comment-card'>
          <header>
            {comment.authorName === '[deleted]' ? (
              <span>u/[deleted]</span>
            ) : (
              <Link to={`/user/${encodeURIComponent(comment.authorName)}`}>
                u/{comment.authorName}
              </Link>
            )}
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
              disabled={
                !user?.id || (isMembershipResolved && !isCommunityMember)
              }
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

            {user && !isOwnComment && !isBanned && (
              <button
                type='button'
                className='post-chip post-comment-inline-btn post-chip-danger'
                onClick={() =>
                  setReportTarget({ type: 1, id: comment.id, label: 'Comment' })
                }
              >
                <FaFlag /> Report
              </button>
            )}

            {(isOwnComment || isCommunityOwner || isCommunityModerator || isAdmin) &&
              (confirmDeleteCommentId === comment.id ? (
                <span className='post-comment-delete-confirm'>
                  <span className='post-comment-delete-label'>Delete?</span>
                  <button
                    type='button'
                    className='post-chip post-chip-delete post-comment-inline-btn'
                    onClick={() => handleDeleteComment(comment.id)}
                    disabled={isDeletingComment}
                  >
                    {isDeletingComment ? '...' : 'Yes'}
                  </button>
                  <button
                    type='button'
                    className='post-chip post-comment-inline-btn'
                    onClick={() => setConfirmDeleteCommentId(null)}
                    disabled={isDeletingComment}
                  >
                    No
                  </button>
                </span>
              ) : (
                <button
                  type='button'
                  className='post-chip post-comment-inline-btn post-comment-delete-btn'
                  onClick={() => setConfirmDeleteCommentId(comment.id)}
                >
                  <FaTrash /> Delete
                </button>
              ))}
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
                <Link
                  to={`/community/${encodeURIComponent(post.communitySlug)}`}
                >
                  r/{post.communitySlug}
                </Link>
                <span>&middot;</span>
                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                <span>&middot;</span>
                {post.authorName === '[deleted]' ? (
                  <span>Posted by u/[deleted]</span>
                ) : (
                  <Link to={`/user/${encodeURIComponent(post.authorName)}`}>
                    Posted by u/{post.authorName}
                  </Link>
                )}
              </div>
            </header>

            {isEditing ? (
              <div className='post-edit-form'>
                {editError && <p className='post-edit-error'>{editError}</p>}
                <label className='post-edit-label' htmlFor='edit-title'>
                  Title
                </label>
                <input
                  id='edit-title'
                  type='text'
                  className='post-edit-input'
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder='Post title'
                  disabled={isSavingEdit}
                />

                <label className='post-edit-label' htmlFor='edit-body'>
                  Body
                </label>
                <textarea
                  id='edit-body'
                  className='post-edit-textarea'
                  rows={6}
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  placeholder='Post body (optional)'
                  disabled={isSavingEdit}
                />

                {(post.linkUrl || editLinkUrl) && (
                  <>
                    <label className='post-edit-label' htmlFor='edit-link'>
                      Link URL
                    </label>
                    <input
                      id='edit-link'
                      type='url'
                      className='post-edit-input'
                      value={editLinkUrl}
                      onChange={(e) => setEditLinkUrl(e.target.value)}
                      placeholder='https://...'
                      disabled={isSavingEdit}
                    />
                  </>
                )}

                <label className='post-edit-label'>Image</label>
                <div className='post-edit-image-section'>
                  {!editImageRemoved && (editImagePreview || postImageSrc) ? (
                    <div className='post-edit-image-preview'>
                      <img
                        src={editImagePreview || postImageSrc}
                        alt='Post media'
                        className='post-page-image'
                      />
                      <div className='post-edit-image-overlay'>
                        <button
                          type='button'
                          className='post-chip post-edit-img-btn'
                          onClick={() => editFileInputRef.current?.click()}
                          disabled={isSavingEdit}
                        >
                          Change Image
                        </button>
                        <button
                          type='button'
                          className='post-chip post-edit-img-btn post-edit-img-btn-remove'
                          onClick={handleEditImageRemove}
                          disabled={isSavingEdit}
                        >
                          Remove Image
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type='button'
                      className='post-chip post-edit-img-add'
                      onClick={() => editFileInputRef.current?.click()}
                      disabled={isSavingEdit}
                    >
                      + Add Image
                    </button>
                  )}
                  <input
                    ref={editFileInputRef}
                    type='file'
                    accept='image/*'
                    onChange={handleEditImageChange}
                    style={{ display: 'none' }}
                  />
                </div>

                <div className='post-edit-actions'>
                  <button
                    type='button'
                    className='post-chip post-edit-save'
                    onClick={handleSaveEdit}
                    disabled={isSavingEdit}
                  >
                    {isSavingEdit ? 'Saving...' : 'Save Edit'}
                  </button>
                  <button
                    type='button'
                    className='post-chip'
                    onClick={handleCancelEdit}
                    disabled={isSavingEdit}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
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
              </>
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
              {isAuthor && !isEditing && (
                <button
                  type='button'
                  className='post-chip post-chip-edit'
                  onClick={handleStartEdit}
                >
                  <FaEdit /> Edit
                </button>
              )}
              {(isAuthor || isCommunityOwner || isAdmin) && !isEditing && (
                <button
                  type='button'
                  className='post-chip post-chip-delete'
                  onClick={() => {
                    setDeletePostError('')
                    setShowDeletePostModal(true)
                  }}
                >
                  <FaTrash /> Delete
                </button>
              )}
              <button type='button' className='post-chip'>
                <FaShare /> Share
              </button>
              {user && post?.authorName !== user?.userName && !isBanned && (
                <button
                  type='button'
                  className='post-chip post-chip-danger'
                  onClick={() => setReportTarget({ type: 0, id: post.id, label: 'Post' })}
                >
                  <FaFlag /> Report
                </button>
              )}
            </footer>
          </article>

          {!isEditing && (
            <section className='post-comments'>
              <h2>Comments</h2>
              <div style={{ marginBottom: '12px' }}>
                <textarea
                  rows={3}
                  placeholder={
                    !user?.id
                      ? 'Login to comment...'
                      : isBanned
                        ? 'You are banned from this community.'
                        : isMembershipResolved && !isCommunityMember
                          ? 'Join community to comment...'
                          : 'Write a comment...'
                  }
                  value={newCommentText}
                  onChange={(event) => setNewCommentText(event.target.value)}
                  disabled={
                    !user?.id || isBanned || (isMembershipResolved && !isCommunityMember)
                  }
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
          )}
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

      {showDeletePostModal && (
        <div className='post-delete-overlay'>
          <div className='post-delete-modal'>
            <h2 className='post-delete-modal-title'>Delete post?</h2>
            <p className='post-delete-modal-body'>
              Are you sure you want to delete this post? This cannot be undone.
            </p>
            {deletePostError && (
              <p className='post-delete-modal-error'>{deletePostError}</p>
            )}
            <div className='post-delete-modal-actions'>
              <button
                type='button'
                className='post-chip post-chip-delete'
                onClick={handleDeletePost}
                disabled={isDeletingPost}
              >
                {isDeletingPost ? 'Deleting...' : 'Delete'}
              </button>
              <button
                type='button'
                className='post-chip'
                onClick={() => setShowDeletePostModal(false)}
                disabled={isDeletingPost}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {reportTarget && (
        <ReportModal
          type={reportTarget.type}
          reportedItemId={reportTarget.id}
          label={reportTarget.label}
          token={token}
          onClose={() => setReportTarget(null)}
        />
      )}
    </main>
  )
}
