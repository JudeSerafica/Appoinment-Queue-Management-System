import { FaHome, FaCalendar, FaSignOutAlt } from "react-icons/fa"
import { FaList } from "react-icons/fa6"
import { CgProfile } from "react-icons/cg"
import type { DashboardTab } from '../../pages/Dashboard/Dashboard'
import './Sidebar.css'

interface SidebarProps {
  activePage: DashboardTab
  onPageChange: (page: DashboardTab) => void
  onLogout: () => void
  userFullName: string
}

const NAV_ITEMS: { page: DashboardTab; label: string; icon: JSX.Element }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: <FaHome className="nav-icon" /> },
  { page: 'services', label: 'Services', icon: <FaCalendar className="nav-icon" /> },
  { page: 'queue', label: 'My Queue', icon: <FaList className="nav-icon" /> },
  { page: 'profile', label: 'My Profile', icon: <CgProfile className="nav-icon" /> },
]

function Sidebar({ activePage, onPageChange, onLogout, userFullName }: SidebarProps) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-title">AQMS</h1>
      </div>
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(item => (
          <button
            key={item.page}
            className={`nav-item ${activePage === item.page ? 'active' : ''}`}
            onClick={() => onPageChange(item.page)}
            aria-current={activePage === item.page ? 'page' : undefined}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{(userFullName || '?').charAt(0).toUpperCase()}</div>
          <span className="sidebar-user-name">{userFullName}</span>
        </div>
        <button className="nav-item logout-item" onClick={onLogout}>
          <FaSignOutAlt className="nav-icon" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )
}

export default Sidebar
