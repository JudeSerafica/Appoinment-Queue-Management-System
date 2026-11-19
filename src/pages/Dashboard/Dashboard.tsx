import { Navigate, useNavigate, useParams } from 'react-router-dom'
import Sidebar from '../../components/Sidebar/Sidebar'
import DashboardContent from '../../components/DashboardContent/DashboardContent'
import './Dashboard.css'

interface DashboardProps {
  onLogout: () => void
  userFullName: string
  onNameChange: (name: string) => void
}

export type DashboardTab = 'dashboard' | 'services' | 'queue' | 'profile'
const TABS: DashboardTab[] = ['dashboard', 'services', 'queue', 'profile']

function Dashboard({ onLogout, userFullName, onNameChange }: DashboardProps) {
  const navigate = useNavigate()
  const { tab } = useParams()

  // The active tab comes from the URL, so refresh and the Back button keep working
  const activePage: DashboardTab = (tab ?? 'dashboard') as DashboardTab
  if (!TABS.includes(activePage)) return <Navigate to="/dashboard" replace />

  const goTo = (page: DashboardTab) =>
    navigate(page === 'dashboard' ? '/dashboard' : `/dashboard/${page}`)

  const handleLogout = () => {
    if (!window.confirm('Are you sure you want to log out?')) return
    onLogout()
    navigate('/')
  }

  return (
    <div className="dashboard">
      <Sidebar
        activePage={activePage}
        onPageChange={goTo}
        onLogout={handleLogout}
        userFullName={userFullName}
      />
      <DashboardContent
        activePage={activePage}
        userFullName={userFullName}
        onNavigate={goTo}
        onNameChange={onNameChange}
      />
    </div>
  )
}

export default Dashboard
