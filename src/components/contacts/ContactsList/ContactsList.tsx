/**
 * ContactsList Component (Composition - Presentational)
 *
 * Presentational component that:
 * - Receives contacts[] from Page
 * - Handles rendering (grid/list, empty state)
 * - Renders ContactCard for each contact
 */

import React from 'react'
import { ContactCard } from '../ContactCard/ContactCard'
import './ContactsList.css'
import type { SocialContact } from '../../types/database.types'

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
                <th>Telefono</th>
                <th>Primo Contatto</th>
                <th>Ultimo Messaggio</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
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
                    <span className={`channel-badge ${contact.channel}`}>
                      {contact.channel}
                    </span>
                  </td>
                  <td>{contact.phone || '-'}</td>
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
              ))}
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
