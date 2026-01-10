import React from 'react'
import { useAuth } from '@/core/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import MainSidebar from '../components/layout/MainSidebar'

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
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsMobileSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-primary-600 text-white rounded-md shadow-lg"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Main Sidebar - Hidden on mobile, overlay on tablet, fixed on desktop */}
      <div className={`${isMobileSidebarOpen ? 'block' : 'hidden'} lg:block fixed lg:relative inset-0 lg:inset-auto z-40`}>
        {isMobileSidebarOpen && (
          <div
            className="lg:hidden absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}
        <div className="relative">
          <MainSidebar onChannelSelect={handleChannelSelect} />
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 md:px-8 py-4 md:py-8">
        <div className="mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Informazioni Utente</h2>
          <p className="mt-2 text-sm md:text-base text-gray-600">
            Gestisci le informazioni del tuo account e i canali connessi
          </p>
        </div>

        {/* Account Info Card */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
          <div className="px-4 md:px-6 py-4 md:py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Informazioni Account
            </h3>
          </div>
          <div className="px-4 md:px-6 py-4 md:py-5">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 md:grid-cols-2">
              {/* Email */}
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{user?.email || 'N/A'}</dd>
              </div>

              {/* Business Name */}
              <div>
                <dt className="text-sm font-medium text-gray-500">Nome Business</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {clientData?.business_name || 'N/A'}
                </dd>
              </div>

              {/* Phone */}
              <div>
                <dt className="text-sm font-medium text-gray-500">Telefono</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {clientData?.phone || 'Non impostato'}
                </dd>
              </div>

              {/* Status */}
              <div>
                <dt className="text-sm font-medium text-gray-500">Stato</dt>
                <dd className="mt-1">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${clientData?.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                      }`}
                  >
                    {clientData?.status || 'N/A'}
                  </span>
                </dd>
              </div>

              {/* Subscription Plan */}
              <div>
                <dt className="text-sm font-medium text-gray-500">Piano Sottoscrizione</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {clientData?.subscription_plan || 'Non attivo'}
                </dd>
              </div>

              {/* Created At */}
              <div>
                <dt className="text-sm font-medium text-gray-500">Data Registrazione</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDate(clientData?.created_at)}
                </dd>
              </div>

              {/* Last Updated */}
              <div>
                <dt className="text-sm font-medium text-gray-500">Ultimo Aggiornamento</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDate(clientData?.updated_at)}
                </dd>
              </div>

              {/* User ID */}
              <div>
                <dt className="text-sm font-medium text-gray-500">ID Utente</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono text-xs">
                  {user?.id || 'N/A'}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Channels Section */}
        <div className="mt-6 md:mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Canali Connessi</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* WhatsApp */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900">WhatsApp</h4>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${clientData?.whatsapp_phone_id
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                    }`}
                >
                  {clientData?.whatsapp_phone_id ? 'Connesso' : 'Non connesso'}
                </span>
              </div>
              {clientData?.whatsapp_phone_id && (
                <p className="mt-2 text-xs text-gray-500">
                  ID: {clientData.whatsapp_phone_id}
                </p>
              )}
            </div>

            {/* Instagram */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900">Instagram</h4>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${clientData?.instagram_account_id
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                    }`}
                >
                  {clientData?.instagram_account_id ? 'Connesso' : 'Non connesso'}
                </span>
              </div>
              {clientData?.instagram_account_id && (
                <p className="mt-2 text-xs text-gray-500">
                  ID: {clientData.instagram_account_id}
                </p>
              )}
            </div>

            {/* Messenger */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900">Messenger</h4>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${clientData?.messenger_page_id
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                    }`}
                >
                  {clientData?.messenger_page_id ? 'Connesso' : 'Non connesso'}
                </span>
              </div>
              {clientData?.messenger_page_id && (
                <p className="mt-2 text-xs text-gray-500">
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
