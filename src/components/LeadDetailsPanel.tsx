import React from 'react'
import type { SocialContact } from '../types/database.types'

interface LeadDetailsPanelProps {
  lead: SocialContact
  isOpen: boolean
  onClose: () => void
}

const LeadDetailsPanel: React.FC<LeadDetailsPanelProps> = ({ lead, isOpen, onClose }) => {
  if (!isOpen) return null

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const getQualificationColor = (status: string | null | undefined) => {
    switch (status) {
      case 'qualified':
        return 'bg-green-100 text-green-800'
      case 'unqualified':
        return 'bg-red-100 text-red-800'
      case 'new':
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatGoal = (goal: any) => {
    if (!goal) return null

    // If it's an array, show as bullet list
    if (Array.isArray(goal)) {
      return (
        <ul className="list-disc list-inside space-y-1">
          {goal.map((item, index) => (
            <li key={index} className="text-sm text-gray-700">
              {typeof item === 'object' ? JSON.stringify(item) : item}
            </li>
          ))}
        </ul>
      )
    }

    // If it's an object, show key-value pairs
    if (typeof goal === 'object') {
      return (
        <dl className="space-y-2">
          {Object.entries(goal).map(([key, value]) => (
            <div key={key} className="flex items-start">
              <dt className="text-xs font-medium text-purple-700 min-w-[100px] capitalize">
                {key.replace(/_/g, ' ')}:
              </dt>
              <dd className="text-sm text-gray-700 flex-1 ml-2">
                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
              </dd>
            </div>
          ))}
        </dl>
      )
    }

    // If it's a string or primitive
    return <p className="text-sm text-gray-700">{String(goal)}</p>
  }

  const formatProfileData = (profileData: any) => {
    if (!profileData) return null

    // If it's an array, show as cards
    if (Array.isArray(profileData)) {
      return (
        <div className="space-y-2">
          {profileData.map((item, index) => (
            <div key={index} className="bg-white rounded p-2 border border-indigo-200">
              <p className="text-sm text-gray-700">
                {typeof item === 'object' ? JSON.stringify(item) : item}
              </p>
            </div>
          ))}
        </div>
      )
    }

    // If it's an object, show as grid of key-value pairs
    if (typeof profileData === 'object') {
      return (
        <div className="bg-white rounded-md p-3 space-y-2">
          {Object.entries(profileData).map(([key, value]) => {
            // Format the value based on type
            let formattedValue: React.ReactNode

            if (Array.isArray(value)) {
              // Format arrays as comma-separated list or bullet points
              if (value.length === 0) {
                formattedValue = <span className="text-gray-400 italic">Nessuno</span>
              } else if (value.length === 1) {
                formattedValue = String(value[0])
              } else {
                formattedValue = (
                  <ul className="list-disc list-inside space-y-1">
                    {value.map((item, idx) => (
                      <li key={idx} className="text-sm">
                        {typeof item === 'object' ? JSON.stringify(item) : String(item)}
                      </li>
                    ))}
                  </ul>
                )
              }
            } else if (typeof value === 'object' && value !== null) {
              formattedValue = JSON.stringify(value, null, 2)
            } else {
              formattedValue = String(value)
            }

            return (
              <div key={key} className="flex items-start border-b border-indigo-100 pb-2 last:border-b-0 last:pb-0">
                <dt className="text-xs font-semibold text-indigo-700 min-w-[120px] capitalize">
                  {key.replace(/_/g, ' ')}
                </dt>
                <dd className="text-sm text-gray-700 flex-1 ml-3">{formattedValue}</dd>
              </div>
            )
          })}
        </div>
      )
    }

    // If it's a string or primitive
    return (
      <div className="bg-white rounded-md p-3">
        <p className="text-sm text-gray-700">{String(profileData)}</p>
      </div>
    )
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
        onClick={onClose}
      ></div>

      {/* Panel */}
      <div className="fixed lg:relative right-0 top-0 h-full w-full lg:w-96 bg-white border-l border-gray-200 z-50 overflow-y-auto shadow-xl lg:shadow-none">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
          <h3 className="font-semibold text-gray-900">Dettagli Lead</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Profile Section */}
          <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg p-6 text-center">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto shadow-md">
              <span className="text-4xl text-primary-700 font-bold">
                {(lead.display_name || lead.name || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
            <h4 className="mt-4 text-lg font-bold text-gray-900">
              {lead.display_name || lead.name || 'Nome non disponibile'}
            </h4>
            <p className="text-sm text-gray-600 capitalize mt-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-200 text-primary-800">
                {lead.platform}
              </span>
            </p>
          </div>

          {/* Contact Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Informazioni di Contatto
            </h5>
            <dl className="space-y-3">
              {lead.email && (
                <div className="flex items-start">
                  <dt className="text-xs font-medium text-gray-500 w-20 pt-0.5">Email:</dt>
                  <dd className="text-sm text-gray-900 flex-1 break-all">{lead.email}</dd>
                </div>
              )}
              {lead.phone && (
                <div className="flex items-start">
                  <dt className="text-xs font-medium text-gray-500 w-20 pt-0.5">Telefono:</dt>
                  <dd className="text-sm text-gray-900 flex-1">{lead.phone}</dd>
                </div>
              )}
              {lead.company && (
                <div className="flex items-start">
                  <dt className="text-xs font-medium text-gray-500 w-20 pt-0.5">Azienda:</dt>
                  <dd className="text-sm text-gray-900 flex-1">{lead.company}</dd>
                </div>
              )}
              {lead.age && (
                <div className="flex items-start">
                  <dt className="text-xs font-medium text-gray-500 w-20 pt-0.5">Età:</dt>
                  <dd className="text-sm text-gray-900 flex-1">{lead.age} anni</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Qualification Status */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Qualificazione
            </h5>
            <div className="flex items-center justify-between">
              <span
                className={`inline-flex px-3 py-1.5 text-sm font-semibold rounded-full ${getQualificationColor(
                  lead.qualification_status
                )}`}
              >
                {lead.qualification_status || 'new'}
              </span>
              {lead.lead_score !== null && (
                <div className="text-right">
                  <p className="text-xs text-gray-500">Lead Score</p>
                  <p className="text-lg font-bold text-primary-600">{lead.lead_score}<span className="text-sm text-gray-500">/100</span></p>
                </div>
              )}
            </div>
          </div>

          {/* Goal/Intent */}
          {lead.goal && (
            <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
              <h5 className="text-sm font-bold text-gray-900 mb-2 flex items-center">
                <svg className="w-4 h-4 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Obiettivo
              </h5>
              <div className="bg-white rounded-md p-3 mt-2 border border-purple-200">
                {formatGoal(lead.goal)}
              </div>
            </div>
          )}

          {/* Volume/Metrics */}
          {(lead.volume || lead.plan_suggested) && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h5 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Metriche Business
              </h5>
              <dl className="space-y-2">
                {lead.volume && (
                  <div className="flex justify-between items-center bg-white rounded px-3 py-2">
                    <dt className="text-xs font-medium text-gray-600">Volume:</dt>
                    <dd className="text-sm font-semibold text-gray-900">{lead.volume}</dd>
                  </div>
                )}
                {lead.plan_suggested && (
                  <div className="flex justify-between items-center bg-white rounded px-3 py-2">
                    <dt className="text-xs font-medium text-gray-600">Piano Suggerito:</dt>
                    <dd className="text-sm font-semibold text-blue-700">{lead.plan_suggested}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* Lead Source */}
          {lead.lead_source && (
            <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
              <h5 className="text-sm font-bold text-gray-900 mb-2 flex items-center">
                <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Fonte Lead
              </h5>
              <p className="text-sm font-medium text-gray-900 bg-white rounded px-3 py-2 mt-2">{lead.lead_source}</p>
            </div>
          )}

          {/* Data Completeness */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Completezza Dati
            </h5>
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all shadow-sm"
                    style={{ width: `${lead.data_completeness || 0}%` }}
                  ></div>
                </div>
                <span className="text-sm font-bold text-primary-600 min-w-[3rem] text-right">{lead.data_completeness || 0}%</span>
              </div>
              <p className="text-xs text-gray-500">
                {lead.data_completeness >= 80 ? '✓ Profilo completo' : '⚠ Informazioni mancanti'}
              </p>
            </div>
          </div>

          {/* Dates */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Timeline
            </h5>
            <dl className="space-y-2">
              <div className="flex items-start bg-white rounded px-3 py-2">
                <dt className="text-xs font-medium text-gray-500 w-28 pt-0.5">Primo Contatto:</dt>
                <dd className="text-sm text-gray-900 flex-1">{formatDate(lead.first_contact)}</dd>
              </div>
              <div className="flex items-start bg-white rounded px-3 py-2">
                <dt className="text-xs font-medium text-gray-500 w-28 pt-0.5">Ultima Interazione:</dt>
                <dd className="text-sm text-gray-900 flex-1">{formatDate(lead.last_interaction)}</dd>
              </div>
            </dl>
          </div>

          {/* Profile Data (Additional JSON) */}
          {lead.profile_data && Object.keys(lead.profile_data as object).length > 0 && (
            <div className="bg-indigo-50 rounded-lg p-4 border-l-4 border-indigo-500">
              <h5 className="text-sm font-bold text-gray-900 mb-2 flex items-center">
                <svg className="w-4 h-4 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Dati Profilo
              </h5>
              <div className="mt-2">
                {formatProfileData(lead.profile_data)}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default LeadDetailsPanel
