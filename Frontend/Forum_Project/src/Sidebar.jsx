import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import './Styles/SideBar.css'
import { normalizeImageSrc } from './utils/media'
import {
  FaRegStar,
  FaHome,
  FaFire,
  FaCompass,
  FaPlusCircle,
  FaChevronDown,
  FaChevronRight,
  FaQuestion,
  FaPhone,
} from 'react-icons/fa'
import { RiTeamLine } from 'react-icons/ri'
import { LuScrollText } from 'react-icons/lu'

export const SideBar = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [showCommunities, setShowCommunities] = useState(false)
  const [userCommunities, setUserCommunities] = useState([])

  useEffect(() => {
    const fetchUserCommunities = async () => {
      if (!user?.id) {
        setUserCommunities([])
        return
      }

      try {
        const res = await fetch(`/api/Communities/user/${user.id}`)
        if (res.ok) {
          const data = await res.json()
          setUserCommunities(data || [])
        }
      } catch (err) {
        console.error('Failed to load user communities', err)
      }
    }

    fetchUserCommunities()

    const handleMembershipUpdated = () => {
      fetchUserCommunities()
    }

    window.addEventListener('communities-membership-updated', handleMembershipUpdated)
    return () => {
      window.removeEventListener(
        'communities-membership-updated',
        handleMembershipUpdated,
      )
    }
  }, [user?.id])

  const toggleCommunities = () => {
    setShowCommunities(!showCommunities)
  }

  return (
    <div className='sidebar'>
      <div className='sidebar-content'>
        <div className='navigation-section'>
          <div className='nav-item' onClick={() => navigate('/home')}>
            <FaHome className='nav-icon' />
            <p>Home</p>
          </div>

          <div className='nav-item' onClick={() => navigate('/popular')}>
            <FaFire className='nav-icon' />
            <p>Popular</p>
          </div>

          <div className='nav-item' onClick={() => navigate('/explore')}>
            <FaCompass className='nav-icon' />
            <p>Explore</p>
          </div>

          <div
            className='nav-item'
            onClick={() => navigate('/start-community')}
          >
            <FaPlusCircle className='nav-icon' />
            <p>Start Community</p>
          </div>
        </div>

        <div className='communities-section'>
          <div className='communities-header' onClick={toggleCommunities}>
            <h3>COMMUNITIES</h3>
            {showCommunities ? (
              <FaChevronDown className='arrow-icon' />
            ) : (
              <FaChevronRight className='arrow-icon' />
            )}
          </div>

          {showCommunities && (
            <div className='communities'>
              {userCommunities.length > 0 ? (
                userCommunities.map((c) => {
                  const communityAvatarSrc = normalizeImageSrc(c.avatarUrl)
                  return (
                    <div
                      key={c.id}
                      className='community'
                      onClick={() => navigate(`/community/${c.slug}`)}
                    >
                      {communityAvatarSrc ? (
                        <img
                          src={communityAvatarSrc}
                          alt='imagine ascunsa'
                          className='img_community'
                        />
                      ) : (
                        <div
                          className='img_community'
                          style={{
                            backgroundColor: '#ccc',
                            borderRadius: '50%',
                          }}
                        ></div>
                      )}
                      <p className='name_community'>{c.title}</p>
                      <FaRegStar className='star-icon' />
                    </div>
                  )
                })
              ) : (
                <div
                  style={{ padding: '0 10px', fontSize: '13px', color: '#888' }}
                >
                  {!user ? 'Login to see communities' : 'No communities joined'}
                </div>
              )}
            </div>
          )}
        </div>

        <div className='resources-section'>
          <h3>RESOURCES</h3>
          <div className='resource-items'>
            <p onClick={() => navigate('/about')}>
              <RiTeamLine className='resource-icon' />
              About us
            </p>
            <p onClick={() => navigate('/contact')}>
              <FaPhone className='resource-icon' />
              Contact us
            </p>
            <p onClick={() => navigate('/faq')}>
              <FaQuestion className='resource-icon' />
              FAQ
            </p>
            <p onClick={() => navigate('/terms')}>
              <LuScrollText className='resource-icon' />
              Terms and Conditions
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
