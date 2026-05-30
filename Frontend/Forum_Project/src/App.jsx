import './Styles/App.css'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Navbar } from './Navbar'
import { SideBar } from './Sidebar'
import { Home } from './Home'
import { CreatePost } from './CreatePost'
import { Login } from './Login'
import { Signup } from './Signup'
import { Notification } from './Notification'
import { Popular } from './Popular'
import { AboutUs } from './AboutUs'
import { FAQ } from './FAQ'
import { ExploreCommunities } from './ExploreCommunities'
import { ContactUs } from './ContactUs'
import { TermsAndConditions } from './Terms&Conditions'
import { StartCommunity } from './StartCommunity'
import { EditAvatar } from './EditAvatar'
import { UserProfile } from './UserProfile'
import { CommunityPage } from './CommunityPage'
import { PostPage } from './PostPage'
import { Settings } from './Settings'
import { SearchResults } from './SearchResults'

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
        {/* <Route path='/' element={<Navigate to='/Login' replace />} /> */}
        <Route path='/' element={<Navigate to='/home' replace />} />
        <Route path='/Login' element={<Login />} />
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Signup />} />

        <Route
          path='/start-community'
          element={
            <AppLayout>
              <StartCommunity />
            </AppLayout>
          }
        />
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
          path='/popular'
          element={
            <AppLayout>
              <Popular />
            </AppLayout>
          }
        />
        <Route
          path='/home'
          element={
            <AppLayout>
              <Home />
            </AppLayout>
          }
        />
        <Route
          path='/Home'
          element={
            <AppLayout>
              <Home />
            </AppLayout>
          }
        />
        <Route
          path='/explore'
          element={
            <AppLayout>
              <ExploreCommunities />
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
          path='/contact'
          element={
            <AppLayout>
              <ContactUs />
            </AppLayout>
          }
        />
        <Route
          path='/terms'
          element={
            <AppLayout>
              <TermsAndConditions />
            </AppLayout>
          }
        />
        <Route
          path='/edit-avatar'
          element={
            <AppLayout>
              <EditAvatar />
            </AppLayout>
          }
        />
        <Route
          path='/settings'
          element={
            <AppLayout>
              <Settings />
            </AppLayout>
          }
        />
        <Route
          path='/search'
          element={
            <AppLayout>
              <SearchResults />
            </AppLayout>
          }
        />
        <Route
          path='/user/:username'
          element={
            <AppLayout>
              <UserProfile />
            </AppLayout>
          }
        />
        <Route
          path='/community/:communityname/post/:postId'
          element={
            <AppLayout>
              <PostPage />
            </AppLayout>
          }
        />
        <Route
          path='/community/:communityname'
          element={
            <AppLayout>
              <CommunityPage />
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
