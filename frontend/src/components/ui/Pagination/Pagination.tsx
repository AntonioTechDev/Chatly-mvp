/**
 * Pagination Component (Basic/Presentational)
 *
 * Controlli paginazione - no logica business
 */

import React from 'react'
import './Pagination.css'
import ChevronLeftIcon from '@/img/chevron-left-icon.svg?react'
import ChevronRightIcon from '@/img/chevron-right-icon.svg?react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className = ''
}) => {
  // Helper per generare array di numeri pagina
  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = []

    if (totalPages <= 7) {
      // Mostra tutte le pagine se sono <= 7
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Mostra: 1 ... 4 5 6 ... 10
      pages.push(1)

      if (currentPage > 3) {
        pages.push('...')
      }

      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i)
      }

      if (currentPage < totalPages - 2) {
        pages.push('...')
      }

      pages.push(totalPages)
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className={`pagination ${className}`}>
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="button prev"
        title="Pagina precedente"
      >
        <ChevronLeftIcon className="icon" />
      </button>

      {/* Page Numbers */}
      <div className="numbers">
        {pageNumbers.map((page, index) => {
          if (page === '...') {
            return (
              <span key={`ellipsis-${index}`} className="ellipsis">
                ...
              </span>
            )
          }

          return (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              className={`number ${currentPage === page ? 'active' : ''}`}
            >
              {page}
            </button>
          )
        })}
      </div>

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="button next"
        title="Pagina successiva"
      >
        <ChevronRightIcon className="icon" />
      </button>

      {/* Info */}
      <span className="info">
        Pagina {currentPage} di {totalPages}
      </span>
    </div>
  )
}
