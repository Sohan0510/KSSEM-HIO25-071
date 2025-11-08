import axios from 'axios'
import { getToken } from '../state/AuthContext.jsx'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5050',
  timeout: 20000
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auth
export const login = async (body) => {
  const r = await api.post('/api/auth/login', body)
  // backend returns { token, user: { id, name, email, role } }
  const data = r.data || {}
  if (!data.token || !data.user) {
    console.error('API: Invalid login response', data)
    throw new Error('Invalid server response')
  }
  const id = data.user.id || data.user._id;
  const role = String(data.user.role || '').toLowerCase();
  return { token: data.token, id, name: data.user.name, email: data.user.email, role }
}

export const register = async (body) => {
  const r = await api.post('/api/auth/register', body)
  const data = r.data || {}
  if (data.user) return { token: data.token, ...data.user }
  return data
}

// Admin: Farmers
export const getFarmers = () => api.get('/api/admin/farmers').then(r => r.data)
export const createFarmer = (body) => api.post('/api/admin/farmers', body).then(r => r.data)
export const verifyFarmer = async (farmerId) => {
  try {
    const res = await api.post(`/api/admin/verify/${farmerId}`)
    return res.data?.report || res.data
  } catch (err) {
    console.error('Verify farmer error:', err.response?.data || err)
    throw err
  }
}
export const verifyAllFarmers = async () => {
  try {
    const res = await api.post('/api/admin/verify-all')
    return res.data?.result || res.data
  } catch (err) {
    console.error('Verify all error:', err.response?.data || err)
    throw err
  }
}
export const getFarmersDashboard = () => api.get('/api/dashboard/farmers').then(r => r.data)

// Farmer: Devices
export const getDevices = (farmerId) =>
  api.get('/api/devices', { params: { farmerId } }).then(r => r.data.devices || []);

export const addDevice = (device) => api.post('/api/devices', device).then(r => r.data);

export const deleteDevice = (id) => api.delete(`/api/devices/${id}`).then(r => r.data);

// Farmer: Dashboard
export const getDashboard = () => api.get('/api/dashboard/me').then(r => r.data);

export default api
