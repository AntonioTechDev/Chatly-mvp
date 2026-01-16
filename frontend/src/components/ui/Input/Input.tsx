import React, { InputHTMLAttributes, forwardRef } from 'react'
import './Input.css'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className = '', type = 'text', label, error, ...props }, ref) => {
        return (
            <div className="input-container">
                {label && <label className="input-label">{label}</label>}
                <input
                    type={type}
                    className={`input-field ${error ? 'input-error' : ''} ${className}`}
                    ref={ref}
                    {...props}
                />
                {error && <span className="input-error-message">{error}</span>}
            </div>
        )
    }
)

Input.displayName = 'Input'
