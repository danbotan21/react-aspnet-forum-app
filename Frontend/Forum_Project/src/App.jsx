import './Styles/App.css'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Navbar } from './Navbar'
import { SideBar } from './Sidebar'
import { Home } from './Home'
import { Login } from './Login'
import { Signup } from './Signup'

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
