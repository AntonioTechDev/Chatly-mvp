import React, { useState, useEffect } from 'react'
import type { SocialContact } from '../../types/database.types'
import { updateContact, getLinkedContacts, linkContacts, unlinkContact } from '../../services/contactService'
import { LinkContactModal } from '../contacts/LinkContactModal/LinkContactModal'

interface LeadDetailsPanelProps {
  lead: SocialContact
  isOpen: boolean
  onClose: () => void
  onUpdate?: (updatedLead: SocialContact) => void
}

const LeadDetailsPanel: React.FC<LeadDetailsPanelProps> = ({ lead, isOpen, onClose, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editedLead, setEditedLead] = useState<Partial<SocialContact>>(lead)
  const [error, setError] = useState<string | null>(null)
  const [linkedContacts, setLinkedContacts] = useState<SocialContact[]>([])
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false)
  const [isLoadingLinked, setIsLoadingLinked] = useState(false)

  // Load linked contacts when panel opens or lead changes
  useEffect(() => {
    if (isOpen && lead.id) {
      loadLinkedContacts()
    }
  }, [isOpen, lead.id])

  const loadLinkedContacts = async () => {
    try {
      setIsLoadingLinked(true)
      const linked = await getLinkedContacts(lead.id)
      setLinkedContacts(linked)
    } catch (error) {
      console.error('Error loading linked contacts:', error)
    } finally {
      setIsLoadingLinked(false)
    }
  }

  const handleLinkContact = async (targetContactId: number) => {
    try {
      setError(null)
      await linkContacts(lead.id, targetContactId)
      await loadLinkedContacts()
      setIsLinkModalOpen(false)
    } catch (err) {
      console.error('Error linking contact:', err)
      setError(err instanceof Error ? err.message : 'Errore durante il collegamento')
    }
  }

  const handleUnlinkContact = async (contactId: number) => {
    if (!confirm('Sei sicuro di voler scollegare questo contatto?')) {
      return
    }

    try {
      setError(null)
      await unlinkContact(contactId)
      await loadLinkedContacts()
    } catch (err) {
      console.error('Error unlinking contact:', err)
      setError(err instanceof Error ? err.message : 'Errore durante lo scollegamento')
    }
  }

  const handleSetAsMaster = async (contactId: number) => {
    if (!confirm('Sei sicuro di voler impostare questo contatto come principale?')) {
      return
    }

    try {
      setError(null)
      // To make a contact the master:
      // 1. Unlink it (becomes independent)
      await unlinkContact(contactId)

      // 2. Link all other contacts to this one (making it the new master)
      const otherContacts = linkedContacts.filter(c => c.id !== contactId)
      for (const contact of otherContacts) {
        await linkContacts(contact.id, contactId)
      }

      await loadLinkedContacts()

      // Notify parent component that master has changed
      // Find the new master contact from linked contacts
      const newMaster = linkedContacts.find(c => c.id === contactId)
      if (newMaster) {
        onUpdate(newMaster)
      }
    } catch (err) {
      console.error('Error setting master contact:', err)
      setError(err instanceof Error ? err.message : 'Errore durante il cambio del contatto principale')
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'whatsapp':
        return (
          <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
        )
      case 'instagram':
        return (
          <svg className="w-3 h-3 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
          </svg>
        )
      case 'messenger':
        return (
          <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.373 0 0 4.975 0 11.111c0 3.497 1.745 6.616 4.472 8.652V24l4.086-2.242c1.09.301 2.246.464 3.442.464 6.627 0 12-4.974 12-11.11C24 4.975 18.627 0 12 0zm1.193 14.963l-3.056-3.259-5.963 3.259L10.732 8l3.13 3.259L19.752 8l-6.559 6.963z"/>
          </svg>
        )
      default:
        return (
          <svg className="w-3 h-3 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        )
    }
  }

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'whatsapp':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'instagram':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'messenger':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

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

  const handleEdit = () => {
    setEditedLead(lead)
    setIsEditing(true)
    setError(null)
  }

  const handleCancel = () => {
    setEditedLead(lead)
    setIsEditing(false)
    setError(null)
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setError(null)

      // Validate required fields
      if (!editedLead.display_name?.trim() && !editedLead.name?.trim()) {
        throw new Error('Il nome o il display name è richiesto')
      }

      const updatedLead = await updateContact(lead.id, editedLead)

      setIsEditing(false)
      if (onUpdate) {
        onUpdate(updatedLead)
      }
    } catch (err) {
      console.error('Error updating lead:', err)
      setError(err instanceof Error ? err.message : 'Errore durante il salvataggio')
    } finally {
      setIsSaving(false)
    }
  }

  const handleFieldChange = (field: keyof SocialContact, value: any) => {
    setEditedLead((prev) => ({ ...prev, [field]: value }))
  }

  const handleJsonFieldChange = (field: keyof SocialContact, value: string) => {
    try {
      const parsed = JSON.parse(value)
      setEditedLead((prev) => ({ ...prev, [field]: parsed }))
    } catch (err) {
      // Keep the raw string for now, user might still be typing
      setEditedLead((prev) => ({ ...prev, [field]: value }))
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

  const currentLead = isEditing ? editedLead : lead

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
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="p-1.5 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-md transition-colors"
                title="Modifica"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            ) : (
              <>
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
                >
                  Annulla
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-3 py-1.5 text-sm bg-primary-600 text-white hover:bg-primary-700 rounded-md transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Salvataggio...
                    </>
                  ) : (
                    'Salva'
                  )}
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Profile Section */}
          <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg p-6 text-center">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto shadow-md">
              <span className="text-4xl text-primary-700 font-bold">
                {((currentLead as SocialContact).display_name || (currentLead as SocialContact).name || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
            {isEditing ? (
              <div className="mt-4 space-y-2">
                <input
                  type="text"
                  value={editedLead.display_name || ''}
                  onChange={(e) => handleFieldChange('display_name', e.target.value)}
                  placeholder="Display Name"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={editedLead.name || ''}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    placeholder="Nome"
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <input
                    type="text"
                    value={editedLead.surname || ''}
                    onChange={(e) => handleFieldChange('surname', e.target.value)}
                    placeholder="Cognome"
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            ) : (
              <>
                <h4 className="mt-4 text-lg font-bold text-gray-900">
                  {currentLead.display_name || currentLead.name || 'Nome non disponibile'}
                </h4>
                <p className="text-sm text-gray-600 capitalize mt-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-200 text-primary-800">
                    {currentLead.platform}
                  </span>
                </p>
              </>
            )}
          </div>

          {/* Linked Contacts Section */}
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4 border-l-4 border-indigo-500">
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-sm font-bold text-gray-900 flex items-center">
                <svg className="w-4 h-4 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Canali Collegati
              </h5>
              {!isEditing && (
                <button
                  onClick={() => setIsLinkModalOpen(true)}
                  className="text-xs px-2 py-1 bg-indigo-600 text-white hover:bg-indigo-700 rounded transition-colors flex items-center gap-1"
                  title="Collega altro canale"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Collega
                </button>
              )}
            </div>

            {isLoadingLinked ? (
              <div className="flex items-center justify-center py-4">
                <svg className="animate-spin h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : linkedContacts.length > 0 ? (
              <div className="space-y-2">
                {linkedContacts.map((contact) => {
                  const isCurrent = contact.id === lead.id
                  const isMaster = !contact.master_contact_id

                  return (
                    <div
                      key={contact.id}
                      className={`bg-white rounded-lg p-4 border-2 ${isCurrent ? 'border-indigo-400' : 'border-indigo-200'}`}
                    >
                      {/* Header with Avatar and Actions */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center flex-shrink-0 relative">
                            <span className="text-xl font-bold text-primary-700">
                              {(contact.display_name || contact.name || 'U').charAt(0).toUpperCase()}
                            </span>
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-200">
                              {getPlatformIcon(contact.platform)}
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">
                              {contact.display_name || contact.name || 'N/A'}
                            </p>
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${getPlatformColor(contact.platform)} inline-block mt-1`}>
                              {contact.platform}
                            </span>
                          </div>
                        </div>
                        {!isEditing && !isCurrent && (
                          <div className="flex gap-1">
                            {contact.master_contact_id && (
                              <button
                                onClick={() => handleUnlinkContact(contact.id)}
                                className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                title="Scollega"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Contact Details - Vertical Layout */}
                      <div className="space-y-2 text-sm">
                        {/* Badges */}
                        <div className="flex flex-wrap gap-2">
                          {isMaster && (
                            <span className="text-xs px-2 py-1 bg-indigo-200 text-indigo-800 rounded-full font-medium">
                              ⭐ Principale
                            </span>
                          )}
                          {isCurrent && (
                            <span className="text-xs px-2 py-1 bg-yellow-200 text-yellow-800 rounded-full font-medium">
                              📍 Corrente
                            </span>
                          )}
                        </div>

                        {/* Phone */}
                        {contact.phone && (
                          <div className="flex items-center gap-2 text-gray-700">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span>{contact.phone}</span>
                          </div>
                        )}

                        {/* Email */}
                        {contact.email && (
                          <div className="flex items-center gap-2 text-gray-700">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span className="truncate">{contact.email}</span>
                          </div>
                        )}

                        {/* Company */}
                        {contact.company && (
                          <div className="flex items-center gap-2 text-gray-700">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span>{contact.company}</span>
                          </div>
                        )}

                        {/* Set as Master button */}
                        {!isEditing && !isMaster && linkedContacts.length > 1 && (
                          <button
                            onClick={() => handleSetAsMaster(contact.id)}
                            className="mt-2 w-full py-1.5 px-3 text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded border border-indigo-200 transition-colors font-medium"
                          >
                            Imposta come Principale
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="bg-white rounded-lg p-4 text-center text-gray-500 text-sm">
                <p>Nessun canale collegato</p>
                <p className="text-xs mt-1">Clicca su "Collega" per associare altri contatti</p>
              </div>
            )}
          </div>

          {/* Contact Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Informazioni di Contatto
            </h5>
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email:</label>
                  <input
                    type="email"
                    value={editedLead.email || ''}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    placeholder="email@example.com"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Telefono:</label>
                  <input
                    type="tel"
                    value={editedLead.phone || ''}
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                    placeholder="+39 123 456 7890"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Azienda:</label>
                  <input
                    type="text"
                    value={editedLead.company || ''}
                    onChange={(e) => handleFieldChange('company', e.target.value)}
                    placeholder="Nome Azienda"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Età:</label>
                  <input
                    type="number"
                    value={editedLead.age || ''}
                    onChange={(e) => handleFieldChange('age', e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="Età"
                    min="0"
                    max="150"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            ) : (
              <dl className="space-y-3">
                {currentLead.email && (
                  <div className="flex items-start">
                    <dt className="text-xs font-medium text-gray-500 w-20 pt-0.5">Email:</dt>
                    <dd className="text-sm text-gray-900 flex-1 break-all">{currentLead.email}</dd>
                  </div>
                )}
                {currentLead.phone && (
                  <div className="flex items-start">
                    <dt className="text-xs font-medium text-gray-500 w-20 pt-0.5">Telefono:</dt>
                    <dd className="text-sm text-gray-900 flex-1">{currentLead.phone}</dd>
                  </div>
                )}
                {currentLead.company && (
                  <div className="flex items-start">
                    <dt className="text-xs font-medium text-gray-500 w-20 pt-0.5">Azienda:</dt>
                    <dd className="text-sm text-gray-900 flex-1">{currentLead.company}</dd>
                  </div>
                )}
                {currentLead.age && (
                  <div className="flex items-start">
                    <dt className="text-xs font-medium text-gray-500 w-20 pt-0.5">Età:</dt>
                    <dd className="text-sm text-gray-900 flex-1">{currentLead.age} anni</dd>
                  </div>
                )}
              </dl>
            )}
          </div>

          {/* Qualification Status */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Qualificazione
            </h5>
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Status:</label>
                  <select
                    value={editedLead.qualification_status || 'new'}
                    onChange={(e) => handleFieldChange('qualification_status', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="new">New</option>
                    <option value="qualified">Qualified</option>
                    <option value="unqualified">Unqualified</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Lead Score (0-100):</label>
                  <input
                    type="number"
                    value={editedLead.lead_score || ''}
                    onChange={(e) => handleFieldChange('lead_score', e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="Lead Score"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex px-3 py-1.5 text-sm font-semibold rounded-full ${getQualificationColor(
                    currentLead.qualification_status
                  )}`}
                >
                  {currentLead.qualification_status || 'new'}
                </span>
                {currentLead.lead_score !== null && (
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Lead Score</p>
                    <p className="text-lg font-bold text-primary-600">{currentLead.lead_score}<span className="text-sm text-gray-500">/100</span></p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Goal/Intent */}
          <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
            <h5 className="text-sm font-bold text-gray-900 mb-2 flex items-center">
              <svg className="w-4 h-4 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Obiettivo
            </h5>
            {isEditing ? (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Goal (JSON Array):</label>
                <textarea
                  value={typeof editedLead.goal === 'string' ? editedLead.goal : JSON.stringify(editedLead.goal, null, 2)}
                  onChange={(e) => handleJsonFieldChange('goal', e.target.value)}
                  placeholder='["obiettivo 1", "obiettivo 2"]'
                  rows={4}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                />
                <p className="text-xs text-gray-500 mt-1">Formato: JSON Array</p>
              </div>
            ) : (
              currentLead.goal && (
                <div className="bg-white rounded-md p-3 mt-2 border border-purple-200">
                  {formatGoal(currentLead.goal)}
                </div>
              )
            )}
          </div>

          {/* Volume/Metrics */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h5 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Metriche Business
            </h5>
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Volume:</label>
                  <input
                    type="number"
                    value={editedLead.volume || ''}
                    onChange={(e) => handleFieldChange('volume', e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="Volume"
                    min="0"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Piano Suggerito:</label>
                  <input
                    type="text"
                    value={editedLead.plan_suggested || ''}
                    onChange={(e) => handleFieldChange('plan_suggested', e.target.value)}
                    placeholder="Piano Suggerito"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            ) : (
              (currentLead.volume || currentLead.plan_suggested) && (
                <dl className="space-y-2">
                  {currentLead.volume && (
                    <div className="flex justify-between items-center bg-white rounded px-3 py-2">
                      <dt className="text-xs font-medium text-gray-600">Volume:</dt>
                      <dd className="text-sm font-semibold text-gray-900">{currentLead.volume}</dd>
                    </div>
                  )}
                  {currentLead.plan_suggested && (
                    <div className="flex justify-between items-center bg-white rounded px-3 py-2">
                      <dt className="text-xs font-medium text-gray-600">Piano Suggerito:</dt>
                      <dd className="text-sm font-semibold text-blue-700">{currentLead.plan_suggested}</dd>
                    </div>
                  )}
                </dl>
              )
            )}
          </div>

          {/* Lead Source */}
          <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
            <h5 className="text-sm font-bold text-gray-900 mb-2 flex items-center">
              <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Fonte Lead
            </h5>
            {isEditing ? (
              <div>
                <input
                  type="text"
                  value={editedLead.lead_source || ''}
                  onChange={(e) => handleFieldChange('lead_source', e.target.value)}
                  placeholder="Fonte Lead"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            ) : (
              currentLead.lead_source && (
                <p className="text-sm font-medium text-gray-900 bg-white rounded px-3 py-2 mt-2">{currentLead.lead_source}</p>
              )
            )}
          </div>

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
                    style={{ width: `${currentLead.data_completeness || 0}%` }}
                  ></div>
                </div>
                <span className="text-sm font-bold text-primary-600 min-w-[3rem] text-right">{currentLead.data_completeness || 0}%</span>
              </div>
              <p className="text-xs text-gray-500">
                {(currentLead.data_completeness || 0) >= 80 ? '✓ Profilo completo' : '⚠ Informazioni mancanti'}
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
                <dd className="text-sm text-gray-900 flex-1">{formatDate(currentLead.first_contact)}</dd>
              </div>
              <div className="flex items-start bg-white rounded px-3 py-2">
                <dt className="text-xs font-medium text-gray-500 w-28 pt-0.5">Ultima Interazione:</dt>
                <dd className="text-sm text-gray-900 flex-1">{formatDate(currentLead.last_interaction)}</dd>
              </div>
            </dl>
          </div>

          {/* Profile Data (Additional JSON) */}
          <div className="bg-indigo-50 rounded-lg p-4 border-l-4 border-indigo-500">
            <h5 className="text-sm font-bold text-gray-900 mb-2 flex items-center">
              <svg className="w-4 h-4 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Dati Profilo
            </h5>
            {isEditing ? (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Profile Data (JSON Object):</label>
                <textarea
                  value={typeof editedLead.profile_data === 'string' ? editedLead.profile_data : JSON.stringify(editedLead.profile_data, null, 2)}
                  onChange={(e) => handleJsonFieldChange('profile_data', e.target.value)}
                  placeholder='{"chiave": "valore"}'
                  rows={6}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                />
                <p className="text-xs text-gray-500 mt-1">Formato: JSON Object</p>
              </div>
            ) : (
              currentLead.profile_data && Object.keys(currentLead.profile_data as object).length > 0 && (
                <div className="mt-2">
                  {formatProfileData(currentLead.profile_data)}
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Link Contact Modal */}
      <LinkContactModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        onLink={handleLinkContact}
        currentContactId={lead.id}
        platformClientId={String(lead.platform_client_id)}
      />
    </>
  )
}

export default LeadDetailsPanel
