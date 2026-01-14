import React, { useState, useEffect } from 'react'
import type { SocialContact } from '@/core/types/database.types'
import { updateContact, getLinkedContacts, linkContacts, unlinkContact } from '@/core/services/contactService'
import { LinkContactModal } from '../contacts/LinkContactModal/LinkContactModal'
import './LeadDetailsPanel.css'
import PencilIcon from '@/img/pencil-icon.svg?react'
import CloseIcon from '@/img/close-icon.svg?react'
import UsersIcon from '@/img/users-icon.svg?react'
import PlusIcon from '@/img/plus-icon.svg?react'
import PhoneIcon from '@/img/phone-icon.svg?react'
import EnvelopeIcon from '@/img/envelope-icon.svg?react'
import BuildingIcon from '@/img/building-icon.svg?react'
import CheckCircleIcon from '@/img/check-circle-icon.svg?react'
import LightningIcon from '@/img/lightning-icon.svg?react'
import ChartBarIcon from '@/img/chart-bar-icon.svg?react'
import CalendarIcon from '@/img/calendar-icon.svg?react'
import ClockIcon from '@/img/clock-icon.svg?react'
import WhatsappIcon from '@/img/whatsapp-icon.svg?react'
import InstagramIcon from '@/img/instagram-icon.svg?react'
import MessengerIcon from '@/img/messenger-icon.svg?react'
import UserCircleIcon from '@/img/user-circle-icon.svg?react'
import SpinnerIcon from '@/img/spinner.svg?react'
import LocationSearchIcon from '@/img/location-search-icon.svg?react'
import UserIcon from '@/img/user-icon.svg?react'

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

      // Notify parent to refetch contacts (a contact may have become slave)
      onUpdate?.(lead)
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

      // Notify parent that a contact was unlinked (now becomes a new master)
      // Trigger refetch to show the unlinked contact as a new master in the table
      const unlinkedContact = linkedContacts.find(c => c.id === contactId)
      if (unlinkedContact) {
        // The unlinked contact is now a master, notify parent to refetch
        onUpdate?.(lead) // Trigger refetch with current lead
      }
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
        onUpdate?.(newMaster)
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
          <WhatsappIcon className="platform-icon-svg text-whatsapp" />
        )
      case 'instagram':
        return (
          <InstagramIcon className="platform-icon-svg text-instagram" />
        )
      case 'messenger':
        return (
          <MessengerIcon className="platform-icon-svg text-messenger" />
        )
      default:
        return (
          <UserCircleIcon className="platform-icon-svg text-gray-600" />
        )
    }
  }

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'whatsapp':
        return 'p-whatsapp'
      case 'instagram':
        return 'p-instagram'
      case 'messenger':
        return 'p-messenger'
      default:
        return 'p-default'
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
        return 'status-qualified'
      case 'unqualified':
        return 'status-unqualified'
      case 'new':
      default:
        return 'status-new'
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
        <ul className="goal-list">
          {goal.map((item, index) => (
            <li key={index}>
              {typeof item === 'object' ? JSON.stringify(item) : item}
            </li>
          ))}
        </ul>
      )
    }

    // If it's an object, show key-value pairs
    if (typeof goal === 'object') {
      return (
        <dl className="goal-dl">
          {Object.entries(goal).map(([key, value]) => (
            <div key={key} className="goal-item">
              <dt>
                {key.replace(/_/g, ' ')}:
              </dt>
              <dd>
                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
              </dd>
            </div>
          ))}
        </dl>
      )
    }

    // If it's a string or primitive
    return <p className="goal-text">{String(goal)}</p>
  }

  const formatProfileData = (profileData: any) => {
    if (!profileData) return null

    // If it's an array, show as cards
    if (Array.isArray(profileData)) {
      return (
        <div className="profile-data-list">
          {profileData.map((item, index) => (
            <div key={index} className="profile-data-card">
              <p>
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
        <div className="profile-data-grid">
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
                  <ul className="goal-list">
                    {value.map((item, idx) => (
                      <li key={idx}>
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
              <div key={key} className="profile-data-row">
                <dt>
                  {key.replace(/_/g, ' ')}
                </dt>
                <dd>{formattedValue}</dd>
              </div>
            )
          })}
        </div>
      )
    }

    // If it's a string or primitive
    return (
      <div className="profile-data-simple">
        <p>{String(profileData)}</p>
      </div>
    )
  }

  const currentLead = isEditing ? editedLead : lead

  return (
    <>
      {/* Overlay */}
      <div
        className="lead-details-overlay"
        onClick={onClose}
      ></div>

      {/* Panel */}
      <div className="lead-details-panel">
        {/* Header */}
        <div className="panel-header">
          <h3>Dettagli Lead</h3>
          <div className="actions">
            {!isEditing ? (
              <button
                onClick={handleEdit}
              >
                <PencilIcon />
              </button>
            ) : (
              <>
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="btn-secondary"
                >
                  Annulla
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="btn-primary"
                >
                  {isSaving ? (
                    <>
                      <SpinnerIcon className="animate-spin" />
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
              className="icon-button close"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="panel-error">
            <p>{error}</p>
          </div>
        )}

        {/* Content */}
        <div className="panel-content">
          {/* Profile Section */}
          <div className="profile-section">
            <div className="avatar">
              <span>
                {((currentLead as SocialContact).display_name || (currentLead as SocialContact).name || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
            {isEditing ? (
              <div className="edit-form">
                <input
                  type="text"
                  value={editedLead.display_name || ''}
                  onChange={(e) => handleFieldChange('display_name', e.target.value)}
                  placeholder="Display Name"
                />
                <div className="row">
                  <input
                    type="text"
                    value={editedLead.name || ''}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    placeholder="Nome"
                  />
                  <input
                    type="text"
                    value={editedLead.surname || ''}
                    onChange={(e) => handleFieldChange('surname', e.target.value)}
                    placeholder="Cognome"
                  />
                </div>
              </div>
            ) : (
              <div className="info">
                <h4>
                  {currentLead.display_name || currentLead.name || 'Nome non disponibile'}
                </h4>
                <p>
                  <span className="platform-badge">
                    {currentLead.platform}
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Linked Contacts Section */}
          <div className="linked-contacts-section">
            <div className="header-row">
              <h5 className="section-title">
                <UsersIcon />
                Canali Collegati
              </h5>
              {!isEditing && (
                <button
                  onClick={() => setIsLinkModalOpen(true)}
                  className="btn-link"
                  title="Collega altro canale"
                >
                  <PlusIcon />
                  Collega
                </button>
              )}
            </div>

            {isLoadingLinked ? (
              <div className="flex items-center justify-center py-4">
                <SpinnerIcon className="linked-contacts-loading-spinner" />
              </div>
            ) : linkedContacts.length > 0 ? (
              <div className="space-y-2">
                {linkedContacts.map((contact) => {
                  const isCurrent = contact.id === lead.id
                  const isMaster = !contact.master_contact_id

                  return (
                    <div
                      key={contact.id}
                      className={`contact-card ${isCurrent ? 'current' : ''}`}
                    >
                      {/* Header with Avatar and Actions */}
                      <div className="top-row">
                        <div className="info-group">
                          <div className="avatar-small">
                            <span>
                              {(contact.display_name || contact.name || 'U').charAt(0).toUpperCase()}
                            </span>
                            <div className="platform-icon">
                              {getPlatformIcon(contact.platform)}
                            </div>
                          </div>
                          <div className="details">
                            <p className="name">
                              {contact.display_name || contact.name || 'N/A'}
                            </p>
                            <span className={`platform-tag ${getPlatformColor(contact.platform)}`}>
                              {contact.platform}
                            </span>
                          </div>
                        </div>
                        {!isEditing && !isCurrent && (
                          <div className="flex gap-1">
                            {contact.master_contact_id && (
                              <button
                                onClick={() => handleUnlinkContact(contact.id)}
                                className="unlink-btn"
                                title="Scollega"
                              >
                                <CloseIcon />
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Contact Details - Vertical Layout */}
                      <div className="space-y-2 text-sm">
                        {/* Badges */}
                        <div className="badges">
                          {isMaster && (
                            <span className="badge-master">
                              ⭐ Principale
                            </span>
                          )}
                          {isCurrent && (
                            <span className="badge-current">
                              📍 Corrente
                            </span>
                          )}
                        </div>

                        <div className="meta-list">
                          {/* Phone */}
                          {contact.phone && (
                            <div className="meta-item">
                              <PhoneIcon />
                              <span>{contact.phone}</span>
                            </div>
                          )}

                          {/* Email */}
                          {contact.email && (
                            <div className="meta-item">
                              <EnvelopeIcon />
                              <span className="truncate">{contact.email}</span>
                            </div>
                          )}

                          {/* Company */}
                          {contact.company && (
                            <div className="meta-item">
                              <BuildingIcon />
                              <span>{contact.company}</span>
                            </div>
                          )}
                        </div>

                        {/* Set as Master button */}
                        {!isEditing && !isMaster && linkedContacts.length > 1 && (
                          <button
                            onClick={() => handleSetAsMaster(contact.id)}
                            className="btn-make-master"
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
          <div className="info-section">
            <h5 className="section-title">
              <EnvelopeIcon />
              Informazioni di Contatto
            </h5>
            {isEditing ? (
              <div className="edit-form">
                <div>
                  <label>Email:</label>
                  <input
                    type="email"
                    value={editedLead.email || ''}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label>Telefono:</label>
                  <input
                    type="tel"
                    value={editedLead.phone || ''}
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                    placeholder="+39 123 456 7890"
                  />
                </div>
                <div>
                  <label>Azienda:</label>
                  <input
                    type="text"
                    value={editedLead.company || ''}
                    onChange={(e) => handleFieldChange('company', e.target.value)}
                    placeholder="Nome Azienda"
                  />
                </div>
                <div>
                  <label>Età:</label>
                  <input
                    type="number"
                    value={editedLead.age || ''}
                    onChange={(e) => handleFieldChange('age', e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="Età"
                    min="0"
                    max="150"
                  />
                </div>
              </div>
            ) : (
              <dl className="info-list">
                {currentLead.email && (
                  <div className="info-row">
                    <dt>Email:</dt>
                    <dd>{currentLead.email}</dd>
                  </div>
                )}
                {currentLead.phone && (
                  <div className="info-row">
                    <dt>Telefono:</dt>
                    <dd>{currentLead.phone}</dd>
                  </div>
                )}
                {currentLead.company && (
                  <div className="info-row">
                    <dt>Azienda:</dt>
                    <dd>{currentLead.company}</dd>
                  </div>
                )}
                {currentLead.age && (
                  <div className="info-row">
                    <dt>Età:</dt>
                    <dd>{currentLead.age} anni</dd>
                  </div>
                )}
              </dl>
            )}
          </div>

          {/* Qualification Status */}
          <div className="qualification-section">
            <h5 className="section-title">
              <CheckCircleIcon />
              Qualificazione
            </h5>
            {isEditing ? (
              <div className="edit-form">
                <div>
                  <label>Status:</label>
                  <select
                    value={editedLead.qualification_status || 'new'}
                    onChange={(e) => handleFieldChange('qualification_status', e.target.value)}
                  >
                    <option value="new">New</option>
                    <option value="qualified">Qualified</option>
                    <option value="unqualified">Unqualified</option>
                  </select>
                </div>
                <div>
                  <label>Lead Score (0-100):</label>
                  <input
                    type="number"
                    value={editedLead.lead_score || ''}
                    onChange={(e) => handleFieldChange('lead_score', e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="Lead Score"
                    min="0"
                    max="100"
                  />
                </div>
              </div>
            ) : (
              <div className="status-display">
                <span
                  className={`status-badge ${getQualificationColor(
                    currentLead.qualification_status
                  )}`}
                >
                  {currentLead.qualification_status || 'new'}
                </span>
                {currentLead.lead_score !== null && (
                  <div className="score-display">
                    <p className="label">Lead Score</p>
                    <p className="value">{currentLead.lead_score}<span>/100</span></p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Goal/Intent */}
          <div className="info-section">
            <h5 className="section-title">
              <LightningIcon />
              Obiettivo
            </h5>
            {isEditing ? (
              <div className="edit-form">
                <label>Goal (JSON Array):</label>
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
                <div className="mt-2 text-sm text-gray-700">
                  {formatGoal(currentLead.goal)}
                </div>
              )
            )}
          </div>

          {/* Volume/Metrics */}
          <div className="info-section">
            <h5 className="section-title">
              <ChartBarIcon />
              Metriche Business
            </h5>
            {isEditing ? (
              <div className="edit-form">
                <div>
                  <label>Volume:</label>
                  <input
                    type="number"
                    value={editedLead.volume || ''}
                    onChange={(e) => handleFieldChange('volume', e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="Volume"
                    min="0"
                  />
                </div>
                <div>
                  <label>Piano Suggerito:</label>
                  <input
                    type="text"
                    value={editedLead.plan_suggested || ''}
                    onChange={(e) => handleFieldChange('plan_suggested', e.target.value)}
                    placeholder="Piano Suggerito"
                  />
                </div>
              </div>
            ) : (
              (currentLead.volume || currentLead.plan_suggested) && (
                <dl className="info-list">
                  {currentLead.volume && (
                    <div className="info-row">
                      <dt>Volume:</dt>
                      <dd>{currentLead.volume}</dd>
                    </div>
                  )}
                  {currentLead.plan_suggested && (
                    <div className="info-row">
                      <dt>Piano Suggerito:</dt>
                      <dd>{currentLead.plan_suggested}</dd>
                    </div>
                  )}
                </dl>
              )
            )}
          </div>

          {/* Leads Source */}
          <div className="info-section">
            <h5 className="section-title">
              <LocationSearchIcon />
              Fonte Lead
            </h5>
            {isEditing ? (
              <div className="edit-form">
                <input
                  type="text"
                  value={editedLead.lead_source || ''}
                  onChange={(e) => handleFieldChange('lead_source', e.target.value)}
                  placeholder="Fonte Lead"
                />
              </div>
            ) : (
              currentLead.lead_source && (
                <div className="mt-2 text-sm text-gray-900 bg-white rounded px-3 py-2">
                  {currentLead.lead_source}
                </div>
              )
            )}
          </div>

          {/* Dates */}
          <div className="info-section">
            <h5 className="section-title">
              <ClockIcon />
              Timeline
            </h5>
            <dl className="info-list">
              <div className="info-row">
                <dt>Primo Contatto:</dt>
                <dd>{formatDate(currentLead.first_contact)}</dd>
              </div>
              <div className="info-row">
                <dt>Ultima Interazione:</dt>
                <dd>{formatDate(currentLead.last_interaction)}</dd>
              </div>
            </dl>
          </div>

          {/* Profile Data (Additional JSON) */}
          <div className="info-section">
            <h5 className="section-title">
              <UserIcon />
              Dati Profilo
            </h5>
            {isEditing ? (
              <div className="edit-form">
                <label>Profile Data (JSON Object):</label>
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
