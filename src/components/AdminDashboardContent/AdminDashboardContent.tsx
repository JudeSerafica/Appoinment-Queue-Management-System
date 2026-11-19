import './AdminDashboardContent.css'
import AdminOverview from '../AdminOverview/AdminOverview'
import ManageServices from '../ManageServices/ManageServices'
import ManageSlots from '../ManageSlots/ManageSlots'
import ManageAppointments from '../ManageAppointments/ManageAppointments'
import ManageReports from '../ManageReports/ManageReports'
import type { AdminTab } from '../../pages/AdminDashboard/AdminDashboard'

interface AdminDashboardContentProps {
  activePage: AdminTab
}

const PAGES: Record<AdminTab, { title: string; subtitle: string; render: () => JSX.Element }> = {
  dashboard: { title: 'Admin Dashboard', subtitle: 'Overview of your queue management system', render: () => <AdminOverview /> },
  services: { title: 'Manage Services', subtitle: 'Create and manage your service offerings', render: () => <ManageServices /> },
  slots: { title: 'Manage Slots', subtitle: 'Create and manage time slots for services', render: () => <ManageSlots /> },
  appointments: { title: 'Appointments', subtitle: 'Monitor and manage all appointments', render: () => <ManageAppointments /> },
  reports: { title: 'Reports', subtitle: 'Wait time analytics & service demand insights', render: () => <ManageReports /> },
}

function AdminDashboardContent({ activePage }: AdminDashboardContentProps) {
  const page = PAGES[activePage]
  return (
    <div className="admin-content">
      {/* key replays the fade-in whenever the page changes */}
      <div key={activePage} className="page-enter">
        <header className="admin-header">
          <div>
            <h1>{page.title}</h1>
            <p>{page.subtitle}</p>
          </div>
        </header>
        <main className="admin-main">
          {page.render()}
        </main>
      </div>
    </div>
  )
}

export default AdminDashboardContent
