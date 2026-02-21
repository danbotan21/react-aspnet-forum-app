import './Styles/App.css'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Navbar } from './Navbar'
import { SideBar } from './Sidebar'
import { Home } from './Home'
import { Login } from './Login'
import { Signup } from './Signup'

function App() {
  return (
    <div style={{ minHeight: '100vh', width: '100%' }}>
      <Routes>
        <Route path='/' element={<Navigate to='/Login' replace />} />
        <Route path='/Login' element={<Login />} />
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Signup />} />

        <Route
          path='*'
          element={
            <div className='app-layout'>
              <Navbar />
              <SideBar />
              <Home />
              <main className='app-main'></main>
            </div>
          }
        />
      </Routes>
    </div>
  )
}

export default App
