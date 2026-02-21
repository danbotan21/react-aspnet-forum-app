import './Searchbar.css'

export function SearchBar() {
  const x = 7

  return (
    <div>
      <h1 className='gheorghe_bos'>
        {' '}
        {x == 5 ? 'Pagina de Searchbar' : 'Nu exista pagina de search bar'}
      </h1>

      <button className='buton1'>buton</button>
    </div>
  )
}
