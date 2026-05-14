import { Link } from 'react-router-dom'
import './Styles/Terms&Conditions.css'

const TERMS_SECTIONS = [
  {
    title: ' Acceptarea termenilor',
    body: 'Prin accesarea sau utilizarea platformei noastre, confirmi ca ai citit, inteles si acceptat acesti Termeni si Conditii. Daca nu esti de acord cu o parte din continut, trebuie sa opresti utilizarea serviciului.',
  },
  {
    title: ' Eligibilitate si cont',
    body: 'Esti responsabil pentru datele furnizate la inregistrare si pentru securitatea contului tau. Nu ai voie sa folosesti un cont fals, sa impersonifici alte persoane sau sa distribui datele de acces catre terti.',
  },
  {
    title: ' Continut publicat de utilizatori',
    body: 'Tu ramai proprietarul continutului pe care il postezi, dar ne oferi o licenta neexclusiva pentru afisarea, distribuirea si promovarea lui in cadrul serviciului. Putem elimina continut care incalca regulile comunitatii sau legislatia aplicabila.',
  },
  {
    title: ' Colectarea, utilizarea si vanzarea datelor',
    body: 'Colectam date despre activitatea ta pe platforma (ex: date de cont, interactiuni, preferinte, date tehnice). Folosim aceste date pentru securitate, personalizare, statistici si publicitate. In anumite situatii, putem partaja sau vinde date catre parteneri comerciali, in special in forma agregata sau anonimizata, in conformitate cu legislatia aplicabila si politica noastra de confidentialitate.',
  },
  {
    title: ' Restrictii de utilizare',
    body: 'Este interzisa utilizarea platformei pentru spam, fraude, continut ilegal, hartuire, distribuirea de malware sau orice activitate care afecteaza functionarea normala a serviciului ori siguranta comunitatii.',
  },
  {
    title: ' Limitarea raspunderii',
    body: 'Platforma este oferita "ca atare", fara garantii explicite sau implicite privind disponibilitatea continua, lipsa erorilor ori rezultate specifice. In limita maxima permisa de lege, nu raspundem pentru pierderi indirecte sau daune rezultate din utilizarea serviciului.',
  },
  {
    title: ' Modificarea termenilor',
    body: 'Putem actualiza acesti termeni periodic. Versiunea actualizata se aplica de la data publicarii in platforma. Continuarea utilizarii serviciului dupa modificari reprezinta acceptarea noilor termeni.',
  },
]

export const TermsAndConditions = () => {
  return (
    <main className='app-main terms-page'>
      <div className='terms-shell'>
        <section className='terms-hero'>
          <div className='terms-hero-top'>
            <div className='terms-hero-badge'>LEGAL CENTER</div>
          </div>

          <h1 className='terms-title'>Terms & Conditions</h1>
          <p className='terms-subtitle'>
            Acest document stabileste conditiile de utilizare, limitele de
            raspundere si cadrul de prelucrare a datelor pentru platforma
            noastra.
          </p>

          <div className='terms-meta'>
            <span>Ultima actualizare: 25 februarie 2026</span>
            <span>{TERMS_SECTIONS.length} clauze esentiale</span>
            <span>Aplicabil tuturor utilizatorilor</span>
          </div>
        </section>

        <div className='terms-layout'>
          <aside className='terms-toc'>
            <p className='terms-toc-title'>Navigare rapida</p>
            <ul>
              {TERMS_SECTIONS.map((item, index) => (
                <li key={item.title}>
                  <a href={`#term-${index + 1}`}>
                    <span className='toc-index'>{index + 1}</span>
                    <span>{item.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          </aside>

          <section className='terms-content'>
            {TERMS_SECTIONS.map((item, index) => (
              <article
                key={item.title}
                className='terms-card'
                id={`term-${index + 1}`}
              >
                <div className='terms-card-head'>
                  <h2>{item.title}</h2>
                </div>
                <p>{item.body}</p>
              </article>
            ))}

            <section className='terms-footer-note'>
              <Link to="/contact" style={{ textDecoration: 'none' }}> 
              <p>
                Pentru clarificari juridice sau intrebari legate de date,
                contacteaza-ne din pagina Contact Us.
              </p>
              </Link>
            </section>
          </section>
        </div>
      </div>
    </main>
  )
}
