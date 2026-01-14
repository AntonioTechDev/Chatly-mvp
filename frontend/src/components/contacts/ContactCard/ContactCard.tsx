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
import type { SocialContact } from '@/core/types/database.types'
import { unlinkContact, getLinkedContacts } from '@/core/services/contactService'
import WhatsAppIcon from '@/img/whatsapp-icon.svg?react'
import InstagramIcon from '@/img/instagram-icon.svg?react'
import MessengerIcon from '@/img/messenger-icon.svg?react'
import PhoneIcon from '@/img/phone-icon.svg?react'
import BuildingIcon from '@/img/building-icon.svg?react'

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
        return <WhatsAppIcon className="contact-platform-icon whatsapp" />
      case 'instagram':
        return <InstagramIcon className="contact-platform-icon instagram" />
      case 'messenger':
        return <MessengerIcon className="contact-platform-icon messenger" />
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
                  <div key={linked.id} className="linked-contact-badge-mini">
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
              <PhoneIcon className="icon" />
              <span>{contact.phone}</span>
            </div>
          )}

          {contact.company && (
            <div className="detail">
              <BuildingIcon className="icon" />
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
