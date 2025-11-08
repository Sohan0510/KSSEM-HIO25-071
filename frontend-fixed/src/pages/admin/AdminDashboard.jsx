import React, { useState, useEffect } from "react";
import { verifyAllFarmers, getFarmersDashboard, verifyFarmer } from "../../lib/api.js";

export default function AdminDashboard() {
  const [msg, setMsg] = useState("");
  const [verifying, setVerifying] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [farmers, setFarmers] = useState([]);

  const loadFarmers = async () => {
    try {
      const res = await getFarmersDashboard();
      setFarmers(res?.farmers || []);
    } catch (err) {
      console.error('Failed to load farmers:', err);
      setMsg("⚠️ Failed to load farmers list");
    }
  };

  useEffect(() => {
    loadFarmers();
  }, []);

  const handleVerify = async (farmerId) => {
    setVerifying(farmerId);
    setMsg(`🔄 Verifying farmer ${farmerId}...`);
    setLastResult(null);
    try {
      const result = await verifyFarmer(farmerId);
      const tamperedCount = result.result?.filter(r => r.action.includes('tampered')).length || 0;
      const verifiedCount = result.result?.filter(r => r.action === 'purged').length || 0;

      // Set the result with farmerId
      setMsg("");
      setLastResult({ ...result, farmerId }); // Include farmerId in the result
      await loadFarmers(); // Refresh farmer list to update status
    } catch (err) {
      console.error('Verification error:', err);
      setMsg(`❌ Verification failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setVerifying(null);
    }
  };

  const handleVerifyAll = async () => {
    setVerifying('all');
    setMsg("🔄 Running verification for all farmers...");
    setLastResult(null);
    try {
      const result = await verifyAllFarmers();
      
      let totalTampered = 0;
      let totalVerified = 0;
      let farmersWithTamper = 0;
      
      result.reports?.forEach(report => {
        const tamperedCount = report.result?.filter(r => r.action.includes('tampered')).length || 0;
        const verifiedCount = report.result?.filter(r => r.action === 'purged').length || 0;
        
        if (tamperedCount > 0) farmersWithTamper++;
        totalTampered += tamperedCount;
        totalVerified += verifiedCount;
      });

      // Set the result without showing message
      setMsg("");
      setLastResult(result);
      await loadFarmers(); // Refresh farmer list to update statuses
      
    } catch (err) {
      console.error('Verify all error:', err);
      setMsg(`❌ Bulk verification failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setVerifying(null);
    }
  };

  const renderVerificationSummary = () => {
    if (!lastResult) return null;
    const { result = [], farmerId, window } = lastResult;

    const tampered = result.filter((r) => r.action?.includes("tampered")).length;
    const pending = result.filter((r) => r.action?.includes("pending")).length;
    const verified = result.length - tampered - pending;

    return (
      <div className="card text-sm fade-in">
        <h3 className="font-semibold text-gray-800 mb-2">Verification Summary</h3>
        {lastResult.farmerId && (
          <p className="text-gray-600">Farmer ID: <span className="font-mono">{lastResult.farmerId}</span></p>
        )}
        {window && <p className="text-gray-600">Window: {window[0]} → {window[window.length - 1]}</p>}
        <div className="flex gap-5 mt-2">
          <span>✅ Verified: {verified}</span>
          <span>⚠️ Pending: {pending}</span>
          <span>❌ Tampered: {tampered}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold">Admin Data Verification Panel</h2>
            <p className="text-gray-500 text-sm">Verify and check data integrity for all farmers</p>
          </div>
          <button 
            onClick={handleVerifyAll} 
            className="btn btn-primary px-6 py-2"
            disabled={verifying !== null}
          >
            {verifying ? "Verification in Progress..." : "Verify All Data"}
          </button>
        </div>

        <div className="overflow-auto border rounded-xl">
          <table className="table">
            <thead>
              <tr>
                <th className="th">Farmer Name</th>
                <th className="th">Trust Score</th>
                <th className="th">Tamper Status</th>
                <th className="th text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {farmers.map((f) => (
                <tr key={f._id} className={`border-t hover:bg-gray-50 ${f.tamperedCount > 0 ? 'bg-red-50' : ''}`}>
                  <td className="td">
                    <div>{f.name}</div>
                    <div className="text-xs text-gray-500">{f.email}</div>
                  </td>
                  <td className="td">
                    <span className={`font-semibold ${f.trustScore >= 0.9 ? 'text-green-600' : f.trustScore >= 0.7 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {(f.trustScore * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className="td">
                    {f.tamperedCount > 0 ? (
                      <div className="text-xs">
                        <span className="text-red-600 font-medium">⚠️ {f.tamperedCount} tampering incidents</span>
                        <br />
                        <span className="text-gray-500">Last: {f.lastTamperDate}</span>
                      </div>
                    ) : (
                      <span className="text-green-600 text-xs">✅ No tampering detected</span>
                    )}
                  </td>
                  <td className="td text-center">
                    <button
                      onClick={() => handleVerify(f._id)}
                      className={`btn ${verifying === f._id ? 'btn-ghost' : 'btn-primary'} text-sm`}
                      disabled={verifying !== null}
                    >
                      {verifying === f._id ? "Verifying..." : "Verify"}
                    </button>
                  </td>
                </tr>
              ))}
              {!farmers.length && (
                <tr>
                  <td colSpan={4} className="td text-center text-gray-500">
                    No farmers found in the system
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {lastResult && (
        <div className="card">
          <h3 className="text-xl font-semibold mb-4">Verification Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-gray-50">
              <div className="text-2xl font-bold text-gray-700">
                {lastResult.reports?.length || lastResult.result?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Items Processed</div>
            </div>
            
            <div className="p-4 rounded-lg bg-green-50">
              <div className="text-2xl font-bold text-green-700">
                {lastResult.reports 
                  ? lastResult.reports.reduce((acc, r) => acc + (r.result?.filter(x => x.action === 'purged').length || 0), 0)
                  : (lastResult.result?.filter(x => x.action === 'purged').length || 0)}
              </div>
              <div className="text-sm text-green-600">Days Verified Clean</div>
            </div>
            
            <div className="p-4 rounded-lg bg-red-50">
              <div className="text-2xl font-bold text-red-700">
                {lastResult.reports 
                  ? lastResult.reports.reduce((acc, r) => acc + (r.result?.filter(x => x.action.includes('tampered')).length || 0), 0)
                  : (lastResult.result?.filter(x => x.action.includes('tampered')).length || 0)}
              </div>
              <div className="text-sm text-red-600">Tampering Incidents</div>
            </div>
          </div>
        </div>
      )}

      {msg && <div className="text-sm text-gray-700">{msg}</div>}
      {renderVerificationSummary()}
    </div>
  );
}
