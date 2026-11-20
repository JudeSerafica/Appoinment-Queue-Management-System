import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { register } from '../../api/routes'
import { passwordProblem, PASSWORD_HINT } from '../../utils/password'
import './Signup.css'

function Signup() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // ── Validation rules ──────────────────────────────
  const NAME_REGEX = /^[A-Za-z\s.'-]+$/ // letters, spaces, . ' - only

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const trimmedName = name.trim()

    // 1. Name must not contain numbers or symbols
    if (!NAME_REGEX.test(trimmedName)) {
      setError('Name must contain letters only (no numbers or special characters)')
      return
    }

    // 2. Password strength check (8+ characters, a letter and a number)
    const problem = passwordProblem(password)
    if (problem) {
      setError(problem)
      return
    }

    // 3. Confirm password match
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const registration = await register({ name: trimmedName, email, password })
      if (!registration.success) {
        setError(registration.message)
        return
      }

      // Huwag i-auto login: kailangan munang mag-login ng user
      navigate('/login', {
        replace: true,
        state: { message: 'Account created successfully. Please log in to continue.', email },
      })
    } catch (err) {
      setError('Cannot connect to server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="signup-container">
      <div className="signup-sidebar">
        <h1 className="sidebar-logo">AQMS</h1>
        <div className="sidebar-quote">
          <p className="quote-line">"Start your journey</p>
          <p className="quote-line">to smarter care."</p>
          <img src="/AQMS.logo.png" alt="AQMS Logo" />
        </div>
      </div>
      <div className="signup-form-section">
        <div className="signup-form-container">
          <h2>Sign Up</h2>
          {error && <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>}
          <form onSubmit={handleSignup}>
            <div className="form-group">
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                pattern="[A-Za-z\s.'\-]+"
                title="Name must contain letters only"
                required
              />
            </div>
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
                placeholder="Password (min. 8, letter + number)"
                title={PASSWORD_HINT}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            <button type="submit" className="signup-btn" disabled={loading}>
              {loading ? 'Signing up...' : 'Sign Up'}
            </button>
          </form>
          <p className="login-text">Already have an account? <span className="login-link" onClick={() => navigate('/login')}>Login</span>.</p>
        </div>
      </div>
    </div>
  )
}

export default Signup