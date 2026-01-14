import React from 'react'
import './AuthLayout.css'

interface AuthLayoutProps {
    children: React.ReactNode
    title?: string
    subtitle?: string
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
    return (
        <div className="auth-layout">
            <div className="auth-card">
                {/* Header/Logo section can go here if shared */}

                {(title || subtitle) && (
                    <div className="auth-header">
                        <div className="logo-container">
                            {/* Placeholder for Logo - Replace with actual Image/Icon */}
                            <div className="logo-placeholder" />
                        </div>
                        {title && <h1 className="auth-title">{title}</h1>}
                        {subtitle && <p className="auth-subtitle">{subtitle}</p>}
                    </div>
                )}

                <div className="auth-content">
                    {children}
                </div>
            </div>

            <div className="auth-footer-links">
                <button className="footer-link">Privacy Policy</button>
                <button className="footer-link">Termini di Servizio</button>
                <button className="footer-link">Help Center</button>
            </div>
        </div>
    )
}
