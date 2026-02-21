import './Styles/App.css'
import { Navbar } from './Navbar'
import { SideBar } from './Sidebar'

function App() {
  return (
    <>
      <Navbar />
      <SideBar />
      <main className="app-main">
        {/* Conținutul principal al paginii – deocamdată gol */}
      </main>
    </>
  )
}

export default App
