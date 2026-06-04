import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  FaSearch,
  FaPaperPlane,
  FaImage,
  FaPaperclip,
  FaTimes,
  FaComments,
  FaEllipsisH,
  FaPen,
  FaTrash,
  FaCheckDouble,
  FaDownload,
  FaFileAlt,
} from 'react-icons/fa'
import './Styles/Messages.css'
import defaultAvatar from './img/avatar.webp'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'
import { useConfirm } from './ConfirmContext'
import { useChat } from './ChatContext'
import { normalizeImageSrc } from './utils/media'
import { uploadImage, uploadFile } from './utils/imageUpload'
import { fetchFollowing } from './utils/followApi'
import {
  fetchConversations,
  fetchMessages,
  markConversationRead,
  searchUsers,
  sendMessage,
  editMessage,
  deleteMessage,
  deleteConversation,
} from './utils/chatApi'
import { startConversation } from './utils/chatApi'

const avatarOf = (url) => normalizeImageSrc(url) || defaultAvatar

const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

const startOfDay = (d) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()

const dayLabel = (iso) => {
  const d = new Date(iso)
  const today = startOfDay(new Date())
  const that = startOfDay(d)
  const diffDays = Math.round((today - that) / 86400000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7)
    return d.toLocaleDateString([], { weekday: 'long' })
  return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })
}

// Conversation-list timestamp: time if today, else a short date.
const formatConvTime = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  const today = startOfDay(new Date())
  const that = startOfDay(d)
  const diffDays = Math.round((today - that) / 86400000)
  if (diffDays === 0) return formatTime(iso)
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' })
  return d.toLocaleDateString([], { day: '2-digit', month: '2-digit' })
}

const ChatAvatar = ({ url, isPremium }) => (
  <span className={`chat-avatar-wrap ${isPremium ? 'chat-avatar-wrap--premium' : ''}`}>
    <img src={avatarOf(url)} alt='' />
  </span>
)

export const Messages = () => {
  const { user } = useAuth()
  const toast = useToast()
  const confirm = useConfirm()
  const { subscribe, refreshUnread, notifyTyping } = useChat()
  const location = useLocation()
  const navigate = useNavigate()

  const [conversations, setConversations] = useState([])
  const [following, setFollowing] = useState([])
  const [active, setActive] = useState(null)
  const [messages, setMessages] = useState([])
  const [loadingThread, setLoadingThread] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])

  const [draft, setDraft] = useState('')
  const [pendingImage, setPendingImage] = useState(null)
  const [pendingFile, setPendingFile] = useState(null) // { fileUrl, fileName }
  const [uploading, setUploading] = useState(false)
  const [sending, setSending] = useState(false)

  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState('')
  const [menuMsgId, setMenuMsgId] = useState(null)
  const [convMenuOpen, setConvMenuOpen] = useState(false)
  const [peerTyping, setPeerTyping] = useState(false)

  const activeIdRef = useRef(null)
  const imageInputRef = useRef(null)
  const fileInputRef = useRef(null)
  const endRef = useRef(null)
  const lastTypingSentRef = useRef(0)
  const typingTimerRef = useRef(null)

  activeIdRef.current = active?.id ?? null

  const loadConversations = useCallback(async () => {
    try {
      setConversations(await fetchConversations())
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  useEffect(() => {
    if (!user?.id) return
    fetchFollowing(user.id)
      .then(setFollowing)
      .catch(() => {})
  }, [user?.id])

  const openConversation = useCallback(
    async (conv) => {
      setActive(conv)
      setMessages([])
      setPeerTyping(false)
      setConvMenuOpen(false)
      setLoadingThread(true)
      try {
        const msgs = await fetchMessages(conv.id)
        setMessages(msgs)
        if (conv.unreadCount > 0) {
          await markConversationRead(conv.id).catch(() => {})
          setConversations((prev) =>
            prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c)),
          )
          refreshUnread()
        }
      } finally {
        setLoadingThread(false)
      }
    },
    [refreshUnread],
  )

  const openWithUser = useCallback(
    async (userId) => {
      try {
        const conv = await startConversation(userId)
        setConversations((prev) =>
          prev.some((c) => c.id === conv.id) ? prev : [conv, ...prev],
        )
        setSearchTerm('')
        setSearchResults([])
        await openConversation(conv)
      } catch {
        /* ignore */
      }
    },
    [openConversation],
  )

  useEffect(() => {
    const target = location.state?.userId
    if (target) {
      openWithUser(target)
      navigate(location.pathname, { replace: true, state: null })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state])

  // user search (debounced)
  useEffect(() => {
    const term = searchTerm.trim()
    if (!term) {
      setSearchResults([])
      return
    }
    const t = setTimeout(async () => {
      try {
        const users = await searchUsers(term)
        setSearchResults(users.filter((u) => u.id !== user?.id).slice(0, 8))
      } catch {
        setSearchResults([])
      }
    }, 300)
    return () => clearTimeout(t)
  }, [searchTerm, user?.id])

  // ===== real-time =====
  useEffect(() => {
    const unsubscribe = subscribe((eventName, payload) => {
      const activeId = activeIdRef.current
      switch (eventName) {
        case 'message':
          if (payload.conversationId === activeId) {
            setMessages((prev) => [...prev, payload])
            setPeerTyping(false)
            markConversationRead(payload.conversationId)
              .then(() => refreshUnread())
              .catch(() => {})
          }
          loadConversations()
          break
        case 'read':
          if (payload.conversationId === activeId) {
            const now = new Date().toISOString()
            setMessages((prev) =>
              prev.map((m) =>
                m.senderId === user?.id && !m.readAt ? { ...m, readAt: now } : m,
              ),
            )
          }
          break
        case 'edited':
          if (payload.conversationId === activeId) {
            setMessages((prev) =>
              prev.map((m) => (m.id === payload.id ? payload : m)),
            )
          }
          loadConversations()
          break
        case 'deleted':
          if (payload.conversationId === activeId) {
            setMessages((prev) => prev.filter((m) => m.id !== payload.messageId))
          }
          loadConversations()
          break
        case 'convDeleted':
          if (payload.conversationId === activeId) {
            setActive(null)
            setMessages([])
          }
          setConversations((prev) =>
            prev.filter((c) => c.id !== payload.conversationId),
          )
          break
        case 'typing':
          if (payload.conversationId === activeId) {
            setPeerTyping(true)
            clearTimeout(typingTimerRef.current)
            typingTimerRef.current = setTimeout(() => setPeerTyping(false), 3000)
          }
          break
        default:
          break
      }
    })
    return unsubscribe
  }, [subscribe, loadConversations, refreshUnread, user?.id])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, active?.id, peerTyping])

  // Close popover menus when clicking outside.
  useEffect(() => {
    if (menuMsgId === null && !convMenuOpen) return
    const close = (e) => {
      if (
        !e.target.closest('.messages-menu-pop') &&
        !e.target.closest('.msg-actions-btn') &&
        !e.target.closest('.messages-thread-menu-btn')
      ) {
        setMenuMsgId(null)
        setConvMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [menuMsgId, convMenuOpen])

  // ===== composer =====
  const handleDraftChange = (e) => {
    setDraft(e.target.value)
    if (active) {
      const now = Date.now()
      if (now - lastTypingSentRef.current > 1800) {
        lastTypingSentRef.current = now
        notifyTyping(active.otherUserId, active.id)
      }
    }
  }

  const handlePickImage = () => imageInputRef.current?.click()
  const handlePickFile = () => fileInputRef.current?.click()

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadImage(file, 'messages')
      setPendingImage(url)
      setPendingFile(null)
    } catch {
      toast.error('Image upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    try {
      const result = await uploadFile(file, 'messages')
      setPendingFile(result)
      setPendingImage(null)
    } catch {
      toast.error('File upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const handleSend = async (e) => {
    e?.preventDefault()
    const body = draft.trim()
    if ((!body && !pendingImage && !pendingFile) || !active || sending) return

    setSending(true)
    try {
      const message = await sendMessage({
        conversationId: active.id,
        body: body || null,
        imageUrl: pendingImage || null,
        fileUrl: pendingFile?.fileUrl || null,
        fileName: pendingFile?.fileName || null,
      })
      setMessages((prev) => [...prev, message])
      setDraft('')
      setPendingImage(null)
      setPendingFile(null)
      setConversations((prev) => {
        const preview = body || (pendingImage ? '📷 Photo' : '📎 File')
        const updated = prev.map((c) =>
          c.id === active.id
            ? { ...c, lastMessagePreview: preview, lastMessageAt: message.createdAt }
            : c,
        )
        updated.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))
        return updated
      })
    } catch (err) {
      toast.error(err.message || 'Failed to send message.')
    } finally {
      setSending(false)
    }
  }

  // ===== edit / delete =====
  const startEdit = (m) => {
    setMenuMsgId(null)
    setEditingId(m.id)
    setEditDraft(m.body || '')
  }

  const saveEdit = async (m) => {
    const body = editDraft.trim()
    if (!body) return
    try {
      const updated = await editMessage(m.id, body)
      setMessages((prev) => prev.map((x) => (x.id === m.id ? updated : x)))
      setEditingId(null)
      setEditDraft('')
    } catch (err) {
      toast.error(err.message || 'Failed to edit message.')
    }
  }

  const handleDeleteMessage = async (m) => {
    setMenuMsgId(null)
    const ok = await confirm({
      title: 'Delete message?',
      message: 'This message will be permanently deleted.',
      confirmText: 'Delete',
      danger: true,
    })
    if (!ok) return
    try {
      await deleteMessage(m.id)
      setMessages((prev) => prev.filter((x) => x.id !== m.id))
      loadConversations()
    } catch (err) {
      toast.error(err.message || 'Failed to delete message.')
    }
  }

  const handleDeleteConversation = async () => {
    setConvMenuOpen(false)
    if (!active) return
    const ok = await confirm({
      title: 'Delete conversation?',
      message:
        'This will delete the entire conversation for both of you. This cannot be undone.',
      confirmText: 'Delete',
      danger: true,
    })
    if (!ok) return
    try {
      await deleteConversation(active.id)
      setConversations((prev) => prev.filter((c) => c.id !== active.id))
      setActive(null)
      setMessages([])
    } catch (err) {
      toast.error(err.message || 'Failed to delete conversation.')
    }
  }

  // index of my last message (for the read receipt)
  let lastMineIndex = -1
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].senderId === user?.id) {
      lastMineIndex = i
      break
    }
  }

  const showSearch = searchTerm.trim().length > 0

  return (
    <div className='messages-page'>
      <div className='messages-shell'>
        {/* ===== Sidebar ===== */}
        <aside className='messages-sidebar'>
          <div className='messages-sidebar-head'>
            <h1 className='messages-title'>Messages</h1>
          </div>

          <div className='messages-search'>
            <FaSearch className='messages-search-icon' />
            <input
              type='search'
              placeholder='Search people to message…'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {showSearch ? (
            <div className='messages-search-results'>
              {searchResults.length === 0 ? (
                <p className='messages-empty-hint'>No users found.</p>
              ) : (
                searchResults.map((u) => (
                  <button
                    key={u.id}
                    className='messages-people-item'
                    onClick={() => openWithUser(u.id)}
                  >
                    <ChatAvatar url={u.avatarUrl} isPremium={u.isPremium} />
                    <div className='messages-people-meta'>
                      <span className='messages-people-name'>{u.userName}</span>
                      <span className='messages-people-sub'>u/{u.userName}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : (
            <>
              {following.length > 0 && (
                <div className='messages-following'>
                  <div className='messages-section-label'>Following</div>
                  <div className='messages-following-row'>
                    {following.map((f) => (
                      <button
                        key={f.id}
                        className='messages-following-avatar'
                        title={f.userName}
                        onClick={() => openWithUser(f.id)}
                      >
                        <ChatAvatar url={f.avatarUrl} isPremium={f.isPremium} />
                        <span>{f.userName}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className='messages-section-label'>Conversations</div>
              <div className='messages-conv-list'>
                {conversations.length === 0 ? (
                  <p className='messages-empty-hint'>
                    No conversations yet. Search someone to start chatting.
                  </p>
                ) : (
                  conversations.map((c) => (
                    <button
                      key={c.id}
                      className={`messages-conv-item ${active?.id === c.id ? 'is-active' : ''}`}
                      onClick={() => openConversation(c)}
                    >
                      <ChatAvatar
                        url={c.otherUserAvatarUrl}
                        isPremium={c.otherUserIsPremium}
                      />
                      <div className='messages-conv-meta'>
                        <div className='messages-conv-top'>
                          <span className='messages-conv-name'>
                            {c.otherUserName}
                          </span>
                          <span className='messages-conv-time'>
                            {formatConvTime(c.lastMessageAt)}
                          </span>
                        </div>
                        <div className='messages-conv-bottom'>
                          <span className='messages-conv-preview'>
                            {c.lastMessagePreview || 'Say hello 👋'}
                          </span>
                          {c.unreadCount > 0 && (
                            <span className='messages-conv-badge'>
                              {c.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </aside>

        {/* ===== Thread ===== */}
        <section className='messages-thread'>
          {!active ? (
            <div className='messages-thread-empty'>
              <FaComments className='messages-thread-empty-icon' />
              <h2>Your messages</h2>
              <p>Select a conversation or search for someone to start chatting.</p>
            </div>
          ) : (
            <>
              <header className='messages-thread-head'>
                <ChatAvatar
                  url={active.otherUserAvatarUrl}
                  isPremium={active.otherUserIsPremium}
                />
                <Link
                  to={`/user/${encodeURIComponent(active.otherUserName)}`}
                  className='messages-thread-name'
                >
                  {active.otherUserName}
                </Link>
                <div className='messages-thread-menu'>
                  <button
                    type='button'
                    className='messages-thread-menu-btn'
                    onClick={() => setConvMenuOpen((p) => !p)}
                    aria-label='Conversation options'
                  >
                    <FaEllipsisH />
                  </button>
                  {convMenuOpen && (
                    <div className='messages-menu-pop'>
                      <button
                        type='button'
                        className='messages-menu-danger'
                        onClick={handleDeleteConversation}
                      >
                        <FaTrash /> Delete conversation
                      </button>
                    </div>
                  )}
                </div>
              </header>

              <div className='messages-thread-body'>
                {loadingThread ? (
                  <p className='messages-empty-hint'>Loading…</p>
                ) : messages.length === 0 ? (
                  <p className='messages-empty-hint'>No messages yet. Say hello!</p>
                ) : (
                  messages.map((m, i) => {
                    const mine = m.senderId === user?.id
                    const img = normalizeImageSrc(m.imageUrl)
                    const fileSrc = normalizeImageSrc(m.fileUrl)
                    const prev = messages[i - 1]
                    const showDay =
                      !prev ||
                      startOfDay(new Date(prev.createdAt)) !==
                        startOfDay(new Date(m.createdAt))
                    const isEditing = editingId === m.id
                    return (
                      <div key={m.id}>
                        {showDay && (
                          <div className='msg-day-sep'>
                            <span>{dayLabel(m.createdAt)}</span>
                          </div>
                        )}
                        <div className={`msg-row ${mine ? 'msg-row--mine' : ''}`}>
                          {mine && !isEditing && (
                            <div className='msg-actions'>
                              <button
                                type='button'
                                className='msg-actions-btn'
                                onClick={() =>
                                  setMenuMsgId((p) => (p === m.id ? null : m.id))
                                }
                                aria-label='Message options'
                              >
                                <FaEllipsisH />
                              </button>
                              {menuMsgId === m.id && (
                                <div className='messages-menu-pop msg-menu-pop'>
                                  {m.body && (
                                    <button type='button' onClick={() => startEdit(m)}>
                                      <FaPen /> Edit
                                    </button>
                                  )}
                                  <button
                                    type='button'
                                    className='messages-menu-danger'
                                    onClick={() => handleDeleteMessage(m)}
                                  >
                                    <FaTrash /> Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          <div className={`msg-bubble ${mine ? 'msg-bubble--mine' : ''}`}>
                            {img && (
                              <a href={img} target='_blank' rel='noopener noreferrer' className='msg-image-link'>
                                <img src={img} alt='attachment' className='msg-image' />
                              </a>
                            )}
                            {fileSrc && (
                              <a
                                href={fileSrc}
                                target='_blank'
                                rel='noopener noreferrer'
                                download={m.fileName || true}
                                className='msg-file'
                              >
                                <FaFileAlt className='msg-file-icon' />
                                <span className='msg-file-name'>
                                  {m.fileName || 'Download file'}
                                </span>
                                <FaDownload className='msg-file-dl' />
                              </a>
                            )}

                            {isEditing ? (
                              <div className='msg-edit'>
                                <input
                                  className='msg-edit-input'
                                  value={editDraft}
                                  onChange={(e) => setEditDraft(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveEdit(m)
                                    if (e.key === 'Escape') setEditingId(null)
                                  }}
                                  autoFocus
                                />
                                <div className='msg-edit-actions'>
                                  <button type='button' onClick={() => saveEdit(m)}>
                                    Save
                                  </button>
                                  <button type='button' onClick={() => setEditingId(null)}>
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              m.body && <span className='msg-text'>{m.body}</span>
                            )}

                            <span className='msg-time'>
                              {formatTime(m.createdAt)}
                              {m.editedAt && <span className='msg-edited'> · edited</span>}
                            </span>
                          </div>
                        </div>

                        {mine && i === lastMineIndex && !isEditing && (
                          <div className='msg-receipt'>
                            {m.readAt ? (
                              <>
                                <FaCheckDouble /> Seen
                              </>
                            ) : (
                              'Sent'
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
                <div ref={endRef} />
              </div>

              {peerTyping && (
                <div className='msg-typing'>
                  <span className='msg-typing-dot' />
                  <span className='msg-typing-dot' />
                  <span className='msg-typing-dot' />
                  <span className='msg-typing-label'>
                    {active.otherUserName} is typing…
                  </span>
                </div>
              )}

              {(pendingImage || pendingFile) && (
                <div className='messages-attach-preview'>
                  {pendingImage ? (
                    <img src={normalizeImageSrc(pendingImage)} alt='to send' />
                  ) : (
                    <span className='messages-attach-file'>
                      <FaFileAlt /> {pendingFile.fileName}
                    </span>
                  )}
                  <button
                    type='button'
                    onClick={() => {
                      setPendingImage(null)
                      setPendingFile(null)
                    }}
                    aria-label='Remove attachment'
                  >
                    <FaTimes />
                  </button>
                </div>
              )}

              <form className='messages-composer' onSubmit={handleSend}>
                <input ref={imageInputRef} type='file' accept='image/*' hidden onChange={handleImageChange} />
                <input ref={fileInputRef} type='file' hidden onChange={handleFileChange} />
                <button
                  type='button'
                  className='messages-composer-btn'
                  onClick={handlePickImage}
                  disabled={uploading || sending}
                  aria-label='Attach image'
                  title='Attach image'
                >
                  <FaImage />
                </button>
                <button
                  type='button'
                  className='messages-composer-btn'
                  onClick={handlePickFile}
                  disabled={uploading || sending}
                  aria-label='Attach file'
                  title='Attach file'
                >
                  <FaPaperclip />
                </button>
                <input
                  type='text'
                  className='messages-composer-input'
                  placeholder={uploading ? 'Uploading…' : 'Type a message…'}
                  value={draft}
                  onChange={handleDraftChange}
                  disabled={sending}
                />
                <button
                  type='submit'
                  className='messages-composer-send'
                  disabled={
                    sending || uploading || (!draft.trim() && !pendingImage && !pendingFile)
                  }
                  aria-label='Send'
                >
                  <FaPaperPlane />
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
