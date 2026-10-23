import { FaCrown } from 'react-icons/fa'
import './Styles/PremiumBadge.css'

// Small gold "Premium" pill. `size` = 'sm' | 'md' | 'lg'.
export const PremiumBadge = ({ size = 'md', title = 'Premium member' }) => (
  <span className={`premium-badge premium-badge--${size}`} title={title}>
    <FaCrown className='premium-badge-icon' />
    <span className='premium-badge-text'>Premium</span>
  </span>
)
