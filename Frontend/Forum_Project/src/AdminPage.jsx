import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FaChartBar,
  FaUsers,
  FaLayerGroup,
  FaFlag,
  FaShieldAlt,
  FaBan,
  FaCheck,
  FaTrash,
  FaSearch,
  FaCrown,
  FaUserShield,
  FaExclamationTriangle,
  FaTimes,
  FaSpinner,
  FaFileAlt,
  FaComments,
  FaInbox,
  FaHistory,
  FaEnvelope,
  FaClipboardList,
  FaReply,
} from 'react-icons/fa'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'
import {
  fetchAdminStats,
  fetchAdminUsers,
  banUser,
  unbanUser,
  changeUserRole,
  fetchAdminCommunities,
  deleteCommunityAdmin,
  fetchAdminReports,
  dismissReportAdmin,
  removeReportContentAdmin,
  deleteReportAdmin,
  fetchAdminPosts,
  fetchAdminComments,
  deletePostAdmin,
  deleteCommentAdmin,
  fetchAdminMessages,
  deleteMessageAdmin,
  replyToMessageAdmin,
  fetchAdminLogs,
} from './utils/adminApi'
import { normalizeImageSrc } from './utils/media'
import './Styles/AdminPage.css'

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: FaChartBar },
  { id: 'users', label: 'Users', icon: FaUsers },
  { id: 'communities', label: 'Communities', icon: FaLayerGroup },
  { id: 'content', label: 'Content', icon: FaFileAlt },
  { id: 'reports', label: 'Reports', icon: FaFlag },
  { id: 'messages', label: 'Messages', icon: FaInbox },
  { id: 'audit', label: 'Audit Log', icon: FaHistory },
]

// Human-readable description of an admin-log action.
const ACTION_LABELS = {
  ban: 'Banned',
  unban: 'Unbanned',
  role: 'Changed role of',
  delete_post: 'Deleted post',
  delete_comment: 'Deleted comment',
  delete_community: 'Deleted community',
  report_remove: 'Removed content from report',
  report_dismiss: 'Dismissed report',
  report_discard: 'Discarded report',
  delete_message: 'Deleted message',
}

const CONTACT_TYPE_LABELS = [
  'General Inquiry',
  'Account & Authentication',
  'Communities & Moderation',
  'Report an Issue',
  'Legal Questions',
]

// ─── HELPERS ───────────────────────────────────────────────────────────────

function stringToColor(str = '') {
  const palette = ['#0f43c7', '#0e7a6e', '#7c3aed', '#b45309', '#be185d', '#065f46']
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return palette[Math.abs(hash) % palette.length]
}

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '')

function LoadingState() {
  return (
    <div className='admin-empty-state'>
      <FaSpinner className='admin-empty-icon admin-spin' />
      <p>Loading...</p>
    </div>
  )
}

function ErrorState({ message }) {
  return (
    <div className='admin-empty-state'>
      <FaExclamationTriangle className='admin-empty-icon' style={{ color: '#e74c3c' }} />
      <p>{message}</p>
    </div>
  )
}

function AdminLogRow({ entry }) {
  const label = ACTION_LABELS[entry.actionType] || entry.actionType
  return (
    <div className='admin-log-entry'>
      <div className='admin-log-icon'>
        <FaClipboardList />
      </div>
      <div className='admin-log-info'>
        <span className='admin-log-text'>
          <strong>u/{entry.actorUserName}</strong> · {label}
          {entry.targetLabel ? <> {entry.targetLabel}</> : null}
          {entry.details ? <span className='admin-log-details'> — {entry.details}</span> : null}
        </span>
        <span className='admin-log-time'>{new Date(entry.createdAt).toLocaleString()}</span>
      </div>
    </div>
  )
}

function RoleBadge({ role }) {
  if (role === 'Admin')
    return (
      <span className='admin-role-badge admin-role-admin'>
        <FaCrown className='admin-role-icon' /> Admin
      </span>
    )
  return <span className='admin-role-badge admin-role-user'>User</span>
}

function Avatar({ name, src }) {
  const img = normalizeImageSrc(src)
  if (img) return <img src={img} alt={name} className='admin-avatar-img' />
  return (
    <div className='admin-avatar' style={{ '--avatar-color': stringToColor(name) }}>
      {(name || '?')[0].toUpperCase()}
    </div>
  )
}

// ─── OVERVIEW TAB ────────────────────────────────────────────────────────────

function OverviewTab({ token, onNavigate }) {
  const [stats, setStats] = useState(null)
  const [recentLogs, setRecentLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([fetchAdminStats(token), fetchAdminLogs(token, 6).catch(() => [])])
      .then(([s, logs]) => {
        setStats(s)
        setRecentLogs(logs)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} />

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, icon: FaUsers, cls: 'admin-stat-blue' },
    { label: 'Communities', value: stats.totalCommunities, icon: FaLayerGroup, cls: 'admin-stat-purple' },
    { label: 'Posts', value: stats.totalPosts, icon: FaFileAlt, cls: 'admin-stat-teal' },
    { label: 'Comments', value: stats.totalComments, icon: FaComments, cls: 'admin-stat-green' },
    { label: 'Pending Reports', value: stats.pendingReports, icon: FaFlag, cls: 'admin-stat-orange' },
    { label: 'Banned Users', value: stats.bannedUsers, icon: FaBan, cls: 'admin-stat-red' },
  ]

  return (
    <div className='admin-tab-content'>
      <div className='admin-section-header'>
        <h2 className='admin-section-title'>Overview</h2>
        <p className='admin-section-subtitle'>
          A snapshot of the entire platform. You have control over every user, community and piece of content.
        </p>
      </div>

      <div className='admin-stats-grid'>
        {cards.map((c) => {
          const Icon = c.icon
          return (
            <div key={c.label} className={`admin-stat-card ${c.cls}`}>
              <div className='admin-stat-icon'>
                <Icon />
              </div>
              <div className='admin-stat-body'>
                <span className='admin-stat-value'>{(c.value ?? 0).toLocaleString()}</span>
                <span className='admin-stat-label'>{c.label}</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className='admin-quick-actions'>
        <h3 className='admin-subsection-title'>Quick Actions</h3>
        <div className='admin-quick-action-row'>
          <button className='admin-btn admin-btn-primary' onClick={() => onNavigate('reports')}>
            <FaFlag /> Review Reports ({stats.pendingReports})
          </button>
          <button className='admin-btn admin-btn-secondary' onClick={() => onNavigate('users')}>
            <FaUsers /> Manage Users
          </button>
          <button className='admin-btn admin-btn-secondary' onClick={() => onNavigate('communities')}>
            <FaLayerGroup /> Manage Communities
          </button>
        </div>
      </div>

      <div className='admin-quick-actions' style={{ marginTop: 20 }}>
        <div className='admin-recent-header'>
          <h3 className='admin-subsection-title' style={{ margin: 0 }}>Recent Admin Activity</h3>
          <button className='admin-link-btn' onClick={() => onNavigate('audit')}>
            View full log →
          </button>
        </div>
        {recentLogs.length === 0 ? (
          <p className='admin-muted'>No admin actions recorded yet.</p>
        ) : (
          <div className='admin-log-list'>
            {recentLogs.map((l) => (
              <AdminLogRow key={l.id} entry={l} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── USERS TAB ───────────────────────────────────────────────────────────────

function UsersTab({ token, currentUserName }) {
  const toast = useToast()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [pending, setPending] = useState({})
  const [banningId, setBanningId] = useState(null)
  const [banReason, setBanReason] = useState('')

  const load = async (term = '') => {
    try {
      setLoading(true)
      setError(null)
      setUsers(await fetchAdminUsers(token, term))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [token])

  useEffect(() => {
    const t = setTimeout(() => load(search.trim()), 350)
    return () => clearTimeout(t)
  }, [search])

  const withPending = async (id, fn) => {
    if (pending[id]) return
    setPending((p) => ({ ...p, [id]: true }))
    try {
      await fn()
      await load(search.trim())
    } catch (e) {
      toast.error(e.message)
    } finally {
      setPending((p) => ({ ...p, [id]: false }))
    }
  }

  const handleBan = (id) => {
    if (!banReason.trim()) {
      toast.error('Please provide a ban reason.')
      return
    }
    withPending(id, async () => {
      await banUser(id, banReason.trim(), token)
      setBanningId(null)
      setBanReason('')
    })
  }

  const handleUnban = (id) => withPending(id, () => unbanUser(id, token))
  const handleToggleRole = (u) =>
    withPending(u.id, () => changeUserRole(u.id, u.role === 'Admin' ? 'User' : 'Admin', token))

  const filteredUsers = users.filter((u) => {
    if (filter === 'Admins') return u.role === 'Admin'
    if (filter === 'Banned') return u.isBanned
    return true
  })

  return (
    <div className='admin-tab-content'>
      <div className='admin-section-header'>
        <h2 className='admin-section-title'>Users</h2>
        <p className='admin-section-subtitle'>
          Every registered account. Ban abusive users globally or grant/revoke admin rights.
        </p>
      </div>

      <div className='admin-search-wrap'>
        <FaSearch className='admin-search-icon' />
        <input
          className='admin-search-input'
          placeholder='Search by username or email...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className='admin-filter-bar'>
        {['All', 'Admins', 'Banned'].map((f) => (
          <button
            key={f}
            className={`admin-filter-btn ${filter === f ? 'admin-filter-active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
            {f === 'Admins' && (
              <span className='admin-filter-count'>
                {' '}
                ({users.filter((u) => u.role === 'Admin').length})
              </span>
            )}
            {f === 'Banned' && (
              <span className='admin-filter-count'>
                {' '}
                ({users.filter((u) => u.isBanned).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} />
      ) : filteredUsers.length === 0 ? (
        <div className='admin-empty-state'>
          <FaUsers className='admin-empty-icon' />
          <p>No users found.</p>
        </div>
      ) : (
        <div className='admin-user-list'>
          {filteredUsers.map((u) => {
            // Only the supreme (parent) admin may grant/revoke the Admin role.
            const amSupreme = users.some(
              (x) => x.userName === currentUserName && x.isSupremeAdmin,
            )
            return (
            <div key={u.id} className={`admin-user-card ${u.isBanned ? 'admin-user-banned' : ''}`}>
              <Avatar name={u.userName} src={u.avatarUrl} />
              <div className='admin-user-info'>
                <div className='admin-user-name-row'>
                  <Link to={`/user/${u.userName}`} className='admin-user-username'>
                    u/{u.userName}
                  </Link>
                  <RoleBadge role={u.role} />
                  {u.isBanned && (
                    <span className='admin-role-badge admin-role-banned'>
                      <FaBan className='admin-role-icon' /> Banned
                    </span>
                  )}
                </div>
                <div className='admin-user-meta'>
                  <span>{u.email}</span>
                  <span className='admin-meta-sep'>·</span>
                  <span>{u.karma?.toLocaleString()} karma</span>
                  <span className='admin-meta-sep'>·</span>
                  <span>{u.postsCount} posts</span>
                  <span className='admin-meta-sep'>·</span>
                  <span>{u.commentsCount} comments</span>
                  <span className='admin-meta-sep'>·</span>
                  <span>Joined {fmtDate(u.createdAt)}</span>
                </div>
                {u.isBanned && u.banReason && (
                  <p className='admin-ban-reason'>Ban reason: {u.banReason}</p>
                )}
              </div>

              <div className='admin-user-actions'>
                {amSupreme && !u.isSupremeAdmin && (
                  <button
                    className='admin-btn admin-btn-sm admin-btn-ghost'
                    onClick={() => handleToggleRole(u)}
                    disabled={pending[u.id] || u.isBanned}
                    title={u.isBanned ? 'Unban before changing role' : ''}
                  >
                    <FaUserShield /> {u.role === 'Admin' ? 'Revoke Admin' : 'Make Admin'}
                  </button>
                )}

                {u.isBanned ? (
                  <button
                    className='admin-btn admin-btn-sm admin-btn-secondary'
                    onClick={() => handleUnban(u.id)}
                    disabled={pending[u.id]}
                  >
                    <FaCheck /> Unban
                  </button>
                ) : u.userName === currentUserName ? (
                  <span className='admin-self-tag'>You</span>
                ) : u.role === 'Admin' ? (
                  <span className='admin-self-tag'>Protected</span>
                ) : banningId === u.id ? (
                  <div className='admin-ban-inline'>
                    <input
                      className='admin-inline-input'
                      placeholder='Ban reason...'
                      value={banReason}
                      onChange={(e) => setBanReason(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleBan(u.id)
                        if (e.key === 'Escape') {
                          setBanningId(null)
                          setBanReason('')
                        }
                      }}
                      autoFocus
                    />
                    <button
                      className='admin-btn admin-btn-sm admin-btn-danger-solid'
                      onClick={() => handleBan(u.id)}
                      disabled={pending[u.id]}
                    >
                      {pending[u.id] ? <FaSpinner className='admin-spin' /> : 'Confirm'}
                    </button>
                    <button
                      className='admin-btn admin-btn-sm admin-btn-ghost'
                      onClick={() => {
                        setBanningId(null)
                        setBanReason('')
                      }}
                    >
                      <FaTimes />
                    </button>
                  </div>
                ) : (
                  <button
                    className='admin-btn admin-btn-sm admin-btn-danger'
                    onClick={() => {
                      setBanningId(u.id)
                      setBanReason('')
                    }}
                    disabled={pending[u.id]}
                  >
                    <FaBan /> Ban
                  </button>
                )}
              </div>
            </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── COMMUNITIES TAB ──────────────────────────────────────────────────────────

function CommunitiesTab({ token }) {
  const toast = useToast()
  const [communities, setCommunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [pending, setPending] = useState({})

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      setCommunities(await fetchAdminCommunities(token))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [token])

  const handleDelete = async (c) => {
    if (
      !window.confirm(
        `Permanently delete c/${c.slug} and ALL its posts? This cannot be undone.`,
      )
    )
      return
    if (pending[c.id]) return
    setPending((p) => ({ ...p, [c.id]: true }))
    try {
      await deleteCommunityAdmin(c.id, token)
      await load()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setPending((p) => ({ ...p, [c.id]: false }))
    }
  }

  const filtered = communities.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className='admin-tab-content'>
      <div className='admin-section-header'>
        <h2 className='admin-section-title'>Communities</h2>
        <p className='admin-section-subtitle'>
          Every community on the platform. You can delete any community regardless of ownership.
        </p>
      </div>

      <div className='admin-search-wrap'>
        <FaSearch className='admin-search-icon' />
        <input
          className='admin-search-input'
          placeholder='Search communities...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} />
      ) : filtered.length === 0 ? (
        <div className='admin-empty-state'>
          <FaLayerGroup className='admin-empty-icon' />
          <p>No communities found.</p>
        </div>
      ) : (
        <div className='admin-community-list'>
          {filtered.map((c) => (
            <div key={c.id} className='admin-community-card'>
              <Avatar name={c.title} src={c.avatarUrl} />
              <div className='admin-community-info'>
                <Link to={`/community/${c.slug}`} className='admin-community-title'>
                  {c.title}
                </Link>
                <div className='admin-community-meta'>
                  <span>c/{c.slug}</span>
                  <span className='admin-meta-sep'>·</span>
                  <span>{c.membersCount} members</span>
                  <span className='admin-meta-sep'>·</span>
                  <span>{c.postsCount} posts</span>
                  {c.ownerUserName && (
                    <>
                      <span className='admin-meta-sep'>·</span>
                      <span>owner u/{c.ownerUserName}</span>
                    </>
                  )}
                  <span className='admin-meta-sep'>·</span>
                  <span>created {fmtDate(c.createdAt)}</span>
                </div>
              </div>
              <div className='admin-community-actions'>
                <Link to={`/community/${c.slug}/mod`} className='admin-btn admin-btn-sm admin-btn-ghost'>
                  <FaShieldAlt /> Mod Tools
                </Link>
                <button
                  className='admin-btn admin-btn-sm admin-btn-danger-solid'
                  onClick={() => handleDelete(c)}
                  disabled={pending[c.id]}
                >
                  {pending[c.id] ? <FaSpinner className='admin-spin' /> : <><FaTrash /> Delete</>}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── REPORTS TAB ──────────────────────────────────────────────────────────────

const STATUS_FILTERS = ['pending', 'actioned', 'dismissed', 'all']

function ReportsTab({ token, currentUserId }) {
  const toast = useToast()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [status, setStatus] = useState('pending')
  const [pending, setPending] = useState({})

  const load = async (s = status) => {
    try {
      setLoading(true)
      setError(null)
      setReports(await fetchAdminReports(token, s))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(status)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, status])

  const withPending = async (id, fn) => {
    if (pending[id]) return
    setPending((p) => ({ ...p, [id]: true }))
    try {
      await fn()
      await load(status)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setPending((p) => ({ ...p, [id]: false }))
    }
  }

  const handleDismiss = (id) => withPending(id, () => dismissReportAdmin(id, token))
  const handleRemove = (r) => {
    if (!window.confirm('Permanently remove this content? This cannot be undone.')) return
    withPending(r.id, () => removeReportContentAdmin(r.id, token))
  }
  const handleDelete = (id) => {
    if (!window.confirm('Discard this report record?')) return
    withPending(id, () => deleteReportAdmin(id, token))
  }
  const handleBanUser = (r) => {
    if (!r.contentAuthorId) return
    const reason = window.prompt(
      `Ban reason for u/${r.contentAuthorUserName}:`,
      'Banned following user reports',
    )
    if (reason === null) return
    withPending(r.id, async () => {
      await banUser(r.contentAuthorId, reason.trim() || 'Banned following user reports', token)
      await dismissReportAdmin(r.id, token)
    })
  }

  const viewLink = (r) => {
    if ((r.typeName === 'Post' || r.typeName === 'Comment') && r.communitySlug && r.postId)
      return `/community/${r.communitySlug}/post/${r.postId}`
    if (r.typeName === 'User' && r.contentAuthorUserName)
      return `/user/${r.contentAuthorUserName}`
    return null
  }

  return (
    <div className='admin-tab-content'>
      <div className='admin-section-header'>
        <h2 className='admin-section-title'>Reports</h2>
        <p className='admin-section-subtitle'>
          Every report submitted across the whole platform — posts, comments and users.
        </p>
      </div>

      <div className='admin-filter-bar'>
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            className={`admin-filter-btn ${status === s ? 'admin-filter-active' : ''}`}
            onClick={() => setStatus(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} />
      ) : reports.length === 0 ? (
        <div className='admin-empty-state'>
          <FaCheck className='admin-empty-icon' />
          <p>No reports here.</p>
        </div>
      ) : (
        <div className='admin-report-list'>
          {reports.map((r) => {
            const link = viewLink(r)
            const isOwn = currentUserId != null && r.contentAuthorId === currentUserId
            return (
              <div key={r.id} className='admin-report-card'>
                <div className='admin-report-header'>
                  <span className={`admin-type-badge admin-type-${r.typeName.toLowerCase()}`}>
                    {r.typeName}
                  </span>
                  <span className={`admin-status-badge admin-status-${r.status}`}>{r.status}</span>
                  <span className='admin-report-reason'>
                    <FaExclamationTriangle className='admin-reason-icon' /> {r.reason}
                  </span>
                  <span className='admin-report-date'>{fmtDate(r.createdAt)}</span>
                </div>

                {r.postTitle && <h4 className='admin-report-title'>{r.postTitle}</h4>}
                {r.contentPreview && <p className='admin-report-preview'>{r.contentPreview}</p>}

                <div className='admin-report-meta'>
                  <span>
                    Reported by <strong>u/{r.reporterUserName}</strong>
                  </span>
                  {r.contentAuthorUserName && (
                    <>
                      <span className='admin-meta-sep'>·</span>
                      <span>
                        {r.typeName === 'User' ? 'User' : 'Author'}:{' '}
                        <strong>u/{r.contentAuthorUserName}</strong>
                        {isOwn ? (
                          <span style={{ marginLeft: 6, padding: '1px 7px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: '#6366f1', color: '#fff' }}>
                            you
                          </span>
                        ) : r.contentAuthorIsAdmin ? (
                          <span style={{ marginLeft: 6, padding: '1px 7px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: '#7c3aed', color: '#fff' }}>
                            🛡 Admin
                          </span>
                        ) : null}
                      </span>
                    </>
                  )}
                  {r.communityName && (
                    <>
                      <span className='admin-meta-sep'>·</span>
                      <span>in c/{r.communitySlug ?? r.communityName}</span>
                    </>
                  )}
                </div>

                <div className='admin-report-actions'>
                  {link && (
                    <Link to={link} className='admin-btn admin-btn-sm admin-btn-ghost'>
                      View →
                    </Link>
                  )}
                  {r.status === 'pending' && (
                    <button
                      className='admin-btn admin-btn-sm admin-btn-ghost'
                      onClick={() => handleDismiss(r.id)}
                      disabled={pending[r.id]}
                    >
                      <FaTimes /> Dismiss
                    </button>
                  )}
                  {r.status === 'pending' && !isOwn && (r.typeName === 'Post' || r.typeName === 'Comment') && (
                    <button
                      className='admin-btn admin-btn-sm admin-btn-danger'
                      onClick={() => handleRemove(r)}
                      disabled={pending[r.id]}
                    >
                      <FaTrash /> Remove Content
                    </button>
                  )}
                  {r.status === 'pending' && !isOwn && r.typeName === 'User' && !r.contentAuthorIsAdmin && (
                    <button
                      className='admin-btn admin-btn-sm admin-btn-danger'
                      onClick={() => handleBanUser(r)}
                      disabled={pending[r.id]}
                    >
                      <FaBan /> Ban user
                    </button>
                  )}
                  {r.status !== 'pending' && (
                    <button
                      className='admin-btn admin-btn-sm admin-btn-danger-solid'
                      onClick={() => handleDelete(r.id)}
                      disabled={pending[r.id]}
                      title='Delete this resolved report record'
                    >
                      Discard Report
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── CONTENT TAB ──────────────────────────────────────────────────────────────

function ContentTab({ token }) {
  const toast = useToast()
  const [kind, setKind] = useState('posts') // 'posts' | 'comments'
  const [search, setSearch] = useState('')
  const [data, setData] = useState({ items: [], total: 0, page: 1, pageSize: 20 })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pending, setPending] = useState({})

  const load = async (k = kind, term = search, p = page) => {
    try {
      setLoading(true)
      setError(null)
      const fn = k === 'posts' ? fetchAdminPosts : fetchAdminComments
      setData(await fn(token, term.trim(), p, 20))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // Reset to page 1 whenever kind or search changes (debounced).
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1)
      load(kind, search, 1)
    }, 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, search])

  useEffect(() => {
    load(kind, search, page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const handleDelete = async (item) => {
    const what = kind === 'posts' ? 'post' : 'comment'
    if (!window.confirm(`Permanently delete this ${what}? This cannot be undone.`)) return
    if (pending[item.id]) return
    setPending((p) => ({ ...p, [item.id]: true }))
    try {
      if (kind === 'posts') await deletePostAdmin(item.id, token)
      else await deleteCommentAdmin(item.id, token)
      await load(kind, search, page)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setPending((p) => ({ ...p, [item.id]: false }))
    }
  }

  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize))

  return (
    <div className='admin-tab-content'>
      <div className='admin-section-header'>
        <h2 className='admin-section-title'>Content</h2>
        <p className='admin-section-subtitle'>
          Browse and search every post and comment on the platform. Delete anything, from any community.
        </p>
      </div>

      <div className='admin-filter-bar'>
        <button
          className={`admin-filter-btn ${kind === 'posts' ? 'admin-filter-active' : ''}`}
          onClick={() => setKind('posts')}
        >
          Posts
        </button>
        <button
          className={`admin-filter-btn ${kind === 'comments' ? 'admin-filter-active' : ''}`}
          onClick={() => setKind('comments')}
        >
          Comments
        </button>
      </div>

      <div className='admin-search-wrap'>
        <FaSearch className='admin-search-icon' />
        <input
          className='admin-search-input'
          placeholder={`Search ${kind}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} />
      ) : data.items.length === 0 ? (
        <div className='admin-empty-state'>
          <FaFileAlt className='admin-empty-icon' />
          <p>No {kind} found.</p>
        </div>
      ) : (
        <>
          <p className='admin-muted' style={{ marginBottom: 10 }}>
            {data.total.toLocaleString()} {kind} total
          </p>
          <div className='admin-content-list'>
            {kind === 'posts'
              ? data.items.map((p) => (
                  <div key={p.id} className='admin-content-card'>
                    <div className='admin-content-main'>
                      <div className='admin-content-title-row'>
                        <span className='admin-type-badge admin-type-post'>{p.type || 'post'}</span>
                        {p.communitySlug ? (
                          <Link to={`/community/${p.communitySlug}/post/${p.id}`} className='admin-content-title'>
                            {p.title}
                          </Link>
                        ) : (
                          <span className='admin-content-title'>{p.title}</span>
                        )}
                      </div>
                      {p.preview && <p className='admin-content-preview'>{p.preview}</p>}
                      <div className='admin-content-meta'>
                        <span>by u/{p.authorUserName}</span>
                        {p.communitySlug && (
                          <>
                            <span className='admin-meta-sep'>·</span>
                            <span>c/{p.communitySlug}</span>
                          </>
                        )}
                        <span className='admin-meta-sep'>·</span>
                        <span>{p.votes} votes</span>
                        <span className='admin-meta-sep'>·</span>
                        <span>{p.commentsCount} comments</span>
                        <span className='admin-meta-sep'>·</span>
                        <span>{fmtDate(p.createdAt)}</span>
                      </div>
                    </div>
                    <button
                      className='admin-btn admin-btn-sm admin-btn-danger-solid'
                      onClick={() => handleDelete(p)}
                      disabled={pending[p.id]}
                    >
                      {pending[p.id] ? <FaSpinner className='admin-spin' /> : <><FaTrash /> Delete</>}
                    </button>
                  </div>
                ))
              : data.items.map((c) => (
                  <div key={c.id} className='admin-content-card'>
                    <div className='admin-content-main'>
                      <p className='admin-content-preview'>{c.preview}</p>
                      <div className='admin-content-meta'>
                        <span>by u/{c.authorUserName}</span>
                        {c.communitySlug && c.postId ? (
                          <>
                            <span className='admin-meta-sep'>·</span>
                            <Link to={`/community/${c.communitySlug}/post/${c.postId}`} className='admin-content-link'>
                              on “{c.postTitle ?? 'post'}”
                            </Link>
                          </>
                        ) : null}
                        <span className='admin-meta-sep'>·</span>
                        <span>{c.votes} votes</span>
                        <span className='admin-meta-sep'>·</span>
                        <span>{fmtDate(c.createdAt)}</span>
                      </div>
                    </div>
                    <button
                      className='admin-btn admin-btn-sm admin-btn-danger-solid'
                      onClick={() => handleDelete(c)}
                      disabled={pending[c.id]}
                    >
                      {pending[c.id] ? <FaSpinner className='admin-spin' /> : <><FaTrash /> Delete</>}
                    </button>
                  </div>
                ))}
          </div>

          {totalPages > 1 && (
            <div className='admin-pagination'>
              <button
                className='admin-btn admin-btn-sm admin-btn-ghost'
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                ← Prev
              </button>
              <span className='admin-page-indicator'>
                Page {page} of {totalPages}
              </span>
              <button
                className='admin-btn admin-btn-sm admin-btn-ghost'
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── MESSAGES TAB ──────────────────────────────────────────────────────────────

function MessagesTab({ token }) {
  const toast = useToast()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pending, setPending] = useState({})
  const [replyingId, setReplyingId] = useState(null)
  const [replyText, setReplyText] = useState('')

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      setMessages(await fetchAdminMessages(token))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this message?')) return
    if (pending[id]) return
    setPending((p) => ({ ...p, [id]: true }))
    try {
      await deleteMessageAdmin(id, token)
      await load()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setPending((p) => ({ ...p, [id]: false }))
    }
  }

  const handleReply = async (id) => {
    if (!replyText.trim()) {
      toast.error('Reply cannot be empty.')
      return
    }
    const key = `reply-${id}`
    if (pending[key]) return
    setPending((p) => ({ ...p, [key]: true }))
    try {
      const msg = await replyToMessageAdmin(id, replyText.trim(), token)
      setReplyingId(null)
      setReplyText('')
      await load()
      if (msg) toast.success(msg)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setPending((p) => ({ ...p, [key]: false }))
    }
  }

  return (
    <div className='admin-tab-content'>
      <div className='admin-section-header'>
        <h2 className='admin-section-title'>Messages</h2>
        <p className='admin-section-subtitle'>
          Messages submitted through the “Contact Us” form.
        </p>
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} />
      ) : messages.length === 0 ? (
        <div className='admin-empty-state'>
          <FaInbox className='admin-empty-icon' />
          <p>No messages.</p>
        </div>
      ) : (
        <div className='admin-message-list'>
          {messages.map((m) => (
            <div key={m.id} className='admin-message-card'>
              <div className='admin-message-header'>
                <span className='admin-message-subject'>
                  <FaEnvelope className='admin-message-icon' /> {m.subject}
                </span>
                <span className='admin-type-badge admin-type-user'>
                  {CONTACT_TYPE_LABELS[m.type] ?? 'Inquiry'}
                </span>
                <span className='admin-report-date'>{fmtDate(m.createdAt)}</span>
              </div>
              <p className='admin-message-body'>{m.message}</p>

              {m.adminReply && (
                <div className='admin-message-reply'>
                  <span className='admin-message-reply-label'>
                    <FaReply /> Your reply{m.repliedAt ? ` · ${fmtDate(m.repliedAt)}` : ''}
                  </span>
                  <p className='admin-message-reply-text'>{m.adminReply}</p>
                </div>
              )}

              <div className='admin-message-footer'>
                <span className='admin-muted'>
                  From <strong>{m.fullName}</strong> ·{' '}
                  <a href={`mailto:${m.email}`} className='admin-content-link'>
                    {m.email}
                  </a>
                </span>
                <div className='admin-message-actions'>
                  {replyingId !== m.id && (
                    <button
                      className='admin-btn admin-btn-sm admin-btn-secondary'
                      onClick={() => {
                        setReplyingId(m.id)
                        setReplyText(m.adminReply || '')
                      }}
                    >
                      <FaReply /> {m.adminReply ? 'Edit reply' : 'Reply'}
                    </button>
                  )}
                  <button
                    className='admin-btn admin-btn-sm admin-btn-danger'
                    onClick={() => handleDelete(m.id)}
                    disabled={pending[m.id]}
                  >
                    <FaTrash /> Delete
                  </button>
                </div>
              </div>

              {replyingId === m.id && (
                <div className='admin-reply-box'>
                  <textarea
                    className='admin-reply-textarea'
                    placeholder={`Reply to ${m.fullName}...`}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={3}
                    autoFocus
                  />
                  <p className='admin-muted' style={{ margin: '4px 0 8px' }}>
                    If {m.fullName} has an account, they'll get an in-app notification. Otherwise reply by email.
                  </p>
                  <div className='admin-reply-box-actions'>
                    <button
                      className='admin-btn admin-btn-sm admin-btn-primary'
                      onClick={() => handleReply(m.id)}
                      disabled={pending[`reply-${m.id}`]}
                    >
                      {pending[`reply-${m.id}`] ? <FaSpinner className='admin-spin' /> : 'Send reply'}
                    </button>
                    <button
                      className='admin-btn admin-btn-sm admin-btn-ghost'
                      onClick={() => {
                        setReplyingId(null)
                        setReplyText('')
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── AUDIT LOG TAB ──────────────────────────────────────────────────────────────

function AuditLogTab({ token }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchAdminLogs(token, 200)
      .then(setLogs)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [token])

  return (
    <div className='admin-tab-content'>
      <div className='admin-section-header'>
        <h2 className='admin-section-title'>Audit Log</h2>
        <p className='admin-section-subtitle'>
          A transparent, append-only record of every action taken from the admin panel.
        </p>
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} />
      ) : logs.length === 0 ? (
        <div className='admin-empty-state'>
          <FaHistory className='admin-empty-icon' />
          <p>No admin actions recorded yet.</p>
        </div>
      ) : (
        <div className='admin-log-list admin-log-list-full'>
          {logs.map((l) => (
            <AdminLogRow key={l.id} entry={l} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── MAIN ──────────────────────────────────────────────────────────────────

export function AdminPage() {
  const { token, user, loading } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [pendingReports, setPendingReports] = useState(0)

  const isAdmin = user?.role === 'Admin'

  useEffect(() => {
    // Wait for the silent-refresh to settle, then gate non-admins out.
    if (!loading && !isAdmin) navigate('/home', { replace: true })
  }, [loading, isAdmin, navigate])

  useEffect(() => {
    if (!token || !isAdmin) return
    fetchAdminStats(token)
      .then((s) => setPendingReports(s?.pendingReports ?? 0))
      .catch(() => {})
  }, [token, isAdmin, activeTab])

  if (loading) return <main className='admin-page'><LoadingState /></main>
  if (!isAdmin) return null

  const renderContent = () => {
    switch (activeTab) {
      case 'users':
        return <UsersTab token={token} currentUserName={user?.userName} />
      case 'communities':
        return <CommunitiesTab token={token} />
      case 'content':
        return <ContentTab token={token} />
      case 'reports':
        return <ReportsTab token={token} currentUserId={user?.id} />
      case 'messages':
        return <MessagesTab token={token} />
      case 'audit':
        return <AuditLogTab token={token} />
      default:
        return <OverviewTab token={token} onNavigate={setActiveTab} />
    }
  }

  return (
    <main className='admin-page'>
      <div className='admin-page-header'>
        <div className='admin-page-title-row'>
          <FaShieldAlt className='admin-page-title-icon' />
          <div>
            <h1 className='admin-page-title'>Admin Panel</h1>
            <p className='admin-page-subtitle'>Application-wide administration · u/{user?.userName}</p>
          </div>
        </div>
      </div>

      <div className='admin-container'>
        <nav className='admin-sidebar-nav'>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                className={`admin-nav-item ${activeTab === item.id ? 'admin-nav-active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon className='admin-nav-icon' />
                <span>{item.label}</span>
                {item.id === 'reports' && pendingReports > 0 && (
                  <span
                    style={{
                      marginLeft: 'auto',
                      background: '#e53e3e',
                      color: '#fff',
                      borderRadius: 999,
                      minWidth: 18,
                      height: 18,
                      fontSize: 11,
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 5px',
                    }}
                  >
                    {pendingReports > 99 ? '99+' : pendingReports}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        <div className='admin-content-area'>{renderContent()}</div>
      </div>
    </main>
  )
}
