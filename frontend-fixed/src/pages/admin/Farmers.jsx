import React, { useEffect, useState } from 'react'
import { createFarmer, getFarmers, verifyFarmer } from '../../lib/api.js'

export default function Farmers() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [msg, setMsg] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const data = await getFarmers()
      const arr = Array.isArray(data) ? data : (data.items || [])
      setList(arr)
    } catch (e) { setMsg(e.message || 'Failed to fetch farmers') }
    finally { setLoading(false) }
  }

  useEffect(()=>{ load() }, [])

  const submit = async (e) => {
    e.preventDefault(); setMsg('')
    try {
      await createFarmer({ ...form, role: 'farmer' })
      setForm({ name: '', email: '', password: '' })
      await load()
      setMsg('Farmer created')
    } catch (e) { setMsg(e?.response?.data?.error || 'Create failed') }
  }

  const runVerify = async (id) => {
    setMsg(`Verifying ${id}…`)
    try {
      const r = await verifyFarmer(id)
      setMsg(`Verified: ${JSON.stringify(r)}`)
    } catch (e) { setMsg(e?.response?.data?.error || 'Verify failed') }
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="text-xl font-semibold mb-2">Add Farmer</h2>
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input className="input" placeholder="Name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required />
          <input className="input" placeholder="Email" type="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required />
          <input className="input" placeholder="Password" type="password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} required />
          <button className="btn btn-primary">Create</button>
        </form>
        {msg && <div className="text-xs text-gray-600 mt-2 break-all">{msg}</div>}
      </div>

      <div className="card">
        <div className="mb-3 font-medium">Farmers ({list.length})</div>
        <div className="overflow-auto border rounded-xl">
          <table className="table">
            <thead>
              <tr>
                <th className="th">Name</th>
                <th className="th">Email</th>
                <th className="th">ID</th>
                <th className="th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((f)=> (
                <tr key={f._id} className="border-t">
                  <td className="td">{f.name}</td>
                  <td className="td">{f.email}</td>
                  <td className="td font-mono text-xs">{f._id || f.farmerId}</td>
                  <td className="td">
                    <button className="btn btn-ghost text-sm" onClick={()=>runVerify(f._id || f.farmerId)}>Verify</button>
                  </td>
                </tr>
              ))}
              {!list.length && (
                <tr><td className="td" colSpan={4}>{loading?'Loading…':'No farmers'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
