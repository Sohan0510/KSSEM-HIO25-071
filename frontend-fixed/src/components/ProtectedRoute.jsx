import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext.jsx'

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth()
  // While auth is loading from localStorage, don't redirect — show nothing (or a loader)
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  const userRole = String(user.role || '').toLowerCase()
  if (role && userRole !== role) {
    // Unknown or mismatched role — log to help debugging and redirect safely
    console.warn('ProtectedRoute: role mismatch', { expected: role, actual: user.role })
    if (userRole === 'admin') return <Navigate to="/admin" replace />
    if (userRole === 'farmer') return <Navigate to="/farmer" replace />
    // If role is unexpected, force logout by redirecting to login
    return <Navigate to="/login" replace />
  }
  return children
}
