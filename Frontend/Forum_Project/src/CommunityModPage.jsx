import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
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
} from 'react-icons/fa'
import './Styles/CommunityModPage.css'

// ─── MOCK DATA ──────────────────────────────────────────────────────────────

const MOCK_COMMUNITY = {
  title: 'Programming',
  slug: 'programming',
  description:
    'A community for programmers to share knowledge, projects and help each other grow.',
  category: 'Technology',
  type: 'public',
  membersCount: 1247,
  createdAt: '2024-01-15',
  rules: [
    'Be respectful to everyone.',
    'Posts must be relevant to programming.',
    'No spam or unsolicited self-promotion.',
    'Use descriptive, clear titles.',
  ],
}

const MOCK_STATS = {
  pendingReports: 5,
  totalMembers: 1247,
  totalPosts: 342,
  activeModerators: 3,
}

const MOCK_REPORTS = [
  {
    id: 1,
    type: 'Post',
    title: 'Make $10k in one week with this trick!',
    contentPreview:
      'This post promotes a fraudulent scheme and includes misleading affiliate links to external sites...',
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
    reporter: 'dev_charlie',
    reportedUser: 'promo_account',
    reason: 'Unsolicited promotion / Affiliate spam',
    createdAt: '2026-05-19',
  },
  {
    id: 4,
    type: 'Comment',
    title: null,
    contentPreview:
      '"This is terrible advice. Whoever wrote this is completely incompetent and should not be giving help."',
    reporter: 'helpful_user',
    reportedUser: 'rude_commenter',
    reason: 'Disrespectful / Toxic behavior',
    createdAt: '2026-05-18',
  },
  {
    id: 5,
    type: 'Post',
    title: 'Download cracked JetBrains tools here for free',
    contentPreview:
      'Get all JetBrains IDE tools for free with this crack. No license needed, works on all versions...',
    reporter: 'honest_dev',
    reportedUser: 'pirate_user',
    reason: 'Illegal content / Piracy',
    createdAt: '2026-05-17',
  },
]

const MOCK_MEMBERS = [
  { id: 1, username: 'dan_botan', role: 'owner', joinedAt: '2024-01-15', karma: 4520 },
  { id: 2, username: 'mod_alice', role: 'moderator', joinedAt: '2024-02-01', karma: 1230 },
  { id: 3, username: 'mod_bob', role: 'moderator', joinedAt: '2024-03-10', karma: 890 },
  { id: 4, username: 'regular_user1', role: 'member', joinedAt: '2024-04-05', karma: 234 },
  { id: 5, username: 'regular_user2', role: 'member', joinedAt: '2024-05-12', karma: 67 },
  { id: 6, username: 'new_member', role: 'member', joinedAt: '2026-05-20', karma: 5 },
  { id: 7, username: 'coder_bob', role: 'member', joinedAt: '2025-01-08', karma: 412 },
  { id: 8, username: 'dev_charlie', role: 'member', joinedAt: '2025-03-22', karma: 178 },
]

const MOCK_POSTS = [
  { id: 101, title: 'Community Rules & Guidelines', author: 'dan_botan', votes: 892, pinned: true, createdAt: '2024-01-16' },
  { id: 102, title: 'Weekly Discussion Thread — May 2026', author: 'mod_alice', votes: 234, pinned: true, createdAt: '2026-05-01' },
  { id: 103, title: 'How to ask a good programming question', author: 'dan_botan', votes: 567, pinned: false, createdAt: '2024-02-10' },
  { id: 104, title: 'Resource megathread: learn programming in 2026', author: 'mod_bob', votes: 445, pinned: false, createdAt: '2025-11-15' },
  { id: 105, title: "What's your favorite IDE and why?", author: 'regular_user1', votes: 312, pinned: false, createdAt: '2026-05-18' },
]

const MOCK_MOD_LOG = [
  { id: 1, action: 'Removed Post', actionType: 'remove', target: '"Make $10k in one week"', targetUser: 'spammer99', moderator: 'mod_alice', date: '2026-05-21 14:32' },
  { id: 2, action: 'Kicked Member', actionType: 'kick', target: 'toxic_user99', targetUser: 'toxic_user99', moderator: 'dan_botan', date: '2026-05-20 09:15' },
  { id: 3, action: 'Dismissed Report', actionType: 'dismiss', target: 'Comment by user_xyz', targetUser: 'user_xyz', moderator: 'mod_alice', date: '2026-05-19 16:40' },
  { id: 4, action: 'Promoted Moderator', actionType: 'promote', target: 'mod_bob', targetUser: 'mod_bob', moderator: 'dan_botan', date: '2024-03-10 16:00' },
  { id: 5, action: 'Pinned Post', actionType: 'pin', target: '"Community Rules & Guidelines"', targetUser: null, moderator: 'dan_botan', date: '2024-01-16 10:00' },
  { id: 6, action: 'Promoted Moderator', actionType: 'promote', target: 'mod_alice', targetUser: 'mod_alice', moderator: 'dan_botan', date: '2024-02-01 12:00' },
]

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: FaChartBar },
  { id: 'reports', label: 'Reports', icon: FaFlag, badge: 5 },
  { id: 'members', label: 'Members', icon: FaUsers },
  { id: 'pinned', label: 'Pinned Posts', icon: FaThumbtack },
  { id: 'settings', label: 'Community Settings', icon: FaCog },
  { id: 'modlog', label: 'Mod Log', icon: FaList },
]

// ─── SMALL HELPERS ───────────────────────────────────────────────────────────

function stringToColor(str) {
  const palette = ['#0f43c7', '#0e7a6e', '#7c3aed', '#b45309', '#be185d', '#065f46']
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
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
    <span className={`mod-type-badge mod-type-${type.toLowerCase()}`}>{type}</span>
  )
}

function ActionLogBadge({ actionType }) {
  const map = {
    remove:  { label: 'Removed',   cls: 'mod-log-remove' },
    kick:    { label: 'Kicked',    cls: 'mod-log-kick' },
    dismiss: { label: 'Dismissed', cls: 'mod-log-dismiss' },
    promote: { label: 'Promoted',  cls: 'mod-log-promote' },
    pin:     { label: 'Pinned',    cls: 'mod-log-pin' },
  }
  const { label, cls } = map[actionType] || { label: actionType, cls: '' }
  return <span className={`mod-log-badge ${cls}`}>{label}</span>
}

// ─── OVERVIEW TAB ────────────────────────────────────────────────────────────

function OverviewTab({ onNavigate }) {
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
          <div className='mod-stat-icon'><FaFlag /></div>
          <div className='mod-stat-body'>
            <span className='mod-stat-value'>{MOCK_STATS.pendingReports}</span>
            <span className='mod-stat-label'>Pending Reports</span>
          </div>
        </div>
        <div className='mod-stat-card mod-stat-blue'>
          <div className='mod-stat-icon'><FaUsers /></div>
          <div className='mod-stat-body'>
            <span className='mod-stat-value'>{MOCK_STATS.totalMembers.toLocaleString()}</span>
            <span className='mod-stat-label'>Total Members</span>
          </div>
        </div>
        <div className='mod-stat-card mod-stat-teal'>
          <div className='mod-stat-icon'><FaFileAlt /></div>
          <div className='mod-stat-body'>
            <span className='mod-stat-value'>{MOCK_STATS.totalPosts}</span>
            <span className='mod-stat-label'>Total Posts</span>
          </div>
        </div>
        <div className='mod-stat-card mod-stat-purple'>
          <div className='mod-stat-icon'><FaShieldAlt /></div>
          <div className='mod-stat-body'>
            <span className='mod-stat-value'>{MOCK_STATS.activeModerators}</span>
            <span className='mod-stat-label'>Active Moderators</span>
          </div>
        </div>
      </div>

      <div className='mod-quick-actions'>
        <h3 className='mod-subsection-title'>Quick Actions</h3>
        <div className='mod-quick-action-row'>
          <button className='mod-btn mod-btn-primary' onClick={() => onNavigate('reports')}>
            <FaFlag /> Review Reports ({MOCK_STATS.pendingReports})
          </button>
          <button className='mod-btn mod-btn-secondary' onClick={() => onNavigate('members')}>
            <FaUsers /> Manage Members
          </button>
          <button className='mod-btn mod-btn-secondary' onClick={() => onNavigate('settings')}>
            <FaCog /> Community Settings
          </button>
        </div>
      </div>

      <div className='mod-recent-actions'>
        <h3 className='mod-subsection-title'>Recent Moderation Actions</h3>
        <div className='mod-log-list'>
          {MOCK_MOD_LOG.slice(0, 4).map((entry) => (
            <div key={entry.id} className='mod-log-entry'>
              <ActionLogBadge actionType={entry.actionType} />
              <div className='mod-log-info'>
                <span className='mod-log-target'>
                  {entry.action}: <strong>{entry.target}</strong>
                </span>
                <span className='mod-log-meta'>
                  by u/{entry.moderator}
                  <span className='mod-meta-sep'>·</span>
                  {entry.date}
                </span>
              </div>
            </div>
          ))}
        </div>
        <button className='mod-link-btn' onClick={() => onNavigate('modlog')}>
          View full mod log →
        </button>
      </div>
    </div>
  )
}

// ─── REPORTS TAB ─────────────────────────────────────────────────────────────

function ReportsTab() {
  const [filter, setFilter] = useState('All')
  const [reports, setReports] = useState(MOCK_REPORTS)

  const filtered = filter === 'All' ? reports : reports.filter((r) => r.type === filter)

  const handleDismiss = (id) => setReports((prev) => prev.filter((r) => r.id !== id))
  const handleRemove  = (id) => setReports((prev) => prev.filter((r) => r.id !== id))

  return (
    <div className='mod-tab-content'>
      <div className='mod-section-header'>
        <h2 className='mod-section-title'>Reports</h2>
        <p className='mod-section-subtitle'>
          Review content reported by community members. Take action to keep the community healthy.
        </p>
      </div>

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
                <TypeBadge type={report.type} />
                <span className='mod-report-reason'>
                  <FaExclamationTriangle className='mod-reason-icon' /> {report.reason}
                </span>
                <span className='mod-report-date'>{report.createdAt}</span>
              </div>
              {report.title && <h4 className='mod-report-title'>{report.title}</h4>}
              <p className='mod-report-preview'>{report.contentPreview}</p>
              <div className='mod-report-meta'>
                <span>Reported by: <strong>u/{report.reporter}</strong></span>
                <span className='mod-meta-sep'>·</span>
                <span>Author: <strong>u/{report.reportedUser}</strong></span>
              </div>
              <div className='mod-report-actions'>
                <button className='mod-btn mod-btn-ghost' onClick={() => handleDismiss(report.id)}>
                  <FaTimes /> Dismiss
                </button>
                <button className='mod-btn mod-btn-warning'>
                  <FaExclamationTriangle /> Warn User
                </button>
                <button className='mod-btn mod-btn-danger' onClick={() => handleRemove(report.id)}>
                  <FaTrash /> Remove Content
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── MEMBERS TAB ─────────────────────────────────────────────────────────────

function MembersTab() {
  const [search, setSearch]       = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [members, setMembers]     = useState(MOCK_MEMBERS)

  const filtered = members.filter((m) => {
    const matchSearch = m.username.toLowerCase().includes(search.toLowerCase())
    const matchRole   = roleFilter === 'All' || m.role === roleFilter.toLowerCase()
    return matchSearch && matchRole
  })

  const handlePromote = (id) =>
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role: 'moderator' } : m)))
  const handleDemote  = (id) =>
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role: 'member' } : m)))
  const handleKick    = (id) =>
    setMembers((prev) => prev.filter((m) => m.id !== id))

  return (
    <div className='mod-tab-content'>
      <div className='mod-section-header'>
        <h2 className='mod-section-title'>Members</h2>
        <p className='mod-section-subtitle'>
          Manage members, promote moderators, and remove users who violate community rules.
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

      <div className='mod-member-list'>
        {filtered.length === 0 ? (
          <div className='mod-empty-state'>
            <FaUsers className='mod-empty-icon' />
            <p>No members found matching your search.</p>
          </div>
        ) : (
          filtered.map((member) => (
            <div key={member.id} className='mod-member-card'>
              <div
                className='mod-member-avatar'
                style={{ '--avatar-color': stringToColor(member.username) }}
              >
                {member.username[0].toUpperCase()}
              </div>
              <div className='mod-member-info'>
                <div className='mod-member-name-row'>
                  <Link to={`/user/${member.username}`} className='mod-member-username'>
                    u/{member.username}
                  </Link>
                  <RoleBadge role={member.role} />
                </div>
                <div className='mod-member-meta'>
                  <span>{member.karma.toLocaleString()} karma</span>
                  <span className='mod-meta-sep'>·</span>
                  <span>Joined {member.joinedAt}</span>
                </div>
              </div>
              {member.role !== 'owner' && (
                <div className='mod-member-actions'>
                  {member.role === 'member' && (
                    <button
                      className='mod-btn mod-btn-sm mod-btn-blue'
                      onClick={() => handlePromote(member.id)}
                    >
                      <FaUserShield /> Promote
                    </button>
                  )}
                  {member.role === 'moderator' && (
                    <button
                      className='mod-btn mod-btn-sm mod-btn-ghost'
                      onClick={() => handleDemote(member.id)}
                    >
                      Demote
                    </button>
                  )}
                  <button
                    className='mod-btn mod-btn-sm mod-btn-danger'
                    onClick={() => handleKick(member.id)}
                  >
                    <FaBan /> Kick
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ─── PINNED POSTS TAB ────────────────────────────────────────────────────────

const MAX_PINS = 3

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

  const pinned   = posts.filter((p) =>  p.pinned)
  const unpinned = posts.filter((p) => !p.pinned)

  return (
    <div className='mod-tab-content'>
      <div className='mod-section-header'>
        <h2 className='mod-section-title'>Pinned Posts</h2>
        <p className='mod-section-subtitle'>
          Pinned posts appear at the top of your community feed. Maximum {MAX_PINS} posts can be pinned at a time.
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

function CommunitySettingsTab() {
  const [community, setCommunity] = useState(MOCK_COMMUNITY)
  const [rules, setRules]         = useState(MOCK_COMMUNITY.rules)
  const [newRule, setNewRule]     = useState('')
  const [saved, setSaved]         = useState(false)

  const handleSave = (e) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const addRule = () => {
    if (!newRule.trim()) return
    setRules((prev) => [...prev, newRule.trim()])
    setNewRule('')
  }
  const removeRule = (i) => setRules((prev) => prev.filter((_, idx) => idx !== i))

  return (
    <div className='mod-tab-content'>
      <div className='mod-section-header'>
        <h2 className='mod-section-title'>Community Settings</h2>
        <p className='mod-section-subtitle'>
          Edit your community's appearance, description, and rules.
        </p>
      </div>

      {saved && <div className='mod-status-success'>Settings saved successfully!</div>}

      <form className='mod-settings-form' onSubmit={handleSave}>

        {/* Identity */}
        <div className='mod-settings-section'>
          <h3 className='mod-settings-section-title'>Identity</h3>

          <div className='mod-media-upload-row'>
            <div className='mod-media-upload-item'>
              <label className='mod-settings-label'>Community Avatar</label>
              <div className='mod-media-upload-zone mod-media-avatar-zone'>
                <FaEdit className='mod-media-icon' />
                <span className='mod-media-hint'>Click to upload</span>
              </div>
            </div>
            <div className='mod-media-upload-item mod-media-banner-item'>
              <label className='mod-settings-label'>Community Banner</label>
              <div className='mod-media-upload-zone mod-media-banner-zone'>
                <FaEdit className='mod-media-icon' />
                <span className='mod-media-hint'>Click to upload · recommended 1920×320 px</span>
              </div>
            </div>
          </div>

          <div className='mod-form-group'>
            <label className='mod-settings-label'>Community Name</label>
            <input
              className='mod-settings-input'
              value={community.title}
              onChange={(e) => setCommunity((prev) => ({ ...prev, title: e.target.value }))}
              placeholder='Community name'
            />
          </div>

          <div className='mod-form-group'>
            <label className='mod-settings-label'>Description</label>
            <textarea
              className='mod-settings-input mod-settings-textarea'
              value={community.description}
              onChange={(e) =>
                setCommunity((prev) => ({ ...prev, description: e.target.value }))
              }
              rows={4}
              maxLength={500}
              placeholder='Describe your community...'
            />
            <span className='mod-char-count'>{community.description.length}/500</span>
          </div>

          <div className='mod-form-row'>
            <div className='mod-form-group'>
              <label className='mod-settings-label'>Category</label>
              <select
                className='mod-settings-input mod-settings-select'
                value={community.category}
                onChange={(e) =>
                  setCommunity((prev) => ({ ...prev, category: e.target.value }))
                }
              >
                {['Technology', 'Science', 'Gaming', 'Sports', 'Art', 'Music', 'Education', 'Other'].map(
                  (c) => <option key={c} value={c}>{c}</option>,
                )}
              </select>
            </div>
            <div className='mod-form-group'>
              <label className='mod-settings-label'>Community Type</label>
              <select
                className='mod-settings-input mod-settings-select'
                value={community.type}
                onChange={(e) =>
                  setCommunity((prev) => ({ ...prev, type: e.target.value }))
                }
              >
                <option value='public'>Public — anyone can view and post</option>
                <option value='restricted'>Restricted — anyone can view, only mods post</option>
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
                if (e.key === 'Enter') { e.preventDefault(); addRule() }
              }}
            />
            <button type='button' className='mod-btn mod-btn-secondary' onClick={addRule}>
              Add Rule
            </button>
          </div>
        </div>

        <div className='mod-form-actions'>
          <button type='submit' className='mod-btn mod-btn-primary'>Save Changes</button>
        </div>

        {/* Danger Zone */}
        <div className='mod-danger-zone'>
          <h3 className='mod-danger-title'>
            <FaExclamationTriangle /> Danger Zone
          </h3>
          <div className='mod-danger-item'>
            <div className='mod-danger-info'>
              <strong>Delete Community</strong>
              <p>Permanently delete this community and all its posts. This action cannot be undone.</p>
            </div>
            <button type='button' className='mod-btn mod-btn-danger-solid'>
              Delete Community
            </button>
          </div>
        </div>

      </form>
    </div>
  )
}

// ─── MOD LOG TAB ─────────────────────────────────────────────────────────────

function ModLogTab() {
  return (
    <div className='mod-tab-content'>
      <div className='mod-section-header'>
        <h2 className='mod-section-title'>Mod Log</h2>
        <p className='mod-section-subtitle'>
          A transparent record of all moderation actions taken in this community.
        </p>
      </div>

      <div className='mod-log-list mod-log-full'>
        {MOCK_MOD_LOG.map((entry) => (
          <div key={entry.id} className='mod-log-entry mod-log-entry-full'>
            <div className='mod-log-entry-left'>
              <ActionLogBadge actionType={entry.actionType} />
            </div>
            <div className='mod-log-info'>
              <span className='mod-log-target'>
                <strong>{entry.action}</strong>: {entry.target}
                {entry.targetUser && (
                  <>
                    {' '}(
                    <Link to={`/user/${entry.targetUser}`} className='mod-log-user-link'>
                      u/{entry.targetUser}
                    </Link>
                    )
                  </>
                )}
              </span>
              <span className='mod-log-meta'>
                by{' '}
                <Link to={`/user/${entry.moderator}`} className='mod-log-user-link'>
                  u/{entry.moderator}
                </Link>
                <span className='mod-meta-sep'>·</span>
                {entry.date}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export function CommunityModPage() {
  const { communityname } = useParams()
  const [activeTab, setActiveTab] = useState('overview')

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <OverviewTab onNavigate={setActiveTab} />
      case 'reports':  return <ReportsTab />
      case 'members':  return <MembersTab />
      case 'pinned':   return <PinnedTab />
      case 'settings': return <CommunitySettingsTab />
      case 'modlog':   return <ModLogTab />
      default:         return <OverviewTab onNavigate={setActiveTab} />
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
          <div>
            <h1 className='mod-page-title'>Mod Tools</h1>
            <p className='mod-page-subtitle'>c/{communityname}</p>
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
                {item.badge && <span className='mod-nav-badge'>{item.badge}</span>}
              </button>
            )
          })}
        </nav>

        <div className='mod-content-area'>
          {renderContent()}
        </div>
      </div>
    </main>
  )
}
