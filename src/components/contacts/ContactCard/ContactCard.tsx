/**
 * ContactCard Component (Composition)
 *
 * Displays a single contact with:
 * - Contact info (name, email, phone, company)
 * - Channel badge
 * - Dates (first contact, last interaction)
 * - Uses basic components (Card, Badge)
 */

import React, { useMemo } from 'react'
import { Card } from '../../ui/Card/Card'
import { Badge } from '../../ui/Badge/Badge'
import './ContactCard.css'
import type { SocialContact } from '../../types/database.types'

interface ContactCardProps {
  contact: SocialContact
  onClick?: (contact: SocialContact) => void
}

export const ContactCard: React.FC<ContactCardProps> = ({ contact, onClick }) => {
  // Format date
  const formatDate = useMemo(() => {
    return (dateString: string | null | undefined) => {
      if (!dateString) return 'N/A'
      return new Date(dateString).toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    }
  }, [])

  // Get badge variant based on channel
  const channelVariant = useMemo(() => {
    switch (contact.platform) {
      case 'whatsapp':
        return 'success'
      case 'instagram':
        return 'danger'
      case 'messenger':
        return 'info'
      default:
        return 'info'
    }
  }, [contact.platform])

  // Get channel display name
  const channelName = useMemo(() => {
    return contact.platform?.charAt(0).toUpperCase() + contact.platform?.slice(1)
  }, [contact.platform])

  return (
    <Card className="contact-card" onClick={onClick ? () => onClick(contact) : undefined}>
      <div className="content">
        {/* Header */}
        <div className="header">
          <div className="info">
            <h3 className="name">
              {contact.display_name || contact.name || 'N/A'}
            </h3>
            {contact.email && <p className="email">{contact.email}</p>}
          </div>
          <Badge variant={channelVariant}>{channelName}</Badge>
        </div>

        {/* Contact details */}
        <div className="details">
          {contact.phone && (
            <div className="detail">
              <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              <span>{contact.phone}</span>
            </div>
          )}

          {contact.company && (
            <div className="detail">
              <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <span>{contact.company}</span>
            </div>
          )}
        </div>

        {/* Footer - Dates */}
        <div className="footer">
          <div className="date">
            <span className="label">Primo contatto:</span>
            <span className="value">{formatDate(contact.first_contact)}</span>
          </div>
          <div className="date">
            <span className="label">Ultimo messaggio:</span>
            <span className="value">{formatDate(contact.last_interaction)}</span>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default React.memo(ContactCard)
