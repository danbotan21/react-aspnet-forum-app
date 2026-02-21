import { useState } from 'react'
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
import { FaBiohazard } from 'react-icons/fa6'

export const SideBar = () => {
  const [showCommunities, setShowCommunities] = useState(false)

  const toggleCommunities = () => {
    setShowCommunities(!showCommunities)
  }

  return (
    <div className='sidebar'>
      <div className='sidebar-content'>
        <div className='navigation-section'>
          <div className='nav-item'>
            <FaHome className='nav-icon' />
            <p>Home</p>
          </div>
          <div className='nav-item'>
            <FaFire className='nav-icon' />
            <p>Popular</p>
          </div>
          <div className='nav-item'>
            <FaCompass className='nav-icon' />
            <p>Explore</p>
          </div>
          <div className='nav-item'>
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
              <div className='community'>
                <img
                  src={man}
                  alt='imagine din comunitate'
                  className='img_community'
                />
                <p className='name_community'>League of Legends Nikita</p>
                <FaRegStar className='star-icon' />
              </div>

              <div className='community'>
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
            <p>
              <RiTeamLine className='resource-icon' />
              About us
            </p>
            <p>
              <FaPhone className='resource-icon' />
              Contact us
            </p>
            <p>
              <FaQuestion className='resource-icon' />
              FAQ
            </p>
            <p>
              <LuScrollText className='resource-icon' />
              Terms and Conditions
            </p>

            <p></p>
          </div>
        </div>
      </div>
    </div>
  )
}
