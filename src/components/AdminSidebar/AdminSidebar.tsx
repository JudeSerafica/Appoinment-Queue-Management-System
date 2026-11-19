import './AdminSidebar.css'
import { MdDashboard, MdEvent } from "react-icons/md";
import { IoSettingsSharp } from "react-icons/io5";
import { FaClock, FaChartBar, FaSignOutAlt } from "react-icons/fa";
import type { AdminTab } from '../../pages/AdminDashboard/AdminDashboard'

interface AdminSidebarProps {
  activePage: AdminTab
  onPageChange: (page: AdminTab) => void
  onLogout: () => void
  adminName: string
}

const NAV_ITEMS: { page: AdminTab; label: string; short: string; icon: JSX.Element }[] = [
  { page: 'dashboard', label: 'Admin Dashboard', short: 'Home', icon: <MdDashboard className="nav-icon" /> },
  { page: 'services', label: 'Manage Services', short: 'Services', icon: <IoSettingsSharp className="nav-icon" /> },
  { page: 'slots', label: 'Manage Slots', short: 'Slots', icon: <FaClock className="nav-icon" /> },
  { page: 'appointments', label: 'Appointments', short: 'Appts', icon: <MdEvent className="nav-icon" /> },
  { page: 'reports', label: 'Reports', short: 'Reports', icon: <FaChartBar className="nav-icon" /> },
]

function AdminSidebar({ activePage, onPageChange, onLogout, adminName }: AdminSidebarProps) {
  return (
    <div className="admin-sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-title">AQMS</h1>
        <p className="admin-badge">Admin</p>
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
            <span className="nav-label">{item.label}</span>
            <span className="nav-label-short">{item.short}</span>
          </button>
        ))}
      </nav>

      <div className="admin-sidebar-footer">
        <div className="admin-user">
          <div className="admin-avatar">{adminName.charAt(0).toUpperCase()}</div>
          <span className="admin-user-name">{adminName}</span>
        </div>
        <button className="nav-item logout-item" onClick={onLogout}>
          <FaSignOutAlt className="nav-icon" />
          <span className="nav-label">Logout</span>
          <span className="nav-label-short">Logout</span>
        </button>
      </div>
    </div>
  )
}

export default AdminSidebar
