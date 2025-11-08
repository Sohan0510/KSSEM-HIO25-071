import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register as apiRegister } from '../lib/api.js'

export default function Register() {
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('farmer')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError(''); setOk('')
    try {
      await apiRegister({ name, email, password, role })
      setOk('Registered! Now you can login.')
      setTimeout(()=> nav('/login', { replace: true }), 600)
    } catch (e) {
      setError(e?.response?.data?.error || 'Registration failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <div className="card w-full max-w-md">
        <h1 className="text-xl font-semibold mb-1">Create account</h1>
        <p className="text-gray-500 text-sm mb-4">Join as a farmer or admin (if allowed)</p>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="text-sm font-medium">Name</label>
            <input className="input mt-1" value={name} onChange={e=>setName(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <input type="email" className="input mt-1" value={email} onChange={e=>setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm font-medium">Password</label>
            <input type="password" className="input mt-1" value={password} onChange={e=>setPassword(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm font-medium">Role</label>
            <select className="input mt-1" value={role} onChange={e=>setRole(e.target.value)}>
              <option value="farmer">Farmer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          {ok && <div className="text-sm text-emerald-600">{ok}</div>}
          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? 'Creating…' : 'Register'}
          </button>
        </form>
        <div className="text-xs text-gray-500 mt-3">
          Already have an account? <Link to="/login" className="link">Login</Link>
        </div>
      </div>
    </div>
  )
}
