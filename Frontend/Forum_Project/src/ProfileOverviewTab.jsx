export function ProfileOverviewTab({ displayName, statCards, isOwnProfile }) {
  return (
    <section className='tab-panel'>
      <div className='overview-grid'>
        <article className='overview-card'>
          <h2>Profile description</h2>
          <p>
            {isOwnProfile
              ? 'Here is the description of the user. He can write in here whatever he will want. Here is the description of the user. He can write in here whatever he will want. Here is the description of the user. He can write in here whatever he will want.'
              : `${displayName} has not added a bio yet. Check their posts and comments to learn more about them.`}
          </p>
        </article>
        <article className='overview-card'>
          <h3>{displayName}</h3>
          <div className='side-stats-grid overview-stats-grid'>
            {statCards.map((stat) => (
              <div key={stat.label} className='side-stat-item'>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  )
}
