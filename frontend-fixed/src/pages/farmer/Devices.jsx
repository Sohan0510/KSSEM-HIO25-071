import React, { useEffect, useState } from "react";
import { addDevice, deleteDevice, getDevices } from "../../lib/api.js";
import { useAuth } from "../../state/AuthContext.jsx";

export default function Devices() {
  const { user } = useAuth();
  const farmerId = user?.farmerId || user?.id;
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ deviceId: "" });
  const [msg, setMsg] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await getDevices(farmerId);
      setList(Array.isArray(data) ? data : data.items || []);
    } catch (e) {
      setMsg(e.message || "Failed to fetch devices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (farmerId) load();
  }, [farmerId]);

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      await addDevice({ deviceId: form.deviceId, farmerId });
      setForm({ deviceId: "" });
      await load();
      setMsg("✅ Device added successfully");
    } catch (e) {
      setMsg(e?.response?.data?.error || "Add failed");
    }
  };

  const del = async (id) => {
    if (!confirm("Delete this device?")) return;
    try {
      await deleteDevice(id);
      await load();
    } catch (e) {
      setMsg(e?.response?.data?.error || "Delete failed");
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="card">
        <h2 className="text-xl font-semibold mb-2">Add Device</h2>
        <form onSubmit={submit} className="flex gap-3">
          <input
            className="input flex-1"
            placeholder="Device ID"
            value={form.deviceId}
            onChange={(e) => setForm({ deviceId: e.target.value })}
            required
          />
          <button className="btn btn-primary">Add</button>
        </form>
        {msg && <div className="text-xs text-gray-600 mt-2 break-all">{msg}</div>}
      </div>

      <div className="card">
        <div className="mb-3 font-medium text-gray-800">
          Your Devices ({list.length})
        </div>
        <div className="overflow-auto border rounded-xl">
          <table className="table">
            <thead>
              <tr>
                <th className="th">Device ID</th>
                <th className="th text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((d) => (
                <tr key={d._id} className="border-t hover:bg-gray-50">
                  <td className="td font-mono text-xs">{d.deviceId}</td>
                  <td className="td text-center">
                    <button
                      className="btn btn-ghost text-sm"
                      onClick={() => del(d._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {!list.length && (
                <tr>
                  <td colSpan={2} className="td text-center text-gray-500">
                    {loading ? "Loading…" : "No devices yet"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
