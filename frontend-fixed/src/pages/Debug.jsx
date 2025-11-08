import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../state/AuthContext.jsx'

export default function Debug() {
  const { user } = useAuth()
  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="text-xl font-semibold">Debug / Routing</h2>
        <p className="text-sm text-gray-500">Current user object from AuthContext (localStorage):</p>
        <pre className="text-xs bg-gray-50 p-3 rounded-xl overflow-auto">{JSON.stringify(user, null, 2)}</pre>
      </div>

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Link to="/login" className="btn btn-ghost">/login</Link>
          <Link to="/register" className="btn btn-ghost">/register</Link>
          <Link to="/admin" className="btn btn-ghost">/admin</Link>
          <Link to="/admin/farmers" className="btn btn-ghost">/admin/farmers</Link>
          <Link to="/admin/verify-all" className="btn btn-ghost">/admin/verify-all</Link>
          <Link to="/farmer" className="btn btn-ghost">/farmer</Link>
          <Link to="/farmer/devices" className="btn btn-ghost">/farmer/devices</Link>
        </div>
      </div>
    </div>
  )
}
