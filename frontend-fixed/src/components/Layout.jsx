import React from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../state/AuthContext.jsx'
import { LogOut, Users2, ServerCog, Boxes } from 'lucide-react'

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const isAdmin = user?.role === 'admin'

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-[260px_1fr]">
      <aside className="hidden md:block border-r bg-white">
        <div className="p-4 flex items-center gap-3 border-b">
          <div className="h-8 w-8 rounded-xl bg-indigo-600" />
          <div>
            <div className="font-semibold">Agri Portal</div>
            <div className="text-xs text-gray-500">{user?.role?.toUpperCase()}</div>
          </div>
        </div>
        <nav className="p-3 space-y-1">
          {isAdmin ? (
            <NavLink to="/admin" className={({isActive})=>`block px-3 py-2 rounded-lg ${isActive?'bg-indigo-50 text-indigo-700':'hover:bg-gray-50'}`}>
              <Users2 className="inline mr-2 h-4 w-4"/> Dashboard
            </NavLink>
          ) : (
            <>
              <NavLink to="/farmer" className={({isActive})=>`block px-3 py-2 rounded-lg ${isActive?'bg-indigo-50 text-indigo-700':'hover:bg-gray-50'}`}>
                <Boxes className="inline mr-2 h-4 w-4"/> Dashboard
              </NavLink>
              <NavLink to="/farmer/devices" className={({isActive})=>`block px-3 py-2 rounded-lg ${isActive?'bg-indigo-50 text-indigo-700':'hover:bg-gray-50'}`}>
                <ServerCog className="inline mr-2 h-4 w-4"/> Devices
              </NavLink>
            </>
          )}
        </nav>
        <div className="p-3 mt-auto">
          <button onClick={logout} className="btn btn-ghost w-full">
            <LogOut className="h-4 w-4 mr-2"/> Logout
          </button>
        </div>
      </aside>
      <main className="min-h-screen">
        <header className="bg-white border-b p-3 md:hidden flex items-center justify-between">
          <Link to="/" className="font-semibold">Agri Portal</Link>
          <button onClick={logout} className="btn btn-ghost text-sm">Logout</button>
        </header>
        <div className="mx-auto max-w-6xl p-4 space-y-6">
          {children}
        </div>
      </main>
    </div>
  )
}
