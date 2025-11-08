import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext.jsx'
import { login as apiLogin } from '../lib/api.js'

export default function Login() {
  const nav = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('admin@example.com')
  const [password, setPassword] = useState('admin123')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const data = await apiLogin({ email, password }) // now flattened: { token, id, name, email, role }
      console.log('login response', data)
      login(data)
      const role = String(data?.role || '').toLowerCase()
      nav(role === 'admin' ? '/admin' : role === 'farmer' ? '/farmer' : '/', { replace: true })
    } catch (e) {
      console.error('login error', e)
      setError(e?.response?.data?.error || e?.message || 'Login failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <div className="card w-full max-w-md">
        <h1 className="text-xl font-semibold mb-1">Welcome back</h1>
        <p className="text-gray-500 text-sm mb-4">Login to continue</p>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="text-sm font-medium">Email</label>
            <input className="input mt-1" value={email} onChange={e=>setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm font-medium">Password</label>
            <input type="password" className="input mt-1" value={password} onChange={e=>setPassword(e.target.value)} required />
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>
        <div className="text-xs text-gray-500 mt-3">
          New here? <Link to="/register" className="link">Create an account</Link>
        </div>
      </div>
    </div>
  )
}
