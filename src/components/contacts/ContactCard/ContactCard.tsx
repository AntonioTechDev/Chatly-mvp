/**
 * ContactCard Component (Composition)
 *
 * Displays a single contact with:
 * - Contact info (name, email, phone, company)
 * - Channel badge
 * - Linked channels icons
 * - Dates (first contact, last interaction)
 * - Uses basic components (Card, Badge)
 */

import React, { useMemo, useEffect, useState } from 'react'
import { Card } from '../../ui/Card/Card'
import { Badge } from '../../ui/Badge/Badge'
import './ContactCard.css'
import type { SocialContact } from '../../types/database.types'
import { getLinkedContacts } from '../../../services/contactService'

interface ContactCardProps {
  contact: SocialContact
  onClick?: (contact: SocialContact) => void
}

export const ContactCard: React.FC<ContactCardProps> = ({ contact, onClick }) => {
  const [linkedContacts, setLinkedContacts] = useState<SocialContact[]>([])

  useEffect(() => {
    const loadLinkedContacts = async () => {
      try {
        const linked = await getLinkedContacts(contact.id)
        setLinkedContacts(linked)
      } catch (error) {
        console.error('Error loading linked contacts:', error)
      }
    }
    loadLinkedContacts()
  }, [contact.id])
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

  // Get platform icon
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
        return null
    }
  }

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
            <Badge variant={channelVariant}>{channelName}</Badge>
          </div>
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
