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
} from './utils/modApi'
import {
  fetchCommunityReports,
  dismissReport,
  removeReportedContent,
} from './utils/reportApi'
import './Styles/CommunityModPage.css'
import { normalizeImageSrc } from './utils/media'
import { uploadImage } from './utils/imageUpload'

// ─── MOCK DATA (Reports, Pinned, ModLog — backend pending) ───────────────────

const MOCK_REPORTS = [
  {
    id: 1,
    type: 'Post',
    title: 'Make $10k in one week with this trick!',
    contentPreview:
      'This post promotes a fraudulent scheme and includes misleading affiliate links to external sites...',
    hasImage: true,
    viewUrl: '#',
    reporter: 'user_alice',
    reportedUser: 'spammer99',
    reason: 'Spam / Misleading content',
    createdAt: '2026-05-21',
  },
  {
    id: 2,
    type: 'Comment',
    title: null,
    contentPreview:
      '"You are a complete idiot and should stop coding permanently. This advice is garbage."',
    hasImage: false,
    viewUrl: '#',
    reporter: 'coder_bob',
    reportedUser: 'angry_user',
    reason: 'Hate speech / Personal attack',
    createdAt: '2026-05-20',
  },
  {
    id: 3,
    type: 'Post',
    title: 'Learn Python in 2 days (my affiliate link inside)',
    contentPreview:
      'Check out my new course for free, just click this link to get started and buy the premium tier...',
    hasImage: false,
    viewUrl: '#',
    reporter: 'dev_charlie',
    reportedUser: 'promo_account',
    reason: 'Unsolicited promotion / Affiliate spam',
    createdAt: '2026-05-19',
  },
]

const MOCK_POSTS = [
  {
    id: 101,
    title: 'Community Rules & Guidelines',
    author: 'mod',
    votes: 892,
    pinned: true,
    createdAt: '2024-01-16',
  },
  {
    id: 102,
    title: 'Weekly Discussion Thread — May 2026',
    author: 'mod',
    votes: 234,
    pinned: true,
    createdAt: '2026-05-01',
  },
  {
    id: 103,
    title: 'How to ask a good question',
    author: 'mod',
    votes: 567,
    pinned: false,
    createdAt: '2024-02-10',
  },
]

const MOCK_MOD_LOG = [
  {
    id: 1,
    action: 'Removed Post',
    actionType: 'remove',
    target: '"Make $10k in one week"',
    targetUser: 'spammer99',
    moderator: 'mod_alice',
    date: '2026-05-21 14:32',
  },
  {
    id: 2,
    action: 'Kicked Member',
    actionType: 'kick',
    target: 'toxic_user99',
    targetUser: 'toxic_user99',
    moderator: 'owner',
    date: '2026-05-20 09:15',
  },
  {
    id: 3,
    action: 'Dismissed Report',
    actionType: 'dismiss',
    target: 'Comment by user_xyz',
    targetUser: 'user_xyz',
    moderator: 'mod_alice',
    date: '2026-05-19 16:40',
  },
  {
    id: 4,
    action: 'Promoted Moderator',
    actionType: 'promote',
    target: 'mod_bob',
    targetUser: 'mod_bob',
    moderator: 'owner',
    date: '2024-03-10 16:00',
  },
  {
    id: 5,
    action: 'Pinned Post',
    actionType: 'pin',
    target: '"Community Rules & Guidelines"',
    targetUser: null,
    moderator: 'owner',
    date: '2024-01-16 10:00',
  },
]

const LOG_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Removed', value: 'remove' },
  { label: 'Kicked', value: 'kick' },
  { label: 'Promoted', value: 'promote' },
  { label: 'Pinned', value: 'pin' },
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
    remove: { label: 'Removed', cls: 'mod-log-remove' },
    kick: { label: 'Kicked', cls: 'mod-log-kick' },
    dismiss: { label: 'Dismissed', cls: 'mod-log-dismiss' },
    promote: { label: 'Promoted', cls: 'mod-log-promote' },
    pin: { label: 'Pinned', cls: 'mod-log-pin' },
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

  useEffect(() => {
    if (!communityId || !token) return
    fetchCommunityStats(communityId, token)
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoadingStats(false))
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
        <div className='mod-log-coming-soon'>
          <FaList className='mod-log-coming-icon' />
          <p>Mod log will be available in a future update.</p>
          <button className='mod-link-btn' onClick={() => onNavigate('modlog')}>
            View Mod Log →
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── REPORTS TAB ─────────────────────────────────────────────────────────────

function ReportsTab({ communityId, token, communityname, onCountChange }) {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('All')
  const [pending, setPending] = useState({})

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
  const handleRemove = (id) => {
    if (
      !window.confirm('Remove this content permanently? This cannot be undone.')
    )
      return
    withPending(id, () => removeReportedContent(id, token))
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
              {filtered.map((report) => (
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
                    {report.typeName === 'Post' && report.hasImage && (
                      <div className='mod-report-image-thumb'>
                        <div className='mod-report-image-placeholder' />
                        <span className='mod-report-image-label'>
                          Post contains an image
                        </span>
                      </div>
                    )}
                  </div>
                  <div className='mod-report-meta'>
                    <span>
                      Reported by: <strong>u/{report.reporterUserName}</strong>
                    </span>
                    <span className='mod-meta-sep'>·</span>
                    <span>
                      Author: <strong>u/{report.contentAuthorUserName}</strong>
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
                    <button
                      className='mod-btn mod-btn-danger'
                      onClick={() => handleRemove(report.id)}
                      disabled={pending[report.id]}
                    >
                      <FaTrash /> Remove Content
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── MEMBERS TAB ─────────────────────────────────────────────────────────────

function MembersTab({ communityId, token, myRole }) {
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
            filtered.map((member) => (
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
                  </div>
                  <div className='mod-member-meta'>
                    <span>{member.karma.toLocaleString()} karma</span>
                    <span className='mod-meta-sep'>·</span>
                    <span>
                      Joined {new Date(member.joinedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {member.role !== 'owner' && (
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
            ))
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

// ─── PINNED POSTS TAB (mock) ─────────────────────────────────────────────────

function PinnedTab() {
  const [posts, setPosts] = useState(MOCK_POSTS)
  const pinnedCount = posts.filter((p) => p.pinned).length

  const togglePin = (id) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        if (!p.pinned && pinnedCount >= MAX_PINS) {
          alert(`Maximum ${MAX_PINS} posts can be pinned at the same time.`)
          return p
        }
        return { ...p, pinned: !p.pinned }
      }),
    )
  }

  const pinned = posts.filter((p) => p.pinned)
  const unpinned = posts.filter((p) => !p.pinned)

  return (
    <div className='mod-tab-content'>
      <div className='mod-section-header'>
        <h2 className='mod-section-title'>Pinned Posts</h2>
        <p className='mod-section-subtitle'>
          Pinned posts appear at the top of your community feed. Maximum{' '}
          {MAX_PINS} posts can be pinned at a time.
        </p>
      </div>

      {pinned.length > 0 && (
        <div className='mod-pinned-section'>
          <h3 className='mod-subsection-title'>
            Currently Pinned ({pinned.length}/{MAX_PINS})
          </h3>
          <div className='mod-post-list'>
            {pinned.map((post) => (
              <div key={post.id} className='mod-post-card mod-post-pinned'>
                <FaThumbtack className='mod-pin-icon' />
                <div className='mod-post-info'>
                  <span className='mod-post-title'>{post.title}</span>
                  <span className='mod-post-meta'>
                    by u/{post.author} · {post.votes} votes · {post.createdAt}
                  </span>
                </div>
                <button
                  className='mod-btn mod-btn-sm mod-btn-ghost'
                  onClick={() => togglePin(post.id)}
                >
                  Unpin
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className='mod-pinned-section'>
        <h3 className='mod-subsection-title'>All Posts</h3>
        {unpinned.length === 0 ? (
          <div className='mod-empty-state' style={{ padding: '24px' }}>
            <FaThumbtack className='mod-empty-icon' />
            <p>All posts are already pinned.</p>
          </div>
        ) : (
          <div className='mod-post-list'>
            {unpinned.map((post) => (
              <div key={post.id} className='mod-post-card'>
                <div className='mod-post-info'>
                  <span className='mod-post-title'>{post.title}</span>
                  <span className='mod-post-meta'>
                    by u/{post.author} · {post.votes} votes · {post.createdAt}
                  </span>
                </div>
                <button
                  className={`mod-btn mod-btn-sm mod-btn-blue ${pinnedCount >= MAX_PINS ? 'mod-btn-disabled' : ''}`}
                  onClick={() => togglePin(post.id)}
                  disabled={pinnedCount >= MAX_PINS}
                >
                  <FaThumbtack /> Pin
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
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
  const [moderators, setModerators] = useState([])
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
        setModerators(members.filter((m) => m.role === 'moderator')),
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
                  (!clearAvatar && normalizeImageSrc(communityData?.avatarUrl))
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
                  (!clearBanner && normalizeImageSrc(communityData?.bannerUrl))
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
                setForm((prev) => ({ ...prev, description: e.target.value }))
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

        {/* Danger Zone — owner only */}
        {myRole === 'owner' && (
          <div className='mod-danger-zone'>
            <h3 className='mod-danger-title'>
              <FaExclamationTriangle /> Danger Zone
            </h3>

            <div className='mod-danger-item'>
              <div className='mod-danger-info'>
                <strong>Transfer Ownership</strong>
                <p>
                  Hand over this community to one of your moderators. You will
                  become a regular moderator.
                </p>
              </div>
              {!showTransfer && (
                <button
                  type='button'
                  className='mod-btn mod-btn-warning'
                  onClick={() => setShowTransfer(true)}
                >
                  Transfer Ownership
                </button>
              )}
            </div>

            {showTransfer && (
              <div className='mod-transfer-form'>
                <p className='mod-transfer-warning'>
                  <FaExclamationTriangle /> This action is permanent. The new
                  owner will have full control over the community.
                </p>
                {moderators.length === 0 ? (
                  <p style={{ color: '#566a89', fontSize: '14px' }}>
                    No moderators available. Promote a member first.
                  </p>
                ) : (
                  <div className='mod-transfer-row'>
                    <select
                      className='mod-settings-input mod-settings-select'
                      value={transferTarget}
                      onChange={(e) => setTransferTarget(e.target.value)}
                    >
                      <option value=''>Select a moderator...</option>
                      {moderators.map((m) => (
                        <option key={m.userId} value={m.userId}>
                          u/{m.userName}
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

            <div className='mod-danger-divider' />

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
      </form>
    </div>
  )
}

// ─── MOD LOG TAB (mock) ──────────────────────────────────────────────────────

function ModLogTab() {
  const [logFilter, setLogFilter] = useState('all')

  const filtered =
    logFilter === 'all'
      ? MOCK_MOD_LOG
      : MOCK_MOD_LOG.filter((e) => e.actionType === logFilter)

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

      {filtered.length === 0 ? (
        <div className='mod-empty-state'>
          <FaList className='mod-empty-icon' />
          <p>No actions of this type found.</p>
        </div>
      ) : (
        <div className='mod-log-list mod-log-full'>
          {filtered.map((entry) => (
            <div key={entry.id} className='mod-log-entry mod-log-entry-full'>
              <div className='mod-log-entry-left'>
                <ActionLogBadge actionType={entry.actionType} />
              </div>
              <div className='mod-log-info'>
                <span className='mod-log-target'>
                  <strong>{entry.action}</strong>: {entry.target}
                  {entry.targetUser && (
                    <>
                      {' '}
                      (
                      <Link
                        to={`/user/${entry.targetUser}`}
                        className='mod-log-user-link'
                      >
                        u/{entry.targetUser}
                      </Link>
                      )
                    </>
                  )}
                </span>
                <span className='mod-log-meta'>
                  by{' '}
                  <Link
                    to={`/user/${entry.moderator}`}
                    className='mod-log-user-link'
                  >
                    u/{entry.moderator}
                  </Link>
                  <span className='mod-meta-sep'>·</span>
                  {entry.date}
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
        const data = await fetchCommunityBySlug(communityname)
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
          />
        )
      case 'members':
        return (
          <MembersTab communityId={communityId} token={token} myRole={myRole} />
        )
      case 'banned':
        return <BannedMembersTab communityId={communityId} token={token} />
      case 'pinned':
        return <PinnedTab />
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
        return <ModLogTab />
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
