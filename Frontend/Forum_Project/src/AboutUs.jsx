import { useNavigate } from 'react-router-dom'
import './Styles/AboutUs.css'

const COMMUNITY_TAGS = [
  { label: 'Comunități', color: 'tag-pink' },
  { label: 'Postări', color: 'tag-orange' },
  { label: 'Comentarii', color: 'tag-green' },
  { label: 'Moderare', color: 'tag-yellow' },
  { label: 'Profil', color: 'tag-blue' },
  { label: 'Căutare', color: 'tag-teal' },
  { label: 'Teme', color: 'tag-purple' },
  { label: 'Colaborare', color: 'tag-coral' },
  { label: 'Securitate', color: 'tag-mint' },
  { label: 'Feedback', color: 'tag-amber' },
]

export const AboutUs = () => {
  const navigate = useNavigate()

  return (
    <main className='app-main about-us-page'>
      <div className='about-us-container'>
        {/* Section 1: Cum funcționează — tag cloud (stânga) + text + CTA (dreapta) */}
        <section className='about-section about-section--reverse'>
          <div className='about-section-visual about-visual-tags'>
            <div className='tag-cloud'>
              {COMMUNITY_TAGS.map(({ label, color }) => (
                <span key={label} className={`tag-pill ${color}`}>
                  {label}
                </span>
              ))}
            </div>
            <div className='tag-cloud-icon' aria-hidden>
              <svg viewBox='0 0 24 24' fill='currentColor'>
                <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z' />
              </svg>
            </div>
          </div>
          <div className='about-section-content'>
            <h2 className='about-section-title'>Cum funcționează platforma?</h2>
            <p className='about-section-desc'>
              Zilnic, utilizatorii postează, votează și comentează în comunități
              organizate după interese. Platforma oferă un mediu sigur,
              organizat și intuitiv pentru comunicare, colaborare și schimb de
              idei.
            </p>
            <button
              type='button'
              className='about-cta'
              onClick={() => navigate('/home')}
            >
              Explorează platforma
            </button>
          </div>
        </section>

        {/* Section 2: Postează — text (stânga) + visual (dreapta) */}
        <section className='about-section'>
          <div className='about-section-content'>
            <h2 className='about-section-title'>Postează</h2>
            <p className='about-section-desc'>
              Comunitatea poate împărtăși conținut prin postări: texte, linkuri,
              imagini și video. Poți crea, edita și șterge postări și contribui
              activ la conținutul comunităților.
            </p>
          </div>
          <div className='about-section-visual about-visual-frame about-visual-frame--orange'>
            <div className='about-mock-post'>
              <div className='about-mock-post-preview' />
              <div className='about-mock-post-title'>Creează o postare</div>
              <div className='about-mock-post-btn'>Postează</div>
            </div>
          </div>
        </section>

        {/* Section 3: Comentează — visual (stânga) + text (dreapta) */}
        <section className='about-section about-section--reverse'>
          <div className='about-section-visual about-visual-frame about-visual-frame--teal'>
            <div className='about-mock-comments'>
              <div className='about-mock-comment'>
                „Răspuns rapid și util. Îmi place comunitatea!”
              </div>
              <div className='about-mock-comment'>
                „Discuțiile aici sunt constructive și oneste.”
              </div>
            </div>
          </div>
          <div className='about-section-content'>
            <h2 className='about-section-title'>Comentează</h2>
            <p className='about-section-desc'>
              Membrii comentează postările. Comentariile susțin discuția și
              schimbul de feedback, iar căutarea te ajută să găsești rapid
              postări și comunități de interes.
            </p>
          </div>
        </section>

        {/* Section 4: Comunități + moderare — text (stânga) + visual (dreapta) */}
        <section className='about-section'>
          <div className='about-section-content'>
            <h2 className='about-section-title'>Comunități și siguranță</h2>
            <p className='about-section-desc'>
              Poți crea și administra comunități tematice. Un sistem de
              moderare menține mediul sigur și respectuos. Profilul tău și
              documentația tehnică susțin un proces orientat spre calitate.
            </p>
          </div>
          <div className='about-section-visual about-visual-frame about-visual-frame--soft'>
            <div className='about-mock-features'>
              <span className='about-mock-feature'>👥 Comunități</span>
              <span className='about-mock-feature'>🛡️ Moderare</span>
              <span className='about-mock-feature'>📋 Profil</span>
            </div>
          </div>
        </section>

        {/* Closing + CTA */}
        <section className='about-closing'>
          <p>
            Oferim un instrument digital <strong>eficient</strong>,{' '}
            <strong>accesibil</strong> și <strong>adaptabil</strong> pentru
            comunități online organizate și responsabile.
          </p>
          <button
            type='button'
            className='about-cta about-cta--secondary'
            onClick={() => navigate('/home')}
          >
            Începe acum
          </button>
        </section>
      </div>
    </main>
  )
}
