import { useState } from 'react'
import './Styles/FAQ.css'
import {
  FaChevronDown,
  FaQuestionCircle,
  FaPhone,
  FaFileContract,
} from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'

const FAQ_ITEMS = [
  {
    id: 1,
    question: 'Cum imi creez un cont pe platforma?',
    answer:
      'Poti crea un cont din meniul principal: apasa pe Inregistrare, completeaza email, nume de utilizator si parola, apoi confirma datele. Dupa aceea te poti autentifica din pagina de Login.',
  },
  {
    id: 2,
    question: 'Cum creez o postare intr-o comunitate?',
    answer:
      'Intra in comunitatea dorita si apasa pe Creeaza postare. Poti adauga titlu, text, link-uri sau imagini. Postarile tale pot fi editate sau sterse din contul personal.',
  },
  {
    id: 3,
    question: 'Cum pot crea sau administra o comunitate?',
    answer:
      'Din sidebar foloseste Start Community. Dupa creare, poti configura reguli, invita membri si modera continutul. Doar creatorul si moderatorii au acces la setarile avansate.',
  },
  {
    id: 4,
    question: 'Cum functioneaza comentariile si notificarile?',
    answer:
      'Sub fiecare postare poti lasa comentarii si raspunsuri. Pentru activitate noua primesti notificari in sectiunea Notification, iar preferintele pot fi ajustate din profil.',
  },
  {
    id: 5,
    question: 'Cum gasesc postari sau comunitati de interes?',
    answer:
      'Foloseste cautarea dupa cuvinte cheie si exploreaza zonele Popular si Explore din sidebar. Rezultatele sunt organizate dupa relevanta si continut recent.',
  },
  {
    id: 6,
    question: 'Ce se intampla daca incalc regulile?',
    answer:
      'Platforma foloseste moderare pentru a mentine un spatiu sigur. Continutul neadecvat poate fi eliminat, iar in cazuri repetate contul poate fi restrictionat temporar sau permanent.',
  },
  {
    id: 7,
    question: 'Cum imi actualizez profilul sau parola?',
    answer:
      'Din profil poti modifica datele personale, imaginea si preferintele. Pentru schimbarea parolei, acceseaza setarile de securitate si confirma parola noua.',
  },
]

export const FAQ = () => {
  const [openIds, setOpenIds] = useState([FAQ_ITEMS[0].id])
  const navigate = useNavigate()

  const toggle = (id) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  const openAll = () => {
    setOpenIds(FAQ_ITEMS.map((item) => item.id))
  }

  const closeAll = () => {
    setOpenIds([])
  }

  return (
    <main className='app-main faq-page'>
      <div className='faq-shell'>
        <section className='faq-hero'>
          <div className='faq-badge'>SUPPORT CENTER</div>
          <h1 className='faq-title'>Intrebari frecvente</h1>
          <p className='faq-tagline'>
            Raspunsuri rapide pentru cont, postari, comunitati si moderare.
          </p>
          <div className='faq-meta'>
            <span>{FAQ_ITEMS.length} intrebari esentiale</span>
            <span>Timp mediu raspuns: sub 24h</span>
          </div>
        </section>

        <section className='faq-panel'>
          <div className='faq-panel-head'>
            <div>
              <h2>Ghid rapid</h2>
              <p>Deschide intrebarea care te intereseaza.</p>
            </div>
            <div className='faq-actions'>
              <button
                type='button'
                className='faq-action-btn'
                onClick={openAll}
              >
                Extinde tot
              </button>
              <button
                type='button'
                className='faq-action-btn faq-action-btn--ghost'
                onClick={closeAll}
              >
                Restrange tot
              </button>
            </div>
          </div>

          <div className='faq-accordion'>
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openIds.includes(item.id)

              return (
                <article
                  key={item.id}
                  className={`faq-item ${isOpen ? 'faq-item--open' : ''}`}
                >
                  <button
                    type='button'
                    className='faq-question'
                    onClick={() => toggle(item.id)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${item.id}`}
                    id={`faq-question-${item.id}`}
                  >
                    <span className='faq-question-left'>
                      <span className='faq-question-num'>{index + 1}</span>
                      <span className='faq-question-text'>{item.question}</span>
                    </span>
                    <span
                      className={`faq-question-icon ${isOpen ? 'rotated' : ''}`}
                      aria-hidden='true'
                    >
                      <FaChevronDown className='faq-chevron' />
                    </span>
                  </button>

                  <div
                    id={`faq-answer-${item.id}`}
                    className='faq-answer'
                    role='region'
                    aria-labelledby={`faq-question-${item.id}`}
                    hidden={!isOpen}
                  >
                    <p className='faq-answer-text'>{item.answer}</p>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <section className='faq-contact-card'>
          <div className='faq-contact-left'>
            <FaQuestionCircle className='faq-contact-icon' />
            <div className='faq-contact-text'>
              <h3>Nu ai gasit raspunsul?</h3>
              <p>Echipa noastra te poate ajuta direct.</p>
            </div>
          </div>

          <div className='faq-contact-actions'>
            <button
              type='button'
              className='faq-contact-btn'
              onClick={() => navigate('/contact')}
            >
              <FaPhone />
              Contacteaza-ne
            </button>
            <button
              type='button'
              className='faq-contact-btn faq-contact-btn--secondary'
              onClick={() => navigate('/terms')}
            >
              <FaFileContract />
              Vezi termenii
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}
