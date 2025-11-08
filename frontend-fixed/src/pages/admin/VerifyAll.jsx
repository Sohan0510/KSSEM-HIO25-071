import React, { useState } from 'react'
import { verifyAllFarmers } from '../../lib/api.js'

export default function VerifyAll() {
  const [out, setOut] = useState('')
  const [loading, setLoading] = useState(false)

  const run = async () => {
    setLoading(true); setOut('Running verify-all…')
    try {
      const r = await verifyAllFarmers()
      setOut(JSON.stringify(r, null, 2))
    } catch (e) { setOut(e?.response?.data?.error || 'Verify-all failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold">Verify All Farmers</h2>
        <button className="btn btn-primary" onClick={run} disabled={loading}>{loading?'Working…':'Run Now'}</button>
      </div>
      <pre className="text-xs bg-gray-50 p-3 rounded-xl overflow-auto min-h-[180px]">{out}</pre>
    </div>
  )
}
