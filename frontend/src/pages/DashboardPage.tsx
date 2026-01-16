import React from 'react'
import { useAuth } from '@/contexts/AuthContext'

export default function DashboardPage() {
    const { user, logout } = useAuth()

    return (
        <div style={{ padding: '2rem' }}>
            <h1>Dashboard</h1>
            <p>Benvenuto, {user?.email}</p>
            <button onClick={logout}>Logout</button>
        </div>
    )
}
