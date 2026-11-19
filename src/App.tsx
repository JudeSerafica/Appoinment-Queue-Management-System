import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing/Landing'
import Login from './pages/Login/Login'
import Dashboard from './pages/Dashboard/Dashboard'
import AdminLogin from './pages/AdminLogin/AdminLogin'
import AdminDashboard from './pages/AdminDashboard/AdminDashboard'
import Signup from './pages/Signup/Signup'
import './App.css'

// Read initial state from localStorage so refresh doesn't log you out
function getStoredUser() {
  try { return JSON.parse(localStorage.getItem('user') || '{}') } catch { return {} }
}

// Landing page that signs out any saved session when it opens
function SignedOutLanding({ onEnter }: { onEnter: () => void }) {
  useEffect(() => { onEnter() }, [])
  return <Landing />
}

function App() {
  const storedUser = getStoredUser()

  const [isUserLoggedIn, setIsUserLoggedIn] = useState(
    !!localStorage.getItem('token') && storedUser.role === 'user'
  )
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(
    !!localStorage.getItem('token') && storedUser.role === 'admin'
  )
  const [userFullName, setUserFullName] = useState(
    storedUser.name || ''
  )

  const handleUserLogin = (email: string, fullName?: string) => {
    setIsAdminLoggedIn(false)   // a new user login replaces any admin session
    setIsUserLoggedIn(true)
    setUserFullName(fullName || email.split('@')[0])
  }

  const handleUserLogout = () => {
    setIsUserLoggedIn(false)
    setUserFullName('')
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  // Keep the greeting and stored user in sync after a profile name change
  const handleNameChange = (name: string) => {
    setUserFullName(name)
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      localStorage.setItem('user', JSON.stringify({ ...user, name }))
    } catch { /* ignore broken storage */ }
  }

  const handleAdminLogin = (_email: string) => {
    setIsAdminLoggedIn(true)
  }

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('isAdminLoggedIn')
  }

  // Clear any saved user or admin session (used when the landing page opens)
  const handleSignOutAll = () => {
    if (isUserLoggedIn) handleUserLogout()
    if (isAdminLoggedIn) handleAdminLogout()
  }

  return (
    <Router>
      <Routes>
        {/* User Routes */}
        {/* Opening the system always starts at the landing page, signed out:
            users must sign in again every time */}
        <Route path="/" element={<SignedOutLanding onEnter={handleSignOutAll} />} />
        <Route path="/login" element={<Login onLogin={handleUserLogin} />} />
        <Route path="/signup" element={<Signup />} />
        {/* Each user tab has its own URL: /dashboard, /dashboard/services, /dashboard/queue, /dashboard/profile */}
        <Route path="/dashboard/:tab?" element={isUserLoggedIn ? <Dashboard onLogout={handleUserLogout} userFullName={userFullName} onNameChange={handleNameChange} /> : <Navigate to="/login" replace />} />
        <Route path="/services" element={<Navigate to="/dashboard/services" replace />} />

        {/* Admin Routes */}
        <Route path="/admin" element={!isAdminLoggedIn ? <AdminLogin onLogin={handleAdminLogin} /> : <Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard/:tab?" element={isAdminLoggedIn ? <AdminDashboard onLogout={handleAdminLogout} /> : <Navigate to="/admin" replace />} />

        {/* Unknown URLs go back to the start */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App