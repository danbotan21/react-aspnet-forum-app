import './Styles/App.css'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Navbar } from './Navbar'
import { SideBar } from './Sidebar'
import { Home } from './Home'
import { CreatePost } from './CreatePost'
import { Login } from './Login'
import { Signup } from './Signup'
import { Notification } from './Notification'
import { AboutUs } from './AboutUs'
import { FAQ } from './FAQ'
import { Popular } from './Popular'

function AppLayout({ children }) {
  return (
    <div className='app-layout'>
      <Navbar />
      <SideBar />
      {children}
    </div>
  )
}

function App() {
  return (
    <div style={{ minHeight: '100vh', width: '100%' }}>
      <Routes>
        <Route path='/' element={<Navigate to='/Login' replace />} />
        <Route path='/Login' element={<Login />} />
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Signup />} />

        <Route
          path='/create-post'
          element={
            <AppLayout>
              <CreatePost />
            </AppLayout>
          }
        />
        <Route
          path='/notification'
          element={
            <AppLayout>
              <Notification />
            </AppLayout>
          }
        />
        <Route
          path='/about'
          element={
            <AppLayout>
              <AboutUs />
            </AppLayout>
          }
        />
        <Route
          path='/faq'
          element={
            <AppLayout>
              <FAQ />
            </AppLayout>
          }
        />
        <Route
          path='/popular'
          element={
            <AppLayout>
              <Popular />
            </AppLayout>
          }
        />
        <Route
          path='*'
          element={
            <AppLayout>
              <Home />
            </AppLayout>
          }
        />
      </Routes>
    </div>
  )
}

export default App
