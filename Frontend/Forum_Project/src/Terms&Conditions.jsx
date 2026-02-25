import './Styles/Terms&Conditions.css'

const TERMS_SECTIONS = [
  {
    title: '1. Acceptarea termenilor',
    body: 'Prin accesarea sau utilizarea platformei noastre, confirmi ca ai citit, inteles si acceptat acesti Termeni si Conditii. Daca nu esti de acord cu o parte din continut, trebuie sa opresti utilizarea serviciului.',
  },
  {
    title: '2. Eligibilitate si cont',
    body: 'Esti responsabil pentru datele furnizate la inregistrare si pentru securitatea contului tau. Nu ai voie sa folosesti un cont fals, sa impersonifici alte persoane sau sa distribui datele de acces catre terti.',
  },
  {
    title: '3. Continut publicat de utilizatori',
    body: 'Tu ramai proprietarul continutului pe care il postezi, dar ne oferi o licenta neexclusiva pentru afisarea, distribuirea si promovarea lui in cadrul serviciului. Putem elimina continut care incalca regulile comunitatii sau legislatia aplicabila.',
  },
  {
    title: '4. Colectarea, utilizarea si vanzarea datelor',
    body: 'Colectam date despre activitatea ta pe platforma (ex: date de cont, interactiuni, preferinte, date tehnice). Folosim aceste date pentru securitate, personalizare, statistici si publicitate. In anumite situatii, putem partaja sau vinde date catre parteneri comerciali, in special in forma agregata sau anonimizata, in conformitate cu legislatia aplicabila si politica noastra de confidentialitate.',
  },
  {
    title: '5. Restrictii de utilizare',
    body: 'Este interzisa utilizarea platformei pentru spam, fraude, continut ilegal, hartuire, distribuirea de malware sau orice activitate care afecteaza functionarea normala a serviciului ori siguranta comunitatii.',
  },
  {
    title: '6. Limitarea raspunderii',
    body: 'Platforma este oferita "ca atare", fara garantii explicite sau implicite privind disponibilitatea continua, lipsa erorilor ori rezultate specifice. In limita maxima permisa de lege, nu raspundem pentru pierderi indirecte sau daune rezultate din utilizarea serviciului.',
  },
  {
    title: '7. Modificarea termenilor',
    body: 'Putem actualiza acesti termeni periodic. Versiunea actualizata se aplica de la data publicarii in platforma. Continuarea utilizarii serviciului dupa modificari reprezinta acceptarea noilor termeni.',
  },
]

export const TermsAndConditions = () => {
  return (
    <main className='app-main terms-page'>
      <div className='terms-shell'>
        <section className='terms-hero'>
          <p className='terms-kicker'>LEGAL</p>
          <h1 className='terms-title'>Terms and Conditions</h1>
          <p className='terms-subtitle'>
            Acest document descrie regulile generale pentru utilizarea
            platformei, drepturile si responsabilitatile utilizatorilor, precum
            si modul in care tratam datele.
          </p>
          <p className='terms-updated'>Ultima actualizare: 25 februarie 2026</p>
        </section>

        <section className='terms-grid'>
          {TERMS_SECTIONS.map((item) => (
            <article key={item.title} className='terms-card'>
              <h2>{item.title}</h2>
              <p>{item.body}</p>
            </article>
          ))}
        </section>

        <section className='terms-footer-note'>
          <p>
            Daca ai intrebari despre acesti termeni, ne poti contacta in pagina
            Contact Us.
          </p>
        </section>
      </div>
    </main>
  )
}
