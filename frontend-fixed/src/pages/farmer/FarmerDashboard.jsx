import React, { useEffect, useState } from "react";
import { useAuth } from "../../state/AuthContext.jsx";
import { getDashboard } from "../../lib/api.js";

export default function FarmerDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const dashData = await getDashboard();
        setData(dashData);
      } catch (err) {
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "clean_purged": return "text-green-600";
      case "kept_tampered": return "text-yellow-600";
      case "pending_anchor": return "text-blue-600";
      case "global_tamper": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="card">
        <h2 className="text-xl font-semibold">Welcome, {user?.name || "Farmer"}</h2>
        <p className="text-sm text-gray-500">
          View your trust score and data integrity insights.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-6 text-gray-500 animate-pulse">
          Loading dashboard data...
        </div>
      ) : error ? (
        <div className="card bg-red-50 text-red-600">{error}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`card ${data?.trustScore < 0.7 ? 'border-2 border-red-200' : ''}`}>
              <h3 className="text-lg font-medium text-gray-800">Trust Score</h3>
              <div className="mt-2">
                <span className={`text-4xl font-bold ${data?.trustScore >= 0.9 ? 'text-green-600' : data?.trustScore >= 0.7 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {(data?.trustScore * 100).toFixed(1)}%
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Your trust score is based on your historical data integrity.
              </p>
            </div>

            <div className="card">
              <h3 className="text-lg font-medium text-gray-800">Tamper Status</h3>
              <div className="mt-2">
                {(() => {
                  const tamperedRecords = data?.records?.filter(r => ['kept_tampered', 'global_tamper'].includes(r.status)) || [];
                  return tamperedRecords.length > 0 ? (
                    <div>
                      <span className="text-2xl font-bold text-red-600">⚠️ {tamperedRecords.length}</span>
                      <p className="text-sm text-red-600 mt-1">Tampering incidents detected</p>
                    </div>
                  ) : (
                    <div>
                      <span className="text-2xl font-bold text-green-600">✅</span>
                      <p className="text-sm text-green-600 mt-1">No tampering detected</p>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-medium text-gray-800">Latest Status</h3>
              <div className="mt-2">
                {(() => {
                  const latest = data?.records?.[0];
                  if (!latest) return <p className="text-sm text-gray-500">No data available</p>;
                  
                  return (
                    <div>
                      <span className={`text-xl font-bold ${getStatusColor(latest.status)}`}>
                        {latest.status.replace(/_/g, " ")}
                      </span>
                      <p className="text-sm text-gray-600 mt-1">
                        Last updated: {latest.dayKey}
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-medium mb-4 text-gray-800">
              Data Integrity History
            </h3>
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="th">Date</th>
                    <th className="th">Status</th>
                    <th className="th">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.records?.map((record) => (
                    <tr key={record.dayKey} 
                        className={`border-t hover:bg-gray-50 ${
                          ['kept_tampered', 'global_tamper'].includes(record.status) 
                            ? 'bg-red-50/50 border-l-4 border-l-red-500' 
                            : ''
                        }`}>
                      <td className="td">{record.dayKey}</td>
                      <td className={`td font-medium ${getStatusColor(record.status)}`}>
                        {record.status === 'kept_tampered' ? '⚠️ ' : record.status === 'global_tamper' ? '❌ ' : ''}
                        {record.status.replace(/_/g, " ")}
                      </td>
                      <td className="td text-gray-600">
                        {record.details ? (
                          <div className="text-xs text-gray-600">
                            {record.details.reason === 'payload_leaf_mismatch' && (
                              <>
                                <div className="font-medium text-red-600">Data integrity issue detected</div>
                                <div className="mt-1">Reading ID: <span className="font-mono">{record.details.readingId}</span></div>
                              </>
                            )}
                            {record.details.computedRoot && (
                              <>
                                <div className="font-medium text-red-600">Global tamper detected</div>
                                <div className="mt-1">
                                  <div>Expected: <span className="font-mono text-[10px]">{record.details.anchorRoot}</span></div>
                                  <div>Computed: <span className="font-mono text-[10px]">{record.details.computedRoot}</span></div>
                                </div>
                              </>
                            )}
                          </div>
                        ) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
