import React from 'react'
import { useAuth } from '@/core/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import MainSidebar from '../components/layout/MainSidebar'

import './UserInfoPage.css'
import MenuIcon from '@/img/menu-icon.svg?react'

const UserInfoPage: React.FC = () => {
  const { user, clientData } = useAuth()
  const navigate = useNavigate()
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false)

  const handleChannelSelect = (channel: 'whatsapp' | 'instagram' | 'messenger' | null) => {
    if (channel) {
      navigate('/inbox', { state: { selectedChannel: channel } })
    }
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="user-info-layout">
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsMobileSidebarOpen(true)}
        className="mobile-hamburger-btn"
      >
        <MenuIcon />
      </button>

      {/* Main Sidebar */}
      <div className={`sidebar-wrapper ${isMobileSidebarOpen ? 'mobile-open' : ''}`}>
        {isMobileSidebarOpen && (
          <div
            className="mobile-overlay"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}
        <div className="sidebar-container">
          <MainSidebar onChannelSelect={handleChannelSelect} />
        </div>
      </div>

      {/* Main Content */}
      <main className="user-main-content">
        <div className="page-header">
          <h2>Informazioni Utente</h2>
          <p>
            Gestisci le informazioni del tuo account e i canali connessi
          </p>
        </div>

        {/* Account Info Card */}
        <div className="info-card">
          <div className="card-header">
            <h3>Informazioni Account</h3>
          </div>
          <div className="card-body">
            <dl>
              {/* Email */}
              <div className="info-group">
                <dt>Email</dt>
                <dd>{user?.email || 'N/A'}</dd>
              </div>

              {/* Business Name */}
              <div className="info-group">
                <dt>Nome Business</dt>
                <dd>{clientData?.business_name || 'N/A'}</dd>
              </div>

              {/* Phone */}
              <div className="info-group">
                <dt>Telefono</dt>
                <dd>
                  {clientData?.phone || 'Non impostato'}
                </dd>
              </div>

              {/* Status */}
              <div className="info-group">
                <dt>Stato</dt>
                <dd>
                  <span
                    className={`status-badge ${clientData?.status === 'active'
                      ? 'active'
                      : 'inactive'
                      }`}
                  >
                    {clientData?.status || 'N/A'}
                  </span>
                </dd>
              </div>

              {/* Subscription Plan */}
              <div className="info-group">
                <dt>Piano Sottoscrizione</dt>
                <dd>
                  {clientData?.subscription_plan || 'Non attivo'}
                </dd>
              </div>

              {/* Created At */}
              <div className="info-group">
                <dt>Data Registrazione</dt>
                <dd>
                  {formatDate(clientData?.created_at)}
                </dd>
              </div>

              {/* Last Updated */}
              <div className="info-group">
                <dt>Ultimo Aggiornamento</dt>
                <dd>
                  {formatDate(clientData?.updated_at)}
                </dd>
              </div>

              {/* User ID */}
              <div className="info-group">
                <dt>ID Utente</dt>
                <dd className="code-text">
                  {user?.id || 'N/A'}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Channels Section */}
        <div className="channels-section">
          <h3>Canali Connessi</h3>
          <div className="channels-grid">
            {/* WhatsApp */}
            <div className="channel-card">
              <div className="card-header">
                <h4>WhatsApp</h4>
                <span
                  className={`status-badge ${clientData?.whatsapp_phone_id
                    ? 'connected'
                    : 'disconnected'
                    }`}
                >
                  {clientData?.whatsapp_phone_id ? 'Connesso' : 'Non connesso'}
                </span>
              </div>
              {clientData?.whatsapp_phone_id && (
                <p className="channel-id">
                  ID: {clientData.whatsapp_phone_id}
                </p>
              )}
            </div>

            {/* Instagram */}
            <div className="channel-card">
              <div className="card-header">
                <h4>Instagram</h4>
                <span
                  className={`status-badge ${clientData?.instagram_account_id
                    ? 'connected'
                    : 'disconnected'
                    }`}
                >
                  {clientData?.instagram_account_id ? 'Connesso' : 'Non connesso'}
                </span>
              </div>
              {clientData?.instagram_account_id && (
                <p className="channel-id">
                  ID: {clientData.instagram_account_id}
                </p>
              )}
            </div>

            {/* Messenger */}
            <div className="channel-card">
              <div className="card-header">
                <h4>Messenger</h4>
                <span
                  className={`status-badge ${clientData?.messenger_page_id
                    ? 'connected'
                    : 'disconnected'
                    }`}
                >
                  {clientData?.messenger_page_id ? 'Connesso' : 'Non connesso'}
                </span>
              </div>
              {clientData?.messenger_page_id && (
                <p className="channel-id">
                  ID: {clientData.messenger_page_id}
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default UserInfoPage
