/**
 * FilterButtons Component (Basic/Presentational)
 *
 * Bottoni per filtrare - no logica business
 */

import React from 'react'
import './FilterButtons.css'

export interface FilterOption {
  value: string
  label: string
  count?: number
}

interface FilterButtonsProps {
  options: FilterOption[]
  selected: string
  onSelect: (value: string) => void
  className?: string
}

export const FilterButtons: React.FC<FilterButtonsProps> = ({
  options,
  selected,
  onSelect,
  className = ''
}) => {
  return (
    <div className={`filter-buttons ${className}`}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onSelect(option.value)}
          className={`button ${selected === option.value ? 'active' : ''}`}
        >
          {option.label}
          {option.count !== undefined && (
            <span className="count">({option.count})</span>
          )}
        </button>
      ))}
    </div>
  )
}
