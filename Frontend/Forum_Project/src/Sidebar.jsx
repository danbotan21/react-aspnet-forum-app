import { useState } from 'react'
import { useNavigate } from 'react-router-dom' // ← adaugă asta
import './Styles/SideBar.css'
import man from './img/man.jpg'
import shreck from './img/shreck.png'
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
  const navigate = useNavigate() // ← hook-ul pentru navigare
  const [showCommunities, setShowCommunities] = useState(false)

  const toggleCommunities = () => {
    setShowCommunities(!showCommunities)
  }

  return (
    <div className='sidebar'>
      <div className='sidebar-content'>
        <div className='navigation-section'>
          {/* Acum div-ul întreg e clickabil și duce la route */}
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

        {/* Restul codului rămâne la fel */}
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
              <div
                className='community'
                onClick={() => navigate('/community/1')}
              >
                <img
                  src={man}
                  alt='imagine din comunitate'
                  className='img_community'
                />
                <p className='name_community'>League of Legends Nikita</p>
                <FaRegStar className='star-icon' />
              </div>

              <div
                className='community'
                onClick={() => navigate('/community/2')}
              >
                <img
                  src={shreck}
                  alt='imagine din comunitate'
                  className='img_community'
                />
                <p className='name_community'>Shreck Gheorghe</p>
                <FaRegStar className='star-icon' />
              </div>
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
