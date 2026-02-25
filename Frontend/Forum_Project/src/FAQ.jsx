import { useState } from 'react'
import './Styles/FAQ.css'
import { FaChevronDown, FaQuestion, FaPhone } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'

const FAQ_ITEMS = [
  {
    id: 1,
    question: 'Cum îmi creez un cont pe platformă?',
    answer:
      'Poți crea un cont din meniul principal: apasă pe „Înregistrare" (sau „Register") și completează datele solicitate (email, nume de utilizator, parolă). După confirmare, te poți autentifica oricând din pagina de Login. Contul îți oferă acces la profil, postări și comunități.',
  },
  {
    id: 2,
    question: 'Cum creez o postare într-o comunitate?',
    answer:
      'Intră în comunitatea dorită și apasă pe „Creează postare" sau folosește opțiunea din meniu. Poți adăuga titlu, text, linkuri sau imagini. Postările pot fi editate sau șterse din contul tău. Asigură-te că respecti regulile comunității.',
  },
  {
    id: 3,
    question: 'Cum pot crea sau administra o comunitate?',
    answer:
      'Din sidebar, accesează „Start Community". După crearea comunității, o poți administra din setările acesteia: poți invita membri, defini reguli și modera conținutul. Doar creatorul și moderatorii pot gestiona comunitatea.',
  },
  {
    id: 4,
    question: 'Cum funcționează comentariile și notificările?',
    answer:
      'Sub fiecare postare poți lăsa comentarii și răspunde la cele ale altora. Poți activa notificări pentru răspunsuri la postările sau comentariile tale din secțiunea „Notificări" din meniu. Setările de notificare pot fi ajustate din profil.',
  },
  {
    id: 5,
    question: 'Cum găsesc postări sau comunități de interes?',
    answer:
      'Folosește bara de căutare pentru cuvinte cheie, nume de comunități sau teme. Poți explora comunități din secțiunile „Popular" și „Explore" din sidebar. Rezultatele pot fi filtrate după relevanță sau dată.',
  },
  {
    id: 6,
    question: 'Ce se întâmplă dacă încălc regulile sau sunt moderat?',
    answer:
      'Platforma folosește un sistem de moderare pentru un mediu sigur și respectuos. Conținutul neadecvat poate fi editat sau eliminat, iar în cazuri repetate contul poate fi restricționat. Regulile fiecărei comunități sunt afișate în descrierea acesteia. Pentru contestații, contactează echipa prin pagina „Contact us".',
  },
  {
    id: 7,
    question: 'Cum îmi actualizez profilul sau parola?',
    answer:
      'Din meniul contului (profil) poți modifica informațiile personale, poza de profil și preferințele de afișare. Pentru schimbarea parolei, folosește opțiunea „Schimbă parola" din setările de securitate. Modificările sunt salvate imediat.',
  },
]

export const FAQ = () => {
  const [openId, setOpenId] = useState(FAQ_ITEMS[0].id)
  const navigate = useNavigate()

  const toggle = (id) => {
    setOpenId((prev) => (prev === id ? null : id))
  }

  return (
    <main className='app-main faq-page'>
      <div className='faq-container'>
        {/* Hero banner */}
        <section className='faq-hero'>
          <div className='faq-hero-icon'>
            <FaQuestion />
          </div>
          <div className='faq-hero-text'>
            <h1 className='faq-title'>Întrebări frecvente</h1>
            <p className='faq-tagline'>
              Răspunsuri rapide despre cont, postări, comunități și moderare.
            </p>
          </div>
        </section>

        {/* Accordion */}
        <section className='faq-accordion-wrapper'>
          <div className='faq-accordion'>
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openId === item.id
              return (
                <div
                  key={item.id}
                  className={`faq-item ${isOpen ? 'faq-item--open' : ''}`}
                  // className='faq-item'
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
                </div>
              )
            })}
          </div>
        </section>

        {/* Contact card */}
        <div className='faq-contact-card'>
          <div className='faq-contact-text'>
            <h3>Nu ai găsit răspunsul?</h3>
            <p>Echipa noastră este disponibilă să te ajute direct.</p>
          </div>
          <button
            type='button'
            className='faq-contact-btn'
            onClick={() => navigate('/contact')}
          >
            <FaPhone style={{ fontSize: '0.78rem' }} />
            Contactează-ne
          </button>
        </div>
      </div>
    </main>
  )
}
