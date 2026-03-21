import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import './Styles/UserProfile.css'
import avatar from './img/avatar.webp'
import nature from './img/nature.jpg'

export function UserProfile() {
	const { username } = useParams()

	const loggedUser = 'username'
	const displayName = decodeURIComponent(username ?? 'guest')
	const isOwnProfile = displayName.toLowerCase() === loggedUser.toLowerCase()

	const ownTabs = [
		'Overview',
		'Posts',
		'Comments',
		'Saved',
		'History',
		'Hidden',
		'Upvoted',
		'Downvoted',
	]

	const visitorTabs = ['Overview', 'Posts', 'Comments']

	const recentComments = [
		{
			id: 1,
			community: 'r/ketorecipes',
			postTitle: 'Skirt Steak',
			content: 'Great method. I tried it with smoked paprika and worked perfectly.',
			score: 7,
			time: '11 hr. ago',
		},
		{
			id: 2,
			community: 'r/15minutefood',
			postTitle: 'Quick lunch ideas',
			content: 'Loved this, super fast and still healthy.',
			score: 3,
			time: '12 hr. ago',
		},
	]

	const ownStatCards = [
		{ label: 'Karma', value: '1.2k' },
		{ label: 'Contributions', value: '214' },
		{ label: 'Cake Day', value: '3y' },
		{ label: 'Followers', value: '12' },
	]

	const visitorStatCards = [
		{ label: 'Karma', value: '619' },
		{ label: 'Contributions', value: '84' },
		{ label: 'Cake Day', value: '1y' },
		{ label: 'Followers', value: '5' },
	]

	const statCards = isOwnProfile ? ownStatCards : visitorStatCards
	const tabs = isOwnProfile ? ownTabs : visitorTabs
	const [activeTab, setActiveTab] = useState(tabs[0])
	const getCommunitySlug = (community) => community.replace(/^r\//, '')

	const renderOwnTab = () => {
		if (activeTab === 'Overview') {
			return (
				<section className='tab-panel'>
					<div className='overview-grid'>
						<article className='overview-card'>
							<h2>Profile overview</h2>
							<p>
								Your activity and contributions are shown here. Use the tabs to quickly
								navigate between your public and private sections.
							</p>
						</article>
						<article className='overview-card'>
							<h3>Quick actions</h3>
							<div className='overview-actions'>
								<Link to='/create-post' className='profile-btn profile-btn-primary'>
									Create post
								</Link>
								<Link to='/edit-avatar' className='profile-btn profile-btn-secondary'>
									Update profile
								</Link>
							</div>
						</article>
					</div>
				</section>
			)
		}

		if (activeTab === 'Posts') {
			return (
			<section className='tab-panel'>
				<div className='feed-filter'>
					<span>Showing all posts</span>
				</div>
				<div className='feed-empty'>
					<div className='feed-empty-icon'>0</div>
					<h2>You do not have any posts yet</h2>
					<p>Once you publish in a community, your activity will appear here.</p>
					<Link to='/create-post' className='profile-btn profile-btn-primary'>
						Create first post
					</Link>
				</div>
			</section>
			)
		}

		if (activeTab === 'Comments') {
			return (
				<section className='tab-panel'>
					<div className='visitor-comments'>
						{recentComments.map((comment) => (
							<article key={comment.id} className='visitor-comment-card'>
								<div className='visitor-comment-head'>
									<Link
										to={`/community/${encodeURIComponent(getCommunitySlug(comment.community))}`}
										className='profile-community-link'
									>
										{comment.community}
									</Link>
									<span>{comment.postTitle}</span>
								</div>
								<p>{comment.content}</p>
								<div className='visitor-comment-meta'>
									<span>{comment.score} points</span>
									<span>{comment.time}</span>
								</div>
							</article>
						))}
					</div>
				</section>
			)
		}

		return (
			<section className='tab-panel'>
				<div className='feed-empty feed-empty-short'>
					<div className='feed-empty-icon'>+</div>
					<h2>{activeTab}</h2>
					<p>
						This section is ready and can be connected to backend data when API
						permissions are available.
					</p>
				</div>
			</section>
		)
	}

	const renderVisitorTab = () => {
		if (activeTab === 'Overview') {
			return (
				<section className='tab-panel'>
					<div className='overview-grid'>
						<article className='overview-card'>
							<h2>Public overview</h2>
							<p>
								This profile view is limited and contains only public details and
								recent community activity.
							</p>
						</article>
						<article className='overview-card'>
							<h3>Recent activity</h3>
							<p>Mostly active in cooking and fast recipe communities.</p>
						</article>
					</div>
				</section>
			)
		}

		if (activeTab === 'Posts') {
			return (
				<section className='tab-panel'>
					<div className='feed-empty feed-empty-short'>
						<div className='feed-empty-icon'>0</div>
						<h2>No public posts</h2>
						<p>This user has not published public posts yet.</p>
					</div>
				</section>
			)
		}

		return (
			<section className='tab-panel'>
				<div className='visitor-comments'>
					{recentComments.map((comment) => (
						<article key={comment.id} className='visitor-comment-card'>
							<div className='visitor-comment-head'>
								<Link
									to={`/community/${encodeURIComponent(getCommunitySlug(comment.community))}`}
									className='profile-community-link'
								>
									{comment.community}
								</Link>
								<span>{comment.postTitle}</span>
							</div>
							<p>{comment.content}</p>
							<div className='visitor-comment-meta'>
								<span>{comment.score} points</span>
								<span>{comment.time}</span>
							</div>
						</article>
					))}
				</div>
			</section>
		)
	}

	return (
		<main className='user-profile-page'>
			<section className='user-profile-shell'>
				<div className='user-profile-main'>
					<header className='user-hero'>
						<div className='user-hero-banner'>
							<img src={nature} alt='Profile banner' className='user-hero-banner-image' />
							{isOwnProfile ? (
								<button type='button' className='user-hero-banner-button'>
									Change banner
								</button>
							) : null}
						</div>

						<div className='user-hero-body'>
							<img src={avatar} alt='Avatar' className='user-hero-avatar' />

							<div className='user-hero-meta'>
								<h1>{displayName}</h1>
								<p>u/{displayName}</p>
							</div>

							<div className='user-hero-actions'>
								{isOwnProfile ? (
									<>
										<Link to='/create-post' className='profile-btn profile-btn-primary'>
											Create Post
										</Link>
										<Link to='/edit-avatar' className='profile-btn profile-btn-secondary'>
											Update Profile
										</Link>
									</>
								) : (
									<>
										<button type='button' className='profile-btn profile-btn-primary'>
											Follow
										</button>
										<button type='button' className='profile-btn profile-btn-secondary'>
											Start Chat
										</button>
										<button type='button' className='profile-btn profile-btn-danger'>
											Report
										</button>
									</>
								)}
							</div>
						</div>

						<nav className='user-tabs' aria-label='Profile sections'>
							{tabs.map((tab) => (
								<button
									key={tab}
									type='button'
									onClick={() => setActiveTab(tab)}
									className={`user-tab ${activeTab === tab ? 'user-tab-active' : ''}`}
								>
									{tab}
								</button>
							))}
						</nav>
					</header>

					<section className='user-feed-card'>
						{isOwnProfile ? renderOwnTab() : renderVisitorTab()}
					</section>
				</div>

				<aside className='user-profile-side'>
					<section className='side-card'>
						<h3>{displayName}</h3>
						<div className='side-stats-grid'>
							{statCards.map((stat) => (
								<div key={stat.label} className='side-stat-item'>
									<strong>{stat.value}</strong>
									<span>{stat.label}</span>
								</div>
							))}
						</div>
					</section>

					<section className='side-card'>
						<h4>Achievements</h4>
						<div className='badge-row'>
							<span className='badge-pill'>Contributor</span>
							<span className='badge-pill'>Top Commenter</span>
							<span className='badge-pill'>Verified</span>
						</div>
					</section>
				</aside>
			</section>
		</main>
	)
}
