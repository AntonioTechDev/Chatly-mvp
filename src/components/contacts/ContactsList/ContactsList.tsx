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
  viewMode?: 'grid' | 'list'
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
