/**
 * ContactsList Component (Composition - Presentational)
 *
 * Presentational component that:
 * - Receives contacts[] from Page
 * - Handles rendering (grid/list, empty state)
 * - Renders ContactCard for each contact
 */

import React, { useEffect, useState } from 'react'
import { ContactCard } from '../ContactCard/ContactCard'
import './ContactsList.css'
import type { SocialContact } from '../../types/database.types'
import { getLinkedContacts } from '../../../services/contactService'

interface ContactsListProps {
  contacts: SocialContact[]
  viewMode?: 'grid' | 'list' | 'table'
  emptyMessage?: string
  onContactClick?: (contact: SocialContact) => void
}

export const ContactsList: React.FC<ContactsListProps> = ({
  contacts,
  viewMode = 'grid',
  emptyMessage = 'Nessun contatto trovato',
  onContactClick,
}) => {
  const [linkedContactsMap, setLinkedContactsMap] = useState<Record<number, SocialContact[]>>({})

  // Load linked contacts for all contacts
  useEffect(() => {
    const loadAllLinkedContacts = async () => {
      const map: Record<number, SocialContact[]> = {}
      for (const contact of contacts) {
        try {
          const linked = await getLinkedContacts(contact.id)
          map[contact.id] = linked
        } catch (error) {
          console.error(`Error loading linked contacts for ${contact.id}:`, error)
          map[contact.id] = []
        }
      }
      setLinkedContactsMap(map)
    }

    if (viewMode === 'table' && contacts.length > 0) {
      loadAllLinkedContacts()
    }
  }, [contacts, viewMode])

  // Get platform icon
  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'whatsapp':
        return (
          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
        )
      case 'instagram':
        return (
          <svg className="w-4 h-4 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
          </svg>
        )
      case 'messenger':
        return (
          <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.373 0 0 4.975 0 11.111c0 3.497 1.745 6.616 4.472 8.652V24l4.086-2.242c1.09.301 2.246.464 3.442.464 6.627 0 12-4.974 12-11.11C24 4.975 18.627 0 12 0zm1.193 14.963l-3.056-3.259-5.963 3.259L10.732 8l3.13 3.259L19.752 8l-6.559 6.963z"/>
          </svg>
        )
      default:
        return null
    }
  }
  // Empty state
  if (contacts.length === 0) {
    return (
      <div className="contacts-list empty">
        <svg className="icon empty" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <p className="message">{emptyMessage}</p>
      </div>
    )
  }

  // Table view
  if (viewMode === 'table') {
    return (
      <div className="contacts-list table">
        <div className="table-container">
          <table className="contacts-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Canale</th>
                <th>Email</th>
                <th>Telefono</th>
                <th>Azienda</th>
                <th>Primo Contatto</th>
                <th>Ultimo Messaggio</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => {
                const linkedContacts = linkedContactsMap[contact.id] || []
                // Get phone from any linked channel
                const phone = linkedContacts.find(c => c.phone)?.phone || contact.phone
                // Get email from any linked channel
                const email = linkedContacts.find(c => c.email)?.email || contact.email
                // Get company from any linked channel
                const company = linkedContacts.find(c => c.company)?.company || contact.company

                return (
                  <tr
                    key={contact.id}
                    onClick={() => onContactClick && onContactClick(contact)}
                    className="table-row"
                  >
                    <td className="name-cell">
                      <div className="flex items-center gap-3">
                        <div className="avatar">
                          {(contact.display_name || contact.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium">
                          {contact.display_name || contact.name || contact.phone || 'Sconosciuto'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {/* Linked channels icons */}
                        {linkedContacts.length > 1 && (
                          <div className="flex items-center gap-1" title={`${linkedContacts.length} canali collegati`}>
                            {linkedContacts.map((linked) => (
                              <div key={linked.id} className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow border border-gray-200">
                                {getPlatformIcon(linked.platform)}
                              </div>
                            ))}
                          </div>
                        )}
                        <span className={`channel-badge ${contact.platform}`}>
                          {contact.platform}
                        </span>
                      </div>
                    </td>
                    <td>{email || '-'}</td>
                    <td>{phone || '-'}</td>
                    <td>{company || '-'}</td>
                  <td>
                    {contact.first_contact
                      ? new Date(contact.first_contact).toLocaleDateString('it-IT')
                      : '-'}
                  </td>
                  <td>
                    {contact.last_interaction
                      ? new Date(contact.last_interaction).toLocaleDateString('it-IT')
                      : '-'}
                  </td>
                  <td>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onContactClick && onContactClick(contact)
                      }}
                      className="action-button"
                      title="Vedi dettagli"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </button>
                  </td>
                </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // Contacts grid or list
  return (
    <div className="contacts-list">
      <div className={viewMode}>
        {contacts.map((contact) => (
          <ContactCard
            key={contact.id}
            contact={contact}
            onClick={onContactClick}
          />
        ))}
      </div>
    </div>
  )
}

export default ContactsList
