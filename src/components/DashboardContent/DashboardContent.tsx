import { useEffect, useState } from 'react'
import AppointmentOverview from '../AppointmentOverview/AppointmentOverview'
import UpcomingAppointments from '../UpcomingAppointments/UpcomingAppointments'
import Services from '../../pages/Services/Services'
import MyQueue from '../../pages/MyQueue/MyQueue'
import Profile from '../../pages/Profile/Profile'
import { useAppointments, isActiveAppointment } from '../../contexts/AppointmentsContext'
import type { DashboardTab } from '../../pages/Dashboard/Dashboard'
import './DashboardContent.css'

interface DashboardContentProps {
  activePage: DashboardTab
  userFullName: string
  onNavigate: (page: DashboardTab) => void
  onNameChange: (name: string) => void
}

// Sort by date then time, soonest first
const bySchedule = (a: { date: string; time: string }, b: { date: string; time: string }) =>
  `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function DashboardContent({ activePage, userFullName, onNavigate, onNameChange }: DashboardContentProps) {
  const { appointments, loading, fetchUserAppointments } = useAppointments()
  const [loadedOnce, setLoadedOnce] = useState(false)

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (user?.id) {
      // Only show the skeleton on the first load; later tab changes refresh quietly
      fetchUserAppointments(String(user.id), { silent: loadedOnce })
        .finally(() => setLoadedOnce(true))
    }
  }, [activePage])

  const active = appointments.filter(isActiveAppointment).sort(bySchedule)
  const completedCount = appointments.filter(a => a.status === 'Completed').length
  const next = active[0]

  return (
    <div className="dashboard-content">
      {/* key={activePage} replays the fade-in each time the tab changes */}
      <div key={activePage} className="page-enter dashboard-tab">
        {activePage === 'dashboard' && (
          <>
            <header className="content-header">
              <div>
                <h1>{greeting()}, {userFullName}</h1>
                <p>Here's your appointment overview</p>
              </div>
              <button className="header-book-btn" onClick={() => onNavigate('services')}>
                + Book Appointment
              </button>
            </header>
            <main className="dashboard-main">
              {loading && !loadedOnce ? (
                <div className="dashboard-skeleton">
                  <div className="skeleton-row">
                    <div className="skeleton" style={{ height: 110 }} />
                    <div className="skeleton" style={{ height: 110 }} />
                    <div className="skeleton" style={{ height: 110 }} />
                  </div>
                  <div className="skeleton" style={{ height: 220 }} />
                </div>
              ) : (
                <>
                  <AppointmentOverview
                    upcoming={active.length}
                    completed={completedCount}
                    queuePosition={next ? `#${next.queueNumber}` : '-'}
                    onViewQueue={() => onNavigate('queue')}
                  />
                  <UpcomingAppointments
                    appointments={active}
                    onBookNew={() => onNavigate('services')}
                    onViewQueue={() => onNavigate('queue')}
                  />
                </>
              )}
            </main>
          </>
        )}
        {activePage === 'services' && <Services onTrackQueue={() => onNavigate('queue')} />}
        {activePage === 'queue' && <MyQueue onBookNew={() => onNavigate('services')} />}
        {activePage === 'profile' && <Profile onNameChange={onNameChange} />}
      </div>
    </div>
  )
}

export default DashboardContent
