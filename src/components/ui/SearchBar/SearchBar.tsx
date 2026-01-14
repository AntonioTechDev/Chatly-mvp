/**
 * SearchBar Component (Basic/Presentational)
 *
 * Input di ricerca con icona - no logica business
 */

import React from 'react'
import './SearchBar.css'
import SearchIcon from '@/img/search-icon.svg?react'
import CloseIcon from '@/img/close-icon.svg?react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Cerca...',
  className = ''
}) => {
  return (
    <div className={`search-bar ${className}`}>
      <SearchIcon className="icon" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="clear"
          title="Cancella"
        >
          <CloseIcon className="clear-icon" />
        </button>
      )}
    </div>
  )
}
