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
import type { SocialContact } from '@/core/types/database.types'
import { getLinkedContacts } from '@/core/services/contactService'
import WhatsAppIcon from '@/img/whatsapp-icon.svg?react'
import InstagramIcon from '@/img/instagram-icon.svg?react'
import MessengerIcon from '@/img/messenger-icon.svg?react'
import UserIcon from '@/img/user-icon.svg?react'
import EmptyIcon from '@/img/inbox-icon.svg?react' // Using inbox icon as generic empty placeholder or keep SVG if specific
import EyeIcon from '@/img/eye-icon.svg?react'

interface ContactsListProps {
  contacts: SocialContact[]
  viewMode?: 'grid' | 'list' | 'table'
  emptyMessage?: string
  onContactClick?: (contact: SocialContact) => void
  refreshTrigger?: number // Add refresh trigger to force reload
}

export const ContactsList: React.FC<ContactsListProps> = ({
  contacts,
  viewMode = 'grid',
  emptyMessage = 'Nessun contatto trovato',
  onContactClick,
  refreshTrigger = 0,
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
  }, [contacts, viewMode, refreshTrigger]) // Add refreshTrigger to dependencies

  // Get platform icon
  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'whatsapp':
        return <WhatsAppIcon className="platform-icon whatsapp" />
      case 'instagram':
        return <InstagramIcon className="platform-icon instagram" />
      case 'messenger':
        return <MessengerIcon className="platform-icon messenger" />
      default:
        return null
    }
  }
  // Empty state
  if (contacts.length === 0) {
    return (
      <div className="contacts-list empty">
        <EmptyIcon className="icon empty" />
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
                              <div key={linked.id} className="linked-contact-badge">
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
                        <EyeIcon className="action-icon" />
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
