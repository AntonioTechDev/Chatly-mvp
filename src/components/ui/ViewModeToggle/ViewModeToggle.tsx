/**
 * ViewModeToggle Component (Basic/Presentational)
 *
 * Toggle per cambiare modalità visualizzazione (griglia/lista)
 * Riutilizzabile in qualsiasi pagina (Documents, Leads, etc.)
 */

import React from 'react'
import './ViewModeToggle.css'

type ViewMode = 'grid' | 'list'

interface ViewModeToggleProps {
  value: ViewMode
  onChange: (mode: ViewMode) => void
  className?: string
}

export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({
  value,
  onChange,
  className = ''
}) => {
  return (
    <div className={`view-mode-toggle ${className}`}>
      <button
        type="button"
        onClick={() => onChange('grid')}
        className={`button ${value === 'grid' ? 'active' : ''}`}
        title="Visualizzazione griglia"
        aria-label="Visualizzazione griglia"
      >
        <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      </button>

      <button
        type="button"
        onClick={() => onChange('list')}
        className={`button ${value === 'list' ? 'active' : ''}`}
        title="Visualizzazione lista"
        aria-label="Visualizzazione lista"
      >
        <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </div>
  )
}
