import { useState, useEffect } from 'react'
import { FaEye, FaEyeSlash } from 'react-icons/fa'
import './Profile.css'
import { getProfile, updateProfile, changePassword } from '../../api/routes'
import { useToast } from '../../contexts/ToastContext'

interface ProfileProps {
  onNameChange: (name: string) => void
}

const NAME_REGEX = /^[A-Za-z\s.'-]+$/
// Philippine mobile number: 09XXXXXXXXX or +639XXXXXXXXX (spaces/dashes allowed)
const PH_MOBILE_REGEX = /^(\+63|0)9\d{9}$/

function Profile({ onNameChange }: ProfileProps) {
  const { showToast } = useToast()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [editedName, setEditedName] = useState('')
  const [editedPhone, setEditedPhone] = useState('')
  const [savedPhone, setSavedPhone] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token') || ''
        const res = await getProfile(token)
        if (res.success) {
          setName(res.data.name)
          setEmail(res.data.email)
          setEditedName(res.data.name)
          setEditedPhone(res.data.phone || '')
          setSavedPhone(res.data.phone || '')
        } else {
          setError(res.message)
        }
      } catch {
        setError('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const hasChanges = editedName.trim() !== name || editedPhone.trim() !== savedPhone

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const trimmedName = editedName.trim()
    const cleanedPhone = editedPhone.replace(/[\s-]/g, '')

    if (!trimmedName) return setError('Name cannot be empty')
    if (!NAME_REGEX.test(trimmedName)) return setError('Name must contain letters only')
    if (cleanedPhone && !PH_MOBILE_REGEX.test(cleanedPhone)) {
      return setError('Enter a valid mobile number, e.g. 09171234567 or +639171234567')
    }

    setSaving(true)
    try {
      const token = localStorage.getItem('token') || ''
      const res = await updateProfile({ name: trimmedName, phone: cleanedPhone }, token)
      if (res.success) {
        setName(trimmedName)
        setEditedName(trimmedName)
        setEditedPhone(cleanedPhone)
        setSavedPhone(cleanedPhone)
        onNameChange(trimmedName)
        showToast('Profile updated', 'success')
      } else {
        setError(res.message || 'Update failed')
      }
    } catch {
      setError('Cannot connect to server')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    if (newPassword.length < 6) return setPasswordError('New password must be at least 6 characters long')
    if (newPassword !== confirmPassword) return setPasswordError('New passwords do not match')
    if (newPassword === currentPassword) return setPasswordError('New password must be different from the current one')

    setChangingPassword(true)
    try {
      const token = localStorage.getItem('token') || ''
      const res = await changePassword({ current_password: currentPassword, new_password: newPassword }, token)
      if (res.success) {
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        showToast('Password changed successfully', 'success')
      } else {
        setPasswordError(res.message || 'Failed to change password')
      }
    } catch {
      setPasswordError('Cannot connect to server')
    } finally {
      setChangingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-content">
          <div className="skeleton profile-skeleton" style={{ height: 140 }} />
          <div className="skeleton profile-skeleton" style={{ height: 360 }} />
        </div>
      </div>
    )
  }

  const passwordType = showPasswords ? 'text' : 'password'

  return (
    <div className="profile-page">
      <header className="profile-header">
        <h1>My Profile</h1>
        <p>View and update your account information</p>
      </header>
      <div className="profile-content stagger">
        <div className="profile-card">
          <div className="profile-info">
            <div className="avatar">{name.charAt(0).toUpperCase()}</div>
            <div className="profile-details">
              <h2>{name}</h2>
              <p className="email">{email}</p>
              <span className="role-badge">Patient Account</span>
            </div>
          </div>
        </div>

        <form className="edit-profile-section" onSubmit={handleSaveChanges} noValidate>
          <div className="edit-header"><h3>Edit Profile</h3></div>
          {error && <p className="form-error">{error}</p>}
          <div className="form-group">
            <label htmlFor="profile-name">Full Name</label>
            <input
              id="profile-name"
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              placeholder="Enter your full name"
            />
          </div>
          <div className="form-group">
            <label htmlFor="profile-phone">Mobile Number</label>
            <input
              id="profile-phone"
              type="tel"
              inputMode="tel"
              value={editedPhone}
              onChange={(e) => setEditedPhone(e.target.value)}
              placeholder="09171234567"
            />
            <p className="input-hint">Optional. Format: 09XXXXXXXXX or +639XXXXXXXXX</p>
          </div>
          <div className="form-group">
            <label htmlFor="profile-email">Email Address</label>
            <input id="profile-email" type="email" value={email} disabled />
            <p className="input-hint">Email cannot be changed</p>
          </div>
          <button type="submit" className="save-btn" disabled={saving || !hasChanges}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        <form className="edit-profile-section" onSubmit={handleChangePassword} noValidate>
          <div className="edit-header">
            <h3>Change Password</h3>
            <button
              type="button"
              className="toggle-visibility"
              onClick={() => setShowPasswords(v => !v)}
              aria-label={showPasswords ? 'Hide passwords' : 'Show passwords'}
            >
              {showPasswords ? <FaEyeSlash /> : <FaEye />} {showPasswords ? 'Hide' : 'Show'}
            </button>
          </div>
          {passwordError && <p className="form-error">{passwordError}</p>}
          <div className="form-group">
            <label htmlFor="current-password">Current Password</label>
            <input
              id="current-password"
              type={passwordType}
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="new-password">New Password</label>
            <input
              id="new-password"
              type={passwordType}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <p className="input-hint">At least 6 characters</p>
          </div>
          <div className="form-group">
            <label htmlFor="confirm-password">Confirm New Password</label>
            <input
              id="confirm-password"
              type={passwordType}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="save-btn"
            disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
          >
            {changingPassword ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Profile
