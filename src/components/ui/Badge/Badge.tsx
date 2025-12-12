/**
 * Badge Component (Basic/Presentational)
 *
 * Small label/tag component
 */

import React from 'react'
import './Badge.css'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'info' | 'success' | 'warning' | 'danger'
  className?: string
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'info',
  className = ''
}) => {
  const badgeClasses = [
    'badge',
    variant,
    className
  ].filter(Boolean).join(' ')

  return (
    <span className={badgeClasses}>
      {children}
    </span>
  )
}
