import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/core/contexts/AuthContext'
import './MainSidebar.css'
import WhatsappIcon from '@/img/whatsapp-icon.svg?react'
import InstagramIcon from '@/img/instagram-icon.svg?react'
import MessengerIcon from '@/img/messenger-icon.svg?react'
import HomeIcon from '@/img/home-icon.svg?react'
import UserIcon from '@/img/user-icon.svg?react'
import UsersIcon from '@/img/users-icon.svg?react'
import DocumentIcon from '@/img/document-icon.svg?react'
import ActivityLogIcon from '@/img/activity-log-icon.svg?react'
import LogoutIcon from '@/img/logout-icon.svg?react'

interface MainSidebarProps {
  onChannelSelect: (channel: 'whatsapp' | 'instagram' | 'messenger' | null) => void
}

const MainSidebar: React.FC<MainSidebarProps> = ({ onChannelSelect }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout, user } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isActive = (path: string) => location.pathname === path

  const channels = [
    {
      id: 'whatsapp' as const,
      name: 'WhatsApp',
      icon: (
        <WhatsappIcon className="icon" />
      ),
      variant: 'whatsapp'
    },
    {
      id: 'instagram' as const,
      name: 'Instagram',
      icon: (
        <InstagramIcon className="icon" />
      ),
      variant: 'instagram'
    },
    {
      id: 'messenger' as const,
      name: 'Messenger',
      icon: (
        <MessengerIcon className="icon" />
      ),
      variant: 'messenger'
    },
  ]

  return (
    <div className="main-sidebar">
      {/* Header */}
      <div className="header">
        <h1 className="title">Chatly</h1>
        <p className="subtitle">{user?.email}</p>
      </div>

      {/* Navigation */}
      <nav className="navigation">
        {/* Dashboard Link */}
        <button
          onClick={() => {
            navigate('/dashboard')
            onChannelSelect(null)
          }}
          className={`nav-button ${isActive('/dashboard') ? 'active' : 'inactive'}`}
        >
          <HomeIcon className="icon" />
          <span className="label">Dashboard</span>
        </button>

        {/* User Info Link */}
        <button
          onClick={() => {
            navigate('/user-info')
            onChannelSelect(null)
          }}
          className={`nav-button ${isActive('/user-info') ? 'active' : 'inactive'}`}
        >
          <UserIcon className="icon" />
          <span className="label">Informazioni Utente</span>
        </button>

        {/* Contacts Link */}
        <button
          onClick={() => {
            navigate('/contacts')
            onChannelSelect(null)
          }}
          className={`nav-button ${isActive('/contacts') ? 'active' : 'inactive'}`}
        >
          <UsersIcon className="icon" />
          <span className="label">Contatti</span>
        </button>

        {/* Documents Link */}
        <button
          onClick={() => {
            navigate('/documents')
            onChannelSelect(null)
          }}
          className={`nav-button ${isActive('/documents') ? 'active' : 'inactive'}`}
        >
          <DocumentIcon className="icon" />
          <span className="label">Documenti</span>
        </button>

        {/* Log Activity Link */}
        <button
          onClick={() => {
            navigate('/log-activity')
            onChannelSelect(null)
          }}
          className={`nav-button ${isActive('/log-activity') ? 'active' : 'inactive'}`}
        >
          <ActivityLogIcon className="icon" />
          <span className="label">Log Activity</span>
        </button>

        {/* Divider */}
        <div className="divider-container">
          <div className="divider-line"></div>
          <p className="divider-label">
            Canali
          </p>
        </div>

        {/* Channels */}
        {channels.map((channel) => (
          <button
            key={channel.id}
            onClick={() => onChannelSelect(channel.id)}
            className={`nav-button ${channel.variant}`}
          >
            {channel.icon}
            <span className="label">{channel.name}</span>
          </button>
        ))}
      </nav>

      {/* Footer - Logout */}
      <div className="footer">
        <button
          onClick={handleLogout}
          className="logout-button"
        >
          <LogoutIcon className="icon" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )
}

export default MainSidebar
