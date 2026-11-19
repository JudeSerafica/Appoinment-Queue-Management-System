import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { login } from '../../api/routes'
import './Login.css'

interface LoginProps {
  onLogin: (email: string, fullName?: string) => void
}

interface LoginLocationState {
  message?: string
  email?: string
}

function Login({ onLogin }: LoginProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const signupState = (location.state ?? {}) as LoginLocationState
  // Set by the API layer when a saved login has expired
  const [sessionExpired] = useState(() => {
    try {
      const flag = sessionStorage.getItem('sessionExpired') === '1'
      sessionStorage.removeItem('sessionExpired')
      return flag
    } catch { return false }
  })
  const successMessage = signupState.message
    ?? (sessionExpired ? 'Your session has expired. Please log in again.' : '')
  const [email, setEmail] = useState(signupState.email ?? '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')        // show errors to user
  const [loading, setLoading] = useState(false) // prevent double submit

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await login({ email, password })

      if (res.success) {
        const userData = res.data.user  // ← same fix

        if (userData.role === 'admin') {
          setError('Please use the Admin Panel to login as admin.')
          return
        }

        localStorage.setItem('token', res.data.token)
        localStorage.setItem('user', JSON.stringify({
          id: userData.id,
          name: userData.name,
          role: userData.role,
        }))
        onLogin(email, userData.name)
        navigate('/dashboard')
      }else {
        setError(res.message || 'Login failed')
      }
    } catch (err) {
      setError('Cannot connect to server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-sidebar">
        <h1 className="sidebar-logo">AQMS</h1>
        <div className="sidebar-quote">
          <p className="quote-line">"Smart queues.</p>
          <p className="quote-line">Seamless care."</p>
          <img src="/AQMS.logo.png" alt="AQMS Logo" />
        </div>
      </div>
      
      <div className="login-form-section">
        <div className="login-form-container">
          <h2>Sign In</h2>

          {/* show error message */}
          {successMessage && !error && <p style={{ color: 'green', marginBottom: '10px' }}>{successMessage}</p>}
          {error && <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="signup-text">Don't have an account? <span className="signup-link" onClick={() => navigate('/signup')}>Sign Up</span>.</p>
          <p className="admin-link-text">Are you an admin? <a href="/admin" className="admin-link">Go to Admin Panel</a></p>
        </div>
      </div>
    </div>
  )
}

export default Login