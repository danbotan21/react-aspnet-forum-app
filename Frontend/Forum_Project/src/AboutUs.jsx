import { useNavigate } from 'react-router-dom'
import './Styles/AboutUs.css'
import hello_robot from './img/hello_robot.webp'
import forum from './img/Forumm.png'
import socialmedia from './img/posteaza-socialmedia.png'
import comments from './img/coments.jpg'
import community from './img/community.webp'

export const AboutUs = () => {
  const navigate = useNavigate()

  return (
    <main className='app-main'>
      <section className='about-banner'>
        <div className='about-banner-content'>
          <h1 className='about-banner-title'>Despre Forumul Nostru</h1>
          <p className='about-banner-subtitle'>
            Construim o comunitate unde ideile contează, discuțiile sunt
            constructive și fiecare voce este auzită. Alătură-te nouă și
            descoperă puterea colaborării.
          </p>
        </div>
        <div className='about-banner-visual'>
          <img
            src={hello_robot}
            alt='Robot Forum'
            className='about-banner-image'
          />
        </div>
      </section>

      <div className='about-container'>
        <section className='about-section about-section--reverse'>
          <div className='about-section-visual'>
            <img
              src={forum}
              alt='Platforma funcționează'
              className='about-section-image'
            />
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

        <section className='about-section'>
          <div className='about-section-content'>
            <h2 className='about-section-title'>Postează</h2>
            <p className='about-section-desc'>
              Comunitatea poate împărtăși conținut prin postări: texte, linkuri,
              imagini și video. Poți crea, edita și șterge postări și contribui
              activ la conținutul comunităților.
            </p>
            <ul className='about-features'>
              <li className='about-feature'>📝 Texte și linkuri</li>
              <li className='about-feature'>🖼️ Imagini și video</li>
              <li className='about-feature'>✏️ Editează și șterge</li>
            </ul>
          </div>
          <div className='about-section-visual'>
            <img
              src={socialmedia}
              alt='Postează conținut'
              className='about-section-image'
            />
          </div>
        </section>

        <section className='about-section about-section--reverse'>
          <div className='about-section-visual'>
            <img
              src={comments}
              alt='Comentează și discută'
              className='about-section-image'
            />
          </div>
          <div className='about-section-content'>
            <h2 className='about-section-title'>Comentează</h2>
            <p className='about-section-desc'>
              Membrii comentează postările. Comentariile susțin discuția și
              schimbul de feedback, iar căutarea te ajută să găsești rapid
              postări și comunități de interes.
            </p>
            <ul className='about-features'>
              <li className='about-feature'>💬 Discuții constructive</li>
              <li className='about-feature'>🔍 Căutare avansată</li>
              <li className='about-feature'>⭐ Feedback valoros</li>
            </ul>
          </div>
        </section>

        <section className='about-section'>
          <div className='about-section-content'>
            <h2 className='about-section-title'>Comunități și siguranță</h2>
            <p className='about-section-desc'>
              Poți crea și administra comunități tematice. Un sistem de moderare
              menține mediul sigur și respectuos. Profilul tău și documentația
              tehnică susțin un proces orientat spre calitate.
            </p>
            <ul className='about-features'>
              <li className='about-feature'>👥 Comunități tematice</li>
              <li className='about-feature'>🛡️ Moderare avansată</li>
              <li className='about-feature'>📋 Profil personalizat</li>
            </ul>
          </div>
          <div className='about-section-visual'>
            <img
              src={community}
              alt='Comunități sigure'
              className='about-section-image'
            />
          </div>
        </section>

        <section className='about-cta-section'>
          <div className='about-cta-content'>
            <h2 className='about-cta-title'>Pregătit să începi?</h2>
            <p className='about-cta-desc'>
              Oferim un instrument digital <strong>eficient</strong>,{' '}
              <strong>accesibil</strong> și <strong>adaptabil</strong> pentru
              comunități online organizate și responsabile.
            </p>
            <button
              type='button'
              className='about-cta-button about-cta-button--secondary'
              onClick={() => navigate('/home')}
            >
              Alătură-te comunității
            </button>
          </div>
          <div className='about-cta-visual'>
            <img
              src={hello_robot}
              alt='Alătură-te comunității'
              className='about-cta-image'
            />
          </div>
        </section>
      </div>
    </main>
  )
}
