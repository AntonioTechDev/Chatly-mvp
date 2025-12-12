/**
 * PageSizeSelector Component (Basic/Presentational)
 *
 * Selector per scegliere quanti elementi mostrare per pagina
 */

import React from 'react'
import './PageSizeSelector.css'

interface PageSizeSelectorProps {
  value: number
  options?: number[]
  onChange: (size: number) => void
  totalItems: number
  className?: string
}

export const PageSizeSelector: React.FC<PageSizeSelectorProps> = ({
  value,
  options = [5, 10, 20, 50],
  onChange,
  totalItems,
  className = ''
}) => {
  return (
    <div className={`page-size-selector ${className}`}>
      <label className="label">
        Mostra
      </label>

      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="select"
      >
        {options.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>

      <span className="text">
        di {totalItems} {totalItems === 1 ? 'elemento' : 'elementi'}
      </span>
    </div>
  )
}
