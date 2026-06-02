import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  FaChartBar,
  FaFlag,
  FaUsers,
  FaThumbtack,
  FaCog,
  FaList,
  FaShieldAlt,
  FaCrown,
  FaBan,
  FaCheck,
  FaTrash,
  FaSearch,
  FaArrowLeft,
  FaExclamationTriangle,
  FaTimes,
  FaUserShield,
  FaEdit,
  FaFileAlt,
  FaSpinner,
} from 'react-icons/fa'
import { useAuth } from './AuthContext'
import {
  fetchCommunityBySlug,
  fetchMyRole,
  fetchMembers,
  fetchBannedMembers,
  fetchCommunityStats,
  promoteModerator,
  demoteModerator,
  kickMember,
  banMember,
  unbanMember,
  transferOwnership,
  fetchPinnedPosts,
  pinPost,
  unpinPost,
  fetchCommunityPostsForMod,
  fetchModLog,
} from './utils/modApi'
import {
  fetchCommunityReports,
  dismissReport,
  removeReportedContent,
} from './utils/reportApi'
import './Styles/CommunityModPage.css'
import { normalizeImageSrc } from './utils/media'
import { uploadImage } from './utils/imageUpload'

const LOG_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Banned', value: 'ban' },
  { label: 'Kicked', value: 'kick' },
  { label: 'Promoted', value: 'promote' },
  { label: 'Demoted', value: 'demote' },
  { label: 'Pinned', value: 'pin' },
  { label: 'Removed', value: 'remove' },
  { label: 'Dismissed', value: 'dismiss' },
]

const MAX_PINS = 3

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: FaChartBar },
  { id: 'reports', label: 'Reports', icon: FaFlag },
  { id: 'members', label: 'Members', icon: FaUsers },
  { id: 'banned', label: 'Banned Members', icon: FaBan },
  { id: 'pinned', label: 'Pinned Posts', icon: FaThumbtack },
  { id: 'settings', label: 'Community Settings', icon: FaCog },
  { id: 'modlog', label: 'Mod Log', icon: FaList },
]

// ─── SMALL HELPERS ───────────────────────────────────────────────────────────

function stringToColor(str) {
  const palette = [
    '#0f43c7',
    '#0e7a6e',
    '#7c3aed',
    '#b45309',
    '#be185d',
    '#065f46',
  ]
  let hash = 0
  for (let i = 0; i < str.length; i++)
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return palette[Math.abs(hash) % palette.length]
}

function RoleBadge({ role }) {
  if (role === 'owner')
    return (
      <span className='mod-role-badge mod-role-owner'>
        <FaCrown className='mod-role-icon' /> Owner
      </span>
    )
  if (role === 'moderator')
    return (
      <span className='mod-role-badge mod-role-moderator'>
        <FaShieldAlt className='mod-role-icon' /> Moderator
      </span>
    )
  return <span className='mod-role-badge mod-role-member'>Member</span>
}

function TypeBadge({ type }) {
  return (
    <span className={`mod-type-badge mod-type-${type.toLowerCase()}`}>
      {type}
    </span>
  )
}

function ActionLogBadge({ actionType }) {
  const map = {
    ban: { label: 'Banned', cls: 'mod-log-ban' },
    unban: { label: 'Unbanned', cls: 'mod-log-unban' },
    kick: { label: 'Kicked', cls: 'mod-log-kick' },
    promote: { label: 'Promoted', cls: 'mod-log-promote' },
    demote: { label: 'Demoted', cls: 'mod-log-demote' },
    transfer: { label: 'Transferred', cls: 'mod-log-transfer' },
    pin: { label: 'Pinned', cls: 'mod-log-pin' },
    unpin: { label: 'Unpinned', cls: 'mod-log-unpin' },
    remove: { label: 'Removed', cls: 'mod-log-remove' },
    dismiss: { label: 'Dismissed', cls: 'mod-log-dismiss' },
  }
  const { label, cls } = map[actionType] || { label: actionType, cls: '' }
  return <span className={`mod-log-badge ${cls}`}>{label}</span>
}

function LoadingState() {
  return (
    <div className='mod-empty-state'>
      <FaSpinner className='mod-empty-icon mod-spin' />
      <p>Loading...</p>
    </div>
  )
}

function ErrorState({ message }) {
  return (
    <div className='mod-empty-state'>
      <FaExclamationTriangle
        className='mod-empty-icon'
        style={{ color: '#e74c3c' }}
      />
      <p>{message}</p>
    </div>
  )
}

// ─── OVERVIEW TAB ────────────────────────────────────────────────────────────

function OverviewTab({ communityId, token, onNavigate, pendingReportsCount }) {
  const [stats, setStats] = useState(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const [recentLog, setRecentLog] = useState([])

  useEffect(() => {
    if (!communityId || !token) return
    fetchCommunityStats(communityId, token)
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoadingStats(false))
    fetchModLog(communityId, token)
      .then((data) => setRecentLog(data.slice(0, 5)))
      .catch(() => {})
  }, [communityId, token])

  const pendingReports = pendingReportsCount

  return (
    <div className='mod-tab-content'>
      <div className='mod-section-header'>
        <h2 className='mod-section-title'>Overview</h2>
        <p className='mod-section-subtitle'>
          Quick snapshot of your community's health and moderation activity.
        </p>
      </div>

      <div className='mod-stats-grid'>
        <div className='mod-stat-card mod-stat-orange'>
          <div className='mod-stat-icon'>
            <FaFlag />
          </div>
          <div className='mod-stat-body'>
            <span className='mod-stat-value'>{pendingReports}</span>
            <span className='mod-stat-label'>Pending Reports</span>
          </div>
        </div>
        <div className='mod-stat-card mod-stat-blue'>
          <div className='mod-stat-icon'>
            <FaUsers />
          </div>
          <div className='mod-stat-body'>
            <span className='mod-stat-value'>
              {loadingStats ? '—' : (stats?.membersCount ?? 0).toLocaleString()}
            </span>
            <span className='mod-stat-label'>Total Members</span>
          </div>
        </div>
        <div className='mod-stat-card mod-stat-teal'>
          <div className='mod-stat-icon'>
            <FaFileAlt />
          </div>
          <div className='mod-stat-body'>
            <span className='mod-stat-value'>
              {loadingStats ? '—' : (stats?.postsCount ?? 0)}
            </span>
            <span className='mod-stat-label'>Total Posts</span>
          </div>
        </div>
        <div className='mod-stat-card mod-stat-purple'>
          <div className='mod-stat-icon'>
            <FaShieldAlt />
          </div>
          <div className='mod-stat-body'>
            <span className='mod-stat-value'>
              {loadingStats ? '—' : (stats?.moderatorsCount ?? 0)}
            </span>
            <span className='mod-stat-label'>Active Moderators</span>
          </div>
        </div>
      </div>

      <div className='mod-quick-actions'>
        <h3 className='mod-subsection-title'>Quick Actions</h3>
        <div className='mod-quick-action-row'>
          <button
            className='mod-btn mod-btn-primary'
            onClick={() => onNavigate('reports')}
          >
            <FaFlag /> Review Reports ({pendingReports})
          </button>
          <button
            className='mod-btn mod-btn-secondary'
            onClick={() => onNavigate('members')}
          >
            <FaUsers /> Manage Members
          </button>
          <button
            className='mod-btn mod-btn-secondary'
            onClick={() => onNavigate('settings')}
          >
            <FaCog /> Community Settings
          </button>
        </div>
      </div>

      <div className='mod-recent-actions'>
        <h3 className='mod-subsection-title'>Recent Moderation Actions</h3>
        {recentLog.length === 0 ? (
          <div className='mod-log-coming-soon'>
            <FaList className='mod-log-coming-icon' />
            <p>No moderation actions recorded yet.</p>
          </div>
        ) : (
          <>
            <div className='mod-log-list'>
              {recentLog.map((entry) => (
                <div key={entry.id} className='mod-log-entry'>
                  <div className='mod-log-entry-left'>
                    <ActionLogBadge actionType={entry.actionType} />
                  </div>
                  <div className='mod-log-info'>
                    <span className='mod-log-target'>
                      {logEntryDescription(entry)}
                    </span>
                    <span className='mod-log-meta'>
                      by u/{entry.actorUserName}
                      <span className='mod-meta-sep'>·</span>
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <button
              className='mod-link-btn'
              style={{ marginTop: 8 }}
              onClick={() => onNavigate('modlog')}
            >
              View full Mod Log →
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── REPORTS TAB ─────────────────────────────────────────────────────────────

function ReportsTab({
  communityId,
  token,
  communityname,
  onCountChange,
  userId,
  myRole,
  currentUserName,
}) {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('All')
  const [pending, setPending] = useState({})
  const [banningReport, setBanningReport] = useState(null) // reportId being banned
  const [banReason, setBanReason] = useState('')

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchCommunityReports(communityId, token)
      setReports(data)
      onCountChange?.(data.length)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (communityId && token) load()
  }, [communityId, token])

  const withPending = async (id, fn) => {
    if (pending[id]) return
    setPending((p) => ({ ...p, [id]: true }))
    try {
      await fn()
      await load()
    } catch (e) {
      alert(e.message)
    } finally {
      setPending((p) => ({ ...p, [id]: false }))
    }
  }

  const handleDismiss = (id) => withPending(id, () => dismissReport(id, token))
  const handleRemove = (report) => {
    if (
      !window.confirm('Remove this content permanently? This cannot be undone.')
    )
      return
    withPending(report.id, async () => {
      await removeReportedContent(report.id, token)
      const postId = report.postId ?? report.reportedItemId
      window.dispatchEvent(
        new CustomEvent('post-content-removed', {
          detail: { postId, type: report.typeName },
        }),
      )
    })
  }

  const handleBanAuthor = async (report) => {
    if (!banReason.trim()) {
      alert('Please provide a ban reason.')
      return
    }
    const key = `ban-${report.id}`
    if (pending[key]) return
    setPending((p) => ({ ...p, [key]: true }))
    try {
      const members = await fetchMembers(communityId, token)
      const target = members.find(
        (m) => m.userName === report.contentAuthorUserName,
      )
      if (!target) {
        alert(
          'Could not find user in community members. They may have already left.',
        )
        return
      }
      if (target.role === 'owner') {
        alert('Cannot ban the community owner.')
        return
      }
      if (target.role === 'moderator' && myRole !== 'owner') {
        alert('Only the community owner can ban moderators.')
        return
      }
      if (target.userId === userId) {
        alert('You cannot ban yourself.')
        return
      }
      await banMember(communityId, target.userId, banReason, token)
      await removeReportedContent(report.id, token)
      const postId = report.postId ?? report.reportedItemId
      window.dispatchEvent(
        new CustomEvent('post-content-removed', {
          detail: { postId, type: report.typeName },
        }),
      )
      setBanningReport(null)
      setBanReason('')
      await load()
    } catch (e) {
      alert(e.message)
    } finally {
      setPending((p) => ({ ...p, [key]: false }))
    }
  }

  const filtered =
    filter === 'All' ? reports : reports.filter((r) => r.typeName === filter)

  const viewUrl = (r) => {
    const base = `/community/${communityname}/post/${r.postId ?? r.reportedItemId}`
    return r.typeName === 'Comment' ? `${base}` : base
  }

  return (
    <div className='mod-tab-content'>
      <div className='mod-section-header'>
        <h2 className='mod-section-title'>Reports</h2>
        <p className='mod-section-subtitle'>
          Review content reported by community members. Take action to keep the
          community healthy.
        </p>
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <>
          <div className='mod-filter-bar'>
            {['All', 'Post', 'Comment'].map((f) => (
              <button
                key={f}
                className={`mod-filter-btn ${filter === f ? 'mod-filter-active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f}
                {f === 'All' && reports.length > 0 && (
                  <span className='mod-filter-count'>{reports.length}</span>
                )}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className='mod-empty-state'>
              <FaCheck className='mod-empty-icon' />
              <p>No pending reports. The community is clean!</p>
            </div>
          ) : (
            <div className='mod-report-list'>
              {filtered.map((report) => {
                const authorRole = report.contentAuthorRole
                const isOwnContent =
                  currentUserName &&
                  report.contentAuthorUserName === currentUserName
                const isOwner = myRole === 'owner'
                // A moderator may not remove the owner's or another moderator's content.
                const canRemove =
                  isOwner ||
                  (authorRole !== 'owner' && authorRole !== 'moderator')
                // Can't ban the owner, can't ban a fellow moderator unless you're the
                // owner, and can't ban yourself.
                const canBan =
                  !isOwnContent &&
                  authorRole !== 'owner' &&
                  (isOwner || authorRole !== 'moderator')
                return (
                <div key={report.id} className='mod-report-card'>
                  <div className='mod-report-header'>
                    <TypeBadge type={report.typeName} />
                    <span className='mod-report-reason'>
                      <FaExclamationTriangle className='mod-reason-icon' />{' '}
                      {report.reason}
                    </span>
                    <span className='mod-report-date'>
                      {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {report.postTitle && (
                    <h4 className='mod-report-title'>{report.postTitle}</h4>
                  )}
                  <div className='mod-report-body'>
                    {report.contentPreview && (
                      <p className='mod-report-preview'>
                        {report.contentPreview}
                      </p>
                    )}
                    {report.typeName === 'Post' && report.postImageUrl && (
                      <div className='mod-report-image-thumb'>
                        <img
                          src={normalizeImageSrc(report.postImageUrl)}
                          alt='Post image'
                          className='mod-report-image-preview'
                        />
                      </div>
                    )}
                  </div>
                  <div className='mod-report-meta'>
                    <span>
                      Reported by: <strong>u/{report.reporterUserName}</strong>
                    </span>
                    <span className='mod-meta-sep'>·</span>
                    <span>
                      Author:{' '}
                      <strong className='mod-report-author-name'>
                        u/{report.contentAuthorUserName}
                      </strong>
                      {isOwnContent ? (
                        <span style={{ marginLeft: 6, padding: '1px 7px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: '#6366f1', color: '#fff' }}>
                          your content
                        </span>
                      ) : authorRole === 'owner' ? (
                        <span style={{ marginLeft: 6, padding: '1px 7px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: '#f59e0b', color: '#fff' }}>
                          👑 Owner
                        </span>
                      ) : authorRole === 'moderator' ? (
                        <span style={{ marginLeft: 6, padding: '1px 7px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: '#2563eb', color: '#fff' }}>
                          🛡 Moderator
                        </span>
                      ) : null}
                    </span>
                  </div>
                  <div className='mod-report-actions'>
                    <Link
                      to={viewUrl(report)}
                      className='mod-btn mod-btn-ghost mod-btn-sm'
                    >
                      {report.typeName === 'Post'
                        ? 'View Post →'
                        : 'View Comment →'}
                    </Link>
                    <button
                      className='mod-btn mod-btn-ghost'
                      onClick={() => handleDismiss(report.id)}
                      disabled={pending[report.id]}
                    >
                      <FaTimes /> Dismiss
                    </button>
                    {canRemove && (
                      <button
                        className='mod-btn mod-btn-danger'
                        onClick={() => handleRemove(report)}
                        disabled={pending[report.id]}
                      >
                        <FaTrash /> Remove Content
                      </button>
                    )}
                    {canBan && (
                      <button
                        className='mod-btn mod-btn-ban'
                        onClick={() => {
                          setBanningReport(
                            banningReport === report.id ? null : report.id,
                          )
                          setBanReason('')
                        }}
                        disabled={pending[`ban-${report.id}`]}
                      >
                        <FaBan /> Ban Author
                      </button>
                    )}
                  </div>

                  {banningReport === report.id && (
                    <div className='mod-ban-inline mod-ban-from-report'>
                      <input
                        className='mod-settings-input mod-ban-reason-input'
                        placeholder={`Ban reason for u/${report.contentAuthorUserName}...`}
                        value={banReason}
                        onChange={(e) => setBanReason(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleBanAuthor(report)
                          if (e.key === 'Escape') {
                            setBanningReport(null)
                            setBanReason('')
                          }
                        }}
                        autoFocus
                      />
                      <button
                        className='mod-btn mod-btn-sm mod-btn-danger-solid'
                        onClick={() => handleBanAuthor(report)}
                        disabled={pending[`ban-${report.id}`]}
                      >
                        {pending[`ban-${report.id}`] ? (
                          <FaSpinner className='mod-spin' />
                        ) : (
                          'Confirm Ban + Remove'
                        )}
                      </button>
                      <button
                        className='mod-btn mod-btn-sm mod-btn-ghost'
                        onClick={() => {
                          setBanningReport(null)
                          setBanReason('')
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── MEMBERS TAB ─────────────────────────────────────────────────────────────

function MembersTab({ communityId, token, myRole, currentUserId }) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [pending, setPending] = useState({})
  const [banningUserId, setBanningUserId] = useState(null)
  const [banReason, setBanReason] = useState('')

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchMembers(communityId, token)
      setMembers(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (communityId && token) load()
  }, [communityId, token])

  const withPending = async (userId, fn) => {
    if (pending[userId]) return
    setPending((p) => ({ ...p, [userId]: true }))
    try {
      await fn()
      await load()
    } catch (e) {
      alert(e.message)
    } finally {
      setPending((p) => ({ ...p, [userId]: false }))
    }
  }

  const handlePromote = (userId) =>
    withPending(userId, () => promoteModerator(communityId, userId, token))

  const handleDemote = (userId) =>
    withPending(userId, () => demoteModerator(communityId, userId, token))

  const handleKick = (userId) => {
    if (!window.confirm('Are you sure you want to kick this member?')) return
    withPending(userId, () => kickMember(communityId, userId, token))
  }

  const handleBanSubmit = (userId) => {
    if (!banReason.trim()) {
      alert('Please provide a ban reason.')
      return
    }
    withPending(userId, async () => {
      await banMember(communityId, userId, banReason, token)
      setBanningUserId(null)
      setBanReason('')
    })
  }

  const filtered = members.filter((m) => {
    const matchSearch = m.userName.toLowerCase().includes(search.toLowerCase())
    const matchRole =
      roleFilter === 'All' || m.role === roleFilter.toLowerCase()
    return matchSearch && matchRole
  })

  const isOwner = myRole === 'owner'

  return (
    <div className='mod-tab-content'>
      <div className='mod-section-header'>
        <h2 className='mod-section-title'>Members</h2>
        <p className='mod-section-subtitle'>
          Manage members, promote moderators, and remove users who violate
          community rules.
        </p>
      </div>

      <div className='mod-members-toolbar'>
        <div className='mod-search-wrap'>
          <FaSearch className='mod-search-icon' />
          <input
            type='text'
            className='mod-search-input'
            placeholder='Search members...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className='mod-filter-bar'>
          {['All', 'Owner', 'Moderator', 'Member'].map((f) => (
            <button
              key={f}
              className={`mod-filter-btn ${roleFilter === f ? 'mod-filter-active' : ''}`}
              onClick={() => setRoleFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <div className='mod-member-list'>
          {filtered.length === 0 ? (
            <div className='mod-empty-state'>
              <FaUsers className='mod-empty-icon' />
              <p>No members found matching your search.</p>
            </div>
          ) : (
            filtered.map((member) => {
              const isMe = currentUserId != null && member.userId === currentUserId
              // The owner can act on anyone but themselves and the owner slot; a
              // moderator can only act on regular members.
              const canAct =
                !isMe &&
                member.role !== 'owner' &&
                (isOwner || (myRole === 'moderator' && member.role === 'member'))
              return (
              <div key={member.userId} className='mod-member-card'>
                <div
                  className='mod-member-avatar'
                  style={{ '--avatar-color': stringToColor(member.userName) }}
                >
                  {member.userName[0].toUpperCase()}
                </div>
                <div className='mod-member-info'>
                  <div className='mod-member-name-row'>
                    <Link
                      to={`/user/${member.userName}`}
                      className='mod-member-username'
                    >
                      u/{member.userName}
                    </Link>
                    <RoleBadge role={member.role} />
                    {isMe && (
                      <span style={{ fontSize: '12px', fontWeight: 600, opacity: 0.6 }}>(you)</span>
                    )}
                  </div>
                  <div className='mod-member-meta'>
                    <span>{member.karma.toLocaleString()} karma</span>
                    <span className='mod-meta-sep'>·</span>
                    <span>
                      Joined {new Date(member.joinedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {canAct && (
                  <div className='mod-member-actions'>
                    {isOwner && member.role === 'member' && (
                      <button
                        className='mod-btn mod-btn-sm mod-btn-blue'
                        onClick={() => handlePromote(member.userId)}
                        disabled={pending[member.userId]}
                      >
                        <FaUserShield /> Promote
                      </button>
                    )}
                    {isOwner && member.role === 'moderator' && (
                      <button
                        className='mod-btn mod-btn-sm mod-btn-ghost'
                        onClick={() => handleDemote(member.userId)}
                        disabled={pending[member.userId]}
                      >
                        Demote
                      </button>
                    )}
                    <button
                      className='mod-btn mod-btn-sm mod-btn-danger'
                      onClick={() => handleKick(member.userId)}
                      disabled={pending[member.userId]}
                    >
                      <FaBan /> Kick
                    </button>
                    {banningUserId !== member.userId ? (
                      <button
                        className='mod-btn mod-btn-sm mod-btn-danger'
                        onClick={() => {
                          setBanningUserId(member.userId)
                          setBanReason('')
                        }}
                        disabled={pending[member.userId]}
                      >
                        Ban
                      </button>
                    ) : (
                      <div className='mod-ban-inline'>
                        <input
                          className='mod-settings-input mod-ban-reason-input'
                          placeholder='Ban reason...'
                          value={banReason}
                          onChange={(e) => setBanReason(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter')
                              handleBanSubmit(member.userId)
                            if (e.key === 'Escape') {
                              setBanningUserId(null)
                              setBanReason('')
                            }
                          }}
                          autoFocus
                        />
                        <button
                          className='mod-btn mod-btn-sm mod-btn-danger-solid'
                          onClick={() => handleBanSubmit(member.userId)}
                          disabled={pending[member.userId]}
                        >
                          Confirm
                        </button>
                        <button
                          className='mod-btn mod-btn-sm mod-btn-ghost'
                          onClick={() => {
                            setBanningUserId(null)
                            setBanReason('')
                          }}
                        >
                          <FaTimes />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

// ─── BANNED MEMBERS TAB ──────────────────────────────────────────────────────

function BannedMembersTab({ communityId, token }) {
  const [banned, setBanned] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pending, setPending] = useState({})

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchBannedMembers(communityId, token)
      setBanned(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (communityId && token) load()
  }, [communityId, token])

  const handleUnban = async (userId) => {
    if (pending[userId]) return
    setPending((p) => ({ ...p, [userId]: true }))
    try {
      await unbanMember(communityId, userId, token)
      await load()
    } catch (e) {
      alert(e.message)
    } finally {
      setPending((p) => ({ ...p, [userId]: false }))
    }
  }

  return (
    <div className='mod-tab-content'>
      <div className='mod-section-header'>
        <h2 className='mod-section-title'>Banned Members</h2>
        <p className='mod-section-subtitle'>
          Users currently banned from this community. You can unban them at any
          time.
        </p>
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} />
      ) : banned.length === 0 ? (
        <div className='mod-empty-state'>
          <FaCheck className='mod-empty-icon' />
          <p>No members are currently banned.</p>
        </div>
      ) : (
        <div className='mod-member-list'>
          {banned.map((entry) => (
            <div key={entry.userId} className='mod-member-card mod-banned-card'>
              <div
                className='mod-member-avatar mod-banned-avatar'
                style={{ '--avatar-color': stringToColor(entry.userName) }}
              >
                {entry.userName[0].toUpperCase()}
              </div>
              <div className='mod-member-info'>
                <div className='mod-member-name-row'>
                  <Link
                    to={`/user/${entry.userName}`}
                    className='mod-member-username'
                  >
                    u/{entry.userName}
                  </Link>
                  <span className='mod-role-badge mod-role-banned'>
                    <FaBan className='mod-role-icon' /> Banned
                  </span>
                </div>
                <div className='mod-member-meta'>
                  {entry.bannedAt && (
                    <>
                      <span>
                        Banned on{' '}
                        {new Date(entry.bannedAt).toLocaleDateString()}
                      </span>
                      {entry.bannedByUserName && (
                        <>
                          <span className='mod-meta-sep'>·</span>
                          <span>by u/{entry.bannedByUserName}</span>
                        </>
                      )}
                    </>
                  )}
                </div>
                {entry.banReason && (
                  <p className='mod-ban-reason'>{entry.banReason}</p>
                )}
              </div>
              <div className='mod-member-actions'>
                <button
                  className='mod-btn mod-btn-sm mod-btn-secondary'
                  onClick={() => handleUnban(entry.userId)}
                  disabled={pending[entry.userId]}
                >
                  <FaCheck /> Unban
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── PINNED POSTS TAB ────────────────────────────────────────────────────────

function PinnedTab({ communityId, token }) {
  const [pinnedPosts, setPinnedPosts] = useState([])
  const [allPosts, setAllPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pending, setPending] = useState({})

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const [pinnedBatch, allBatch] = await Promise.all([
        fetchPinnedPosts(communityId, token),
        fetchCommunityPostsForMod(communityId, token),
      ])
      const pinnedIds = new Set((pinnedBatch.items ?? []).map((p) => p.id))
      setPinnedPosts(pinnedBatch.items ?? [])
      // allPosts = all community posts not currently pinned (for the "All Posts" picker)
      setAllPosts((allBatch.items ?? []).filter((p) => !pinnedIds.has(p.id)))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (communityId && token) load()
  }, [communityId, token])

  const pinnedCount = pinnedPosts.length

  const handlePin = async (postId) => {
    if (pending[postId]) return
    if (pinnedCount >= MAX_PINS) {
      alert(`Maximum ${MAX_PINS} posts can be pinned at the same time.`)
      return
    }
    setPending((p) => ({ ...p, [postId]: true }))
    try {
      await pinPost(communityId, postId, token)
      await load()
    } catch (e) {
      alert(e.message)
    } finally {
      setPending((p) => ({ ...p, [postId]: false }))
    }
  }

  const handleUnpin = async (postId) => {
    if (pending[postId]) return
    setPending((p) => ({ ...p, [postId]: true }))
    try {
      await unpinPost(communityId, postId, token)
      await load()
    } catch (e) {
      alert(e.message)
    } finally {
      setPending((p) => ({ ...p, [postId]: false }))
    }
  }

  return (
    <div className='mod-tab-content'>
      <div className='mod-section-header'>
        <h2 className='mod-section-title'>Pinned Posts</h2>
        <p className='mod-section-subtitle'>
          Pinned posts appear at the top of your community feed. Maximum{' '}
          {MAX_PINS} posts can be pinned at a time.
        </p>
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <>
          {pinnedPosts.length > 0 && (
            <div className='mod-pinned-section'>
              <h3 className='mod-subsection-title'>
                Currently Pinned ({pinnedPosts.length}/{MAX_PINS})
              </h3>
              <div className='mod-post-list'>
                {pinnedPosts.map((post) => (
                  <div key={post.id} className='mod-post-card mod-post-pinned'>
                    <FaThumbtack className='mod-pin-icon' />
                    <div className='mod-post-info'>
                      <span className='mod-post-title'>{post.title}</span>
                      <span className='mod-post-meta'>
                        by u/{post.authorName} · {post.votes} votes ·{' '}
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      className='mod-btn mod-btn-sm mod-btn-ghost'
                      onClick={() => handleUnpin(post.id)}
                      disabled={pending[post.id]}
                    >
                      {pending[post.id] ? (
                        <FaSpinner className='mod-spin' />
                      ) : (
                        'Unpin'
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className='mod-pinned-section'>
            <h3 className='mod-subsection-title'>All Posts</h3>
            {allPosts.length === 0 ? (
              <div className='mod-empty-state' style={{ padding: '24px' }}>
                <FaThumbtack className='mod-empty-icon' />
                <p>
                  {pinnedPosts.length === 0
                    ? 'No posts in this community yet.'
                    : 'All posts are already pinned.'}
                </p>
              </div>
            ) : (
              <div className='mod-post-list'>
                {allPosts.map((post) => (
                  <div key={post.id} className='mod-post-card'>
                    <div className='mod-post-info'>
                      <span className='mod-post-title'>{post.title}</span>
                      <span className='mod-post-meta'>
                        by u/{post.authorName} · {post.votes} votes ·{' '}
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      className={`mod-btn mod-btn-sm mod-btn-blue ${
                        pinnedCount >= MAX_PINS ? 'mod-btn-disabled' : ''
                      }`}
                      onClick={() => handlePin(post.id)}
                      disabled={pinnedCount >= MAX_PINS || pending[post.id]}
                    >
                      {pending[post.id] ? (
                        <FaSpinner className='mod-spin' />
                      ) : (
                        <>
                          <FaThumbtack /> Pin
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ─── COMMUNITY SETTINGS TAB ──────────────────────────────────────────────────

function CommunitySettingsTab({
  communityId,
  token,
  myRole,
  communityData,
  onCommunityUpdate,
}) {
  const navigate = useNavigate()
  const { communityname } = useParams()

  const [form, setForm] = useState({})
  const [rules, setRules] = useState([])
  const [newRule, setNewRule] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [showTransfer, setShowTransfer] = useState(false)
  const [transferTarget, setTransferTarget] = useState('')
  const [transferCandidates, setTransferCandidates] = useState([])
  const [transferring, setTransferring] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Image upload state
  const [avatarFile, setAvatarFile] = useState(null)
  const [bannerFile, setBannerFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [bannerPreview, setBannerPreview] = useState('')
  const [clearAvatar, setClearAvatar] = useState(false)
  const [clearBanner, setClearBanner] = useState(false)
  const avatarInputRef = useRef(null)
  const bannerInputRef = useRef(null)

  useEffect(() => {
    if (communityData) {
      setForm({
        title: communityData.title ?? '',
        description: communityData.description ?? '',
        category: communityData.category ?? 'Technology',
        type: communityData.type ?? 'public',
      })
      setRules(
        communityData.rules
          ? communityData.rules.split('\n').filter(Boolean)
          : [],
      )
      // Reset image state when communityData changes (e.g. after save)
      setAvatarFile(null)
      setBannerFile(null)
      setAvatarPreview('')
      setBannerPreview('')
      setClearAvatar(false)
      setClearBanner(false)
    }
  }, [communityData])

  useEffect(() => {
    if (!communityId || !token || myRole !== 'owner') return
    fetchMembers(communityId, token)
      .then((members) =>
        setTransferCandidates(members.filter((m) => m.role !== 'owner')),
      )
      .catch(() => {})
  }, [communityId, token, myRole])

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
    setClearAvatar(false)
  }

  const handleBannerChange = (e) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    if (bannerPreview) URL.revokeObjectURL(bannerPreview)
    setBannerFile(file)
    setBannerPreview(URL.createObjectURL(file))
    setClearBanner(false)
  }

  const handleAvatarRemove = (e) => {
    e.stopPropagation()
    setAvatarFile(null)
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    setAvatarPreview('')
    setClearAvatar(true)
    if (avatarInputRef.current) avatarInputRef.current.value = ''
  }

  const handleBannerRemove = (e) => {
    e.stopPropagation()
    setBannerFile(null)
    if (bannerPreview) URL.revokeObjectURL(bannerPreview)
    setBannerPreview('')
    setClearBanner(true)
    if (bannerInputRef.current) bannerInputRef.current.value = ''
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSavedMsg('')
    try {
      let finalAvatarUrl = clearAvatar
        ? null
        : (communityData?.avatarUrl ?? null)
      let finalBannerUrl = clearBanner
        ? null
        : (communityData?.bannerUrl ?? null)

      if (avatarFile)
        finalAvatarUrl = await uploadImage(avatarFile, 'communities')
      if (bannerFile)
        finalBannerUrl = await uploadImage(bannerFile, 'communities')

      const res = await fetch(`/api/Communities/${communityId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          category: form.category,
          type: form.type,
          avatarUrl: finalAvatarUrl,
          bannerUrl: finalBannerUrl,
          rules: rules.length > 0 ? rules.join('\n') : null,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      const updated = await res.json()
      onCommunityUpdate(updated)
      setSavedMsg('Settings saved successfully!')
      setTimeout(() => setSavedMsg(''), 3000)
    } catch (e) {
      alert('Failed to save: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleTransfer = async () => {
    if (!transferTarget) return
    setTransferring(true)
    try {
      await transferOwnership(communityId, parseInt(transferTarget), token)
      alert('Ownership transferred successfully.')
      setShowTransfer(false)
      setTransferTarget('')
      navigate(`/community/${communityname}`)
    } catch (e) {
      alert(e.message)
    } finally {
      setTransferring(false)
    }
  }

  const handleDelete = async () => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete this community? This cannot be undone.`,
      )
    )
      return
    setDeleting(true)
    try {
      const res = await fetch(`/api/Communities/${communityId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(await res.text())
      alert('Community deleted.')
      navigate('/')
    } catch (e) {
      alert('Failed to delete: ' + e.message)
    } finally {
      setDeleting(false)
    }
  }

  const addRule = () => {
    if (!newRule.trim()) return
    setRules((prev) => [...prev, newRule.trim()])
    setNewRule('')
  }
  const removeRule = (i) =>
    setRules((prev) => prev.filter((_, idx) => idx !== i))

  return (
    <div className='mod-tab-content'>
      <div className='mod-section-header'>
        <h2 className='mod-section-title'>Community Settings</h2>
        <p className='mod-section-subtitle'>
          Edit your community's appearance, description, and rules.
        </p>
      </div>

      {myRole !== 'owner' ? (
        <div className='mod-settings-readonly-notice'>
          <FaShieldAlt className='mod-settings-readonly-icon' />
          <h3>Settings — Read Only</h3>
          <p>
            Only the community owner can modify settings. Contact the owner if
            you need changes made.
          </p>
        </div>
      ) : (
        <>
          {savedMsg && <div className='mod-status-success'>{savedMsg}</div>}

          <form className='mod-settings-form' onSubmit={handleSave}>
            <div className='mod-settings-section'>
              <h3 className='mod-settings-section-title'>Identity</h3>

              <div className='mod-media-upload-row'>
                {/* Avatar */}
                <div className='mod-media-upload-item'>
                  <label className='mod-settings-label'>Community Avatar</label>
                  {(() => {
                    const src =
                      avatarPreview ||
                      (!clearAvatar &&
                        normalizeImageSrc(communityData?.avatarUrl))
                    return src ? (
                      <div
                        className='mod-media-upload-zone mod-media-avatar-zone has-image'
                        onClick={() => avatarInputRef.current?.click()}
                      >
                        <img
                          src={src}
                          alt='Avatar'
                          className='mod-media-upload-img'
                        />
                        <div className='mod-media-upload-overlay'>
                          <button
                            type='button'
                            className='mod-media-upload-btn'
                            onClick={(e) => {
                              e.stopPropagation()
                              avatarInputRef.current?.click()
                            }}
                          >
                            Change
                          </button>
                          <button
                            type='button'
                            className='mod-media-upload-btn mod-media-upload-btn-remove'
                            onClick={handleAvatarRemove}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className='mod-media-upload-zone mod-media-avatar-zone'
                        onClick={() => avatarInputRef.current?.click()}
                      >
                        <FaEdit className='mod-media-icon' />
                        <span className='mod-media-hint'>Click to upload</span>
                      </div>
                    )
                  })()}
                  <input
                    ref={avatarInputRef}
                    type='file'
                    accept='image/*'
                    style={{ display: 'none' }}
                    onChange={handleAvatarChange}
                    disabled={saving}
                  />
                </div>

                {/* Banner */}
                <div className='mod-media-upload-item mod-media-banner-item'>
                  <label className='mod-settings-label'>Community Banner</label>
                  {(() => {
                    const src =
                      bannerPreview ||
                      (!clearBanner &&
                        normalizeImageSrc(communityData?.bannerUrl))
                    return src ? (
                      <div
                        className='mod-media-upload-zone mod-media-banner-zone has-image'
                        onClick={() => bannerInputRef.current?.click()}
                      >
                        <img
                          src={src}
                          alt='Banner'
                          className='mod-media-upload-img'
                        />
                        <div className='mod-media-upload-overlay'>
                          <button
                            type='button'
                            className='mod-media-upload-btn'
                            onClick={(e) => {
                              e.stopPropagation()
                              bannerInputRef.current?.click()
                            }}
                          >
                            Change
                          </button>
                          <button
                            type='button'
                            className='mod-media-upload-btn mod-media-upload-btn-remove'
                            onClick={handleBannerRemove}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className='mod-media-upload-zone mod-media-banner-zone'
                        onClick={() => bannerInputRef.current?.click()}
                      >
                        <FaEdit className='mod-media-icon' />
                        <span className='mod-media-hint'>
                          Click to upload · 1920×320 px recomandat
                        </span>
                      </div>
                    )
                  })()}
                  <input
                    ref={bannerInputRef}
                    type='file'
                    accept='image/*'
                    style={{ display: 'none' }}
                    onChange={handleBannerChange}
                    disabled={saving}
                  />
                </div>
              </div>

              <div className='mod-form-group'>
                <label className='mod-settings-label'>Community Name</label>
                <input
                  className='mod-settings-input'
                  value={form.title ?? ''}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder='Community name'
                />
              </div>

              <div className='mod-form-group'>
                <label className='mod-settings-label'>Description</label>
                <textarea
                  className='mod-settings-input mod-settings-textarea'
                  value={form.description ?? ''}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={4}
                  maxLength={500}
                  placeholder='Describe your community...'
                />
                <span className='mod-char-count'>
                  {(form.description ?? '').length}/500
                </span>
              </div>

              <div className='mod-form-row'>
                <div className='mod-form-group'>
                  <label className='mod-settings-label'>Category</label>
                  <select
                    className='mod-settings-input mod-settings-select'
                    value={form.category ?? ''}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, category: e.target.value }))
                    }
                  >
                    {[
                      'Technology',
                      'Science',
                      'Gaming',
                      'Sports',
                      'Art',
                      'Music',
                      'Education',
                      'Other',
                    ].map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className='mod-form-group'>
                  <label className='mod-settings-label'>Community Type</label>
                  <select
                    className='mod-settings-input mod-settings-select'
                    value={form.type ?? ''}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, type: e.target.value }))
                    }
                  >
                    <option value='public'>
                      Public — anyone can view and post
                    </option>
                    <option value='restricted'>
                      Restricted — anyone can view, only mods post
                    </option>
                    <option value='private'>Private — invite only</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Rules */}
            <div className='mod-settings-section'>
              <h3 className='mod-settings-section-title'>Community Rules</h3>
              <p className='mod-settings-section-desc'>
                Rules are shown in the community sidebar to all visitors.
              </p>
              <div className='mod-rules-list'>
                {rules.map((rule, i) => (
                  <div key={i} className='mod-rule-item'>
                    <span className='mod-rule-number'>{i + 1}</span>
                    <span className='mod-rule-text'>{rule}</span>
                    <button
                      type='button'
                      className='mod-rule-remove'
                      onClick={() => removeRule(i)}
                      aria-label='Remove rule'
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))}
              </div>
              <div className='mod-add-rule-row'>
                <input
                  className='mod-settings-input'
                  placeholder='Add a new rule...'
                  value={newRule}
                  onChange={(e) => setNewRule(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addRule()
                    }
                  }}
                />
                <button
                  type='button'
                  className='mod-btn mod-btn-secondary'
                  onClick={addRule}
                >
                  Add Rule
                </button>
              </div>
            </div>

            <div className='mod-form-actions'>
              <button
                type='submit'
                className='mod-btn mod-btn-primary'
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>

          {/* Transfer Ownership — owner only, separate from Danger Zone */}
          {myRole === 'owner' && (
            <section className='mod-transfer-section'>
              <h3 className='mod-transfer-section-title'>
                <FaCrown /> Transfer Ownership
              </h3>
              <p className='mod-transfer-section-desc'>
                Hand over this community to another member. You will become a regular moderator after the transfer.
              </p>

              {!showTransfer ? (
                <button
                  type='button'
                  className='mod-btn mod-btn-warning'
                  onClick={() => setShowTransfer(true)}
                >
                  Transfer Ownership
                </button>
              ) : (
                <div className='mod-transfer-form'>
                  <p className='mod-transfer-warning'>
                    <FaExclamationTriangle /> This action is permanent. The new owner will have full control over the community.
                  </p>
                  {transferCandidates.length === 0 ? (
                    <p style={{ color: '#566a89', fontSize: '14px' }}>
                      No other members available to transfer ownership to.
                    </p>
                  ) : (
                    <div className='mod-transfer-row'>
                      <select
                        className='mod-settings-input mod-settings-select'
                        value={transferTarget}
                        onChange={(e) => setTransferTarget(e.target.value)}
                      >
                        <option value=''>Select a member...</option>
                        {transferCandidates.map((m) => (
                          <option key={m.userId} value={m.userId}>
                            u/{m.userName}
                            {m.role === 'moderator' ? ' (Moderator)' : ''}
                          </option>
                        ))}
                      </select>
                      <button
                        type='button'
                        className='mod-btn mod-btn-danger-solid'
                        disabled={!transferTarget || transferring}
                        onClick={handleTransfer}
                      >
                        {transferring ? 'Transferring...' : 'Confirm Transfer'}
                      </button>
                    </div>
                  )}
                  <button
                    type='button'
                    className='mod-btn mod-btn-ghost'
                    onClick={() => {
                      setShowTransfer(false)
                      setTransferTarget('')
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Danger Zone — owner only */}
          {myRole === 'owner' && (
            <div className='mod-danger-zone'>
              <h3 className='mod-danger-title'>
                <FaExclamationTriangle /> Danger Zone
              </h3>

              <div className='mod-danger-item'>
                <div className='mod-danger-info'>
                  <strong>Delete Community</strong>
                  <p>
                    Permanently delete this community and all its posts. This
                    action cannot be undone.
                  </p>
                </div>
                <button
                  type='button'
                  className='mod-btn mod-btn-danger-solid'
                  disabled={deleting}
                  onClick={handleDelete}
                >
                  {deleting ? 'Deleting...' : 'Delete Community'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── MOD LOG TAB ─────────────────────────────────────────────────────────────

function logEntryDescription(entry) {
  const type = entry.actionType
  if (type === 'ban')
    return `Banned u/${entry.targetUserName}${entry.details ? ` — ${entry.details}` : ''}`
  if (type === 'unban') return `Unbanned u/${entry.targetUserName}`
  if (type === 'kick') return `Kicked u/${entry.targetUserName}`
  if (type === 'promote')
    return `Promoted u/${entry.targetUserName} to Moderator`
  if (type === 'demote')
    return `Demoted u/${entry.targetUserName} from Moderator`
  if (type === 'transfer')
    return `Transferred ownership to u/${entry.targetUserName}`
  if (type === 'pin') return `Pinned post #${entry.targetPostId}`
  if (type === 'unpin') return `Unpinned post #${entry.targetPostId}`
  if (type === 'remove')
    return `Removed content${entry.details ? ` (${entry.details})` : ''}`
  if (type === 'dismiss')
    return `Dismissed report${entry.details ? ` (${entry.details})` : ''}`
  return type
}

function ModLogTab({ communityId, token }) {
  const [logFilter, setLogFilter] = useState('all')
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!communityId || !token) return
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await fetchModLog(communityId, token, logFilter)
        setEntries(data)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [communityId, token, logFilter])

  return (
    <div className='mod-tab-content'>
      <div className='mod-section-header'>
        <h2 className='mod-section-title'>Mod Log</h2>
        <p className='mod-section-subtitle'>
          A transparent record of all moderation actions taken in this
          community.
        </p>
      </div>

      <div className='mod-filter-bar'>
        {LOG_FILTERS.map((f) => (
          <button
            key={f.value}
            className={`mod-filter-btn ${logFilter === f.value ? 'mod-filter-active' : ''}`}
            onClick={() => setLogFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} />
      ) : entries.length === 0 ? (
        <div className='mod-empty-state'>
          <FaList className='mod-empty-icon' />
          <p>No actions of this type found.</p>
        </div>
      ) : (
        <div className='mod-log-list mod-log-full'>
          {entries.map((entry) => (
            <div key={entry.id} className='mod-log-entry mod-log-entry-full'>
              <div className='mod-log-entry-left'>
                <ActionLogBadge actionType={entry.actionType} />
              </div>
              <div className='mod-log-info'>
                <span className='mod-log-target'>
                  {logEntryDescription(entry)}
                </span>
                <span className='mod-log-meta'>
                  by{' '}
                  <Link
                    to={`/user/${entry.actorUserName}`}
                    className='mod-log-user-link'
                  >
                    u/{entry.actorUserName}
                  </Link>
                  <span className='mod-meta-sep'>·</span>
                  {new Date(entry.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export function CommunityModPage() {
  const { communityname } = useParams()
  const { token, user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')

  const [community, setCommunity] = useState(null)
  const [communityId, setCommunityId] = useState(null)
  const [myRole, setMyRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pendingReportsCount, setPendingReportsCount] = useState(0)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchCommunityBySlug(communityname, token)
        setCommunity(data)
        setCommunityId(data.id)

        if (token) {
          const role = await fetchMyRole(data.id, token)
          setMyRole(role)
          if (role !== 'owner' && role !== 'moderator') {
            navigate(`/community/${communityname}`)
          } else {
            fetchCommunityReports(data.id, token)
              .then((reps) => setPendingReportsCount(reps.length))
              .catch(() => {})
          }
        } else {
          navigate(`/community/${communityname}`)
        }
      } catch {
        navigate(`/community/${communityname}`)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [communityname, token])

  const handleCommunityUpdate = (updated) => {
    setCommunity(updated)
  }

  const renderContent = () => {
    if (loading) return <LoadingState />
    switch (activeTab) {
      case 'overview':
        return (
          <OverviewTab
            communityId={communityId}
            token={token}
            onNavigate={setActiveTab}
            pendingReportsCount={pendingReportsCount}
          />
        )
      case 'reports':
        return (
          <ReportsTab
            communityId={communityId}
            token={token}
            communityname={communityname}
            onCountChange={setPendingReportsCount}
            userId={user?.id}
            myRole={myRole}
            currentUserName={user?.userName}
          />
        )
      case 'members':
        return (
          <MembersTab communityId={communityId} token={token} myRole={myRole} currentUserId={user?.id} />
        )
      case 'banned':
        return <BannedMembersTab communityId={communityId} token={token} />
      case 'pinned':
        return <PinnedTab communityId={communityId} token={token} />
      case 'settings':
        return (
          <CommunitySettingsTab
            communityId={communityId}
            token={token}
            myRole={myRole}
            communityData={community}
            onCommunityUpdate={handleCommunityUpdate}
          />
        )
      case 'modlog':
        return <ModLogTab communityId={communityId} token={token} />
      default:
        return (
          <OverviewTab
            communityId={communityId}
            token={token}
            onNavigate={setActiveTab}
            pendingReportsCount={pendingReportsCount}
          />
        )
    }
  }

  return (
    <main className='mod-page'>
      <div className='mod-page-header'>
        <Link to={`/community/${communityname}`} className='mod-back-link'>
          <FaArrowLeft /> Back to c/{communityname}
        </Link>
        <div className='mod-page-title-row'>
          <FaShieldAlt className='mod-page-title-icon' />
          {community?.avatarUrl ? (
            <img
              src={normalizeImageSrc(community.avatarUrl)}
              alt={community.title}
              className='mod-community-avatar'
            />
          ) : (
            <div className='mod-community-avatar-placeholder'>
              {(community?.title ?? communityname)[0].toUpperCase()}
            </div>
          )}
          <div>
            <h1 className='mod-page-title'>Mod Tools</h1>
            <p className='mod-page-subtitle'>
              c/{communityname} — {community?.title ?? ''}
            </p>
          </div>
        </div>
      </div>

      <div className='mod-container'>
        <nav className='mod-sidebar-nav'>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                className={`mod-nav-item ${activeTab === item.id ? 'mod-nav-active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon className='mod-nav-icon' />
                <span>{item.label}</span>
                {item.id === 'reports' && pendingReportsCount > 0 && (
                  <span className='mod-nav-badge'>{pendingReportsCount}</span>
                )}
              </button>
            )
          })}
        </nav>

        <div className='mod-content-area'>{renderContent()}</div>
      </div>
    </main>
  )
}
