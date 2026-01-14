import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import './WelcomeModal.css'

interface WelcomeModalProps {
    isOpen: boolean
    onClose: () => void
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose }) => {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true)
            document.body.style.overflow = 'hidden'
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300)
            document.body.style.overflow = ''
            return () => clearTimeout(timer)
        }
    }, [isOpen])

    if (!isVisible && !isOpen) return null

    return createPortal(
        <div className={`welcome-modal-overlay ${isOpen ? 'open' : ''}`}>
            <div className="welcome-modal-content">
                <div className="welcome-header">
                    <div className="welcome-icon-container">
                        {/* Check icon or similar */}
                        <div className="welcome-icon-placeholder" />
                    </div>
                    {/* Decorative stars */}
                </div>

                <h2 className="welcome-title">Benvenuto su Chatly! 🎉</h2>
                <p className="welcome-text">
                    Sei a pochi passi dall'automatizzare il tuo customer service.
                    Guarda questo video di 2 minuti per iniziare.
                </p>

                <div className="welcome-video-container">
                    {/* Thumbnail placeholder */}
                    <div className="play-button" />
                </div>

                <div className="welcome-actions">
                    <button className="btn-start-tour" onClick={onClose}>
                        Inizia il tour guidato
                    </button>
                    <button className="btn-skip" onClick={onClose}>
                        Salta, voglio esplorare da solo
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}
