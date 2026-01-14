/**
 * ViewModeToggle Component (Basic/Presentational)
 *
 * Toggle per cambiare modalità visualizzazione (griglia/lista)
 * Riutilizzabile in qualsiasi pagina (Documents, Leads, etc.)
 */

import React from 'react'
import './ViewModeToggle.css'
import ViewGridIcon from '@/img/view-grid-icon.svg?react'
import ViewListIcon from '@/img/view-list-icon.svg?react'

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
        <ViewGridIcon className="icon" />
      </button>

      <button
        type="button"
        onClick={() => onChange('list')}
        className={`button ${value === 'list' ? 'active' : ''}`}
        title="Visualizzazione lista"
        aria-label="Visualizzazione lista"
      >
        <ViewListIcon className="icon" />
      </button>
    </div>
  )
}
