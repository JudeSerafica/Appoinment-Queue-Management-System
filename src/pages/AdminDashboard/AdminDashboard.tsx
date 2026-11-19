import { Navigate, useNavigate, useParams } from 'react-router-dom'
import AdminSidebar from '../../components/AdminSidebar/AdminSidebar'
import AdminDashboardContent from '../../components/AdminDashboardContent/AdminDashboardContent'
import './AdminDashboard.css'

interface AdminDashboardProps {
  onLogout: () => void
}

export type AdminTab = 'dashboard' | 'services' | 'slots' | 'appointments' | 'reports'
const TABS: AdminTab[] = ['dashboard', 'services', 'slots', 'appointments', 'reports']

function getAdminName(): string {
  try { return JSON.parse(localStorage.getItem('user') || '{}').name ?? 'Admin' } catch { return 'Admin' }
}

function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const navigate = useNavigate()
  const { tab } = useParams()

  // Active tab lives in the URL so refresh and the Back button keep the page
  const activePage = (tab ?? 'dashboard') as AdminTab
  if (!TABS.includes(activePage)) return <Navigate to="/admin/dashboard" replace />

  const goTo = (page: AdminTab) =>
    navigate(page === 'dashboard' ? '/admin/dashboard' : `/admin/dashboard/${page}`)

  const handleLogout = () => {
    if (!window.confirm('Are you sure you want to log out?')) return
    onLogout()
    navigate('/admin')
  }

  return (
    <div className="admin-dashboard">
      <AdminSidebar
        activePage={activePage}
        onPageChange={goTo}
        onLogout={handleLogout}
        adminName={getAdminName()}
      />
      <AdminDashboardContent activePage={activePage} />
    </div>
  )
}

export default AdminDashboard
