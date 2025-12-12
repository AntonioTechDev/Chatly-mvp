/**
 * Card Component (Basic/Presentational)
 *
 * Generic card UI component - no business logic
 */

import React from 'react'
import './Card.css'

interface CardProps {
  children: React.ReactNode
  className?: string
  selected?: boolean
  onClick?: () => void
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  selected = false,
  onClick
}) => {
  const cardClasses = [
    'card',
    selected && 'selected',
    onClick && 'clickable',
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={cardClasses} onClick={onClick}>
      {children}
    </div>
  )
}
