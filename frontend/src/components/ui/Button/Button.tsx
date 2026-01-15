/**
 * Button Component (Basic/Presentational)
 *
 * Reusable button with variants - no business logic
 */

import React from 'react'
import './Button.css'

interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  isLoading?: boolean
  title?: string
  className?: string
  type?: 'button' | 'submit' | 'reset'
  style?: React.CSSProperties
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'secondary',
  size = 'md',
  disabled = false,
  isLoading = false,
  title,
  className = '',
  type = 'button',
  style
}) => {
  const buttonClasses = [
    'button',
    variant,
    size,
    (disabled || isLoading) && 'disabled',
    className
  ].filter(Boolean).join(' ')

  return (
    <button
      className={buttonClasses}
      onClick={isLoading ? undefined : onClick}
      disabled={disabled || isLoading}
      title={title}
      type={type}
      style={style}
    >
      {isLoading && (
        <span className="button-spinner" style={{ marginRight: '0.5rem', display: 'inline-block', width: '1em', height: '1em', border: '2px solid currentColor', borderRightColor: 'transparent', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
      )}
      {children}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </button>
  )
}
