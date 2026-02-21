import './Styles/App.css'
import { Navbar } from './Navbar'
import { SideBar } from './Sidebar'
import { Home } from './Home'

function App() {
  return (
    <>
      <Navbar />
      <SideBar />
        <Home />
      <main className="app-main">
        {/* Conținutul principal al paginii – deocamdată gol */}
      </main>
    </>
  )
}

export default App
