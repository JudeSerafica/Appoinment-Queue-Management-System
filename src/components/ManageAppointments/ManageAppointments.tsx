import { useState, useEffect, useMemo } from 'react'
import { FiSearch, FiRefreshCw, FiCheckCircle, FiPlayCircle, FiTrash2, FiArchive } from 'react-icons/fi'
import {
  useAppointments, Appointment, AppointmentStatus, ActionResult, isMissed,
} from '../../contexts/AppointmentsContext'
import { useToast } from '../../contexts/ToastContext'
import { formatDisplayDate, formatDisplayTime, toLocalDateString } from '../../utils/date'
import './ManageAppointments.css'

type DateFilter = 'all' | 'today' | 'upcoming' | 'past'

const AUTO_REFRESH_MS = 30000 // pick up new bookings/cancellations every 30 seconds

// Date, then time, then queue number (oldest first)
const bySchedule = (a: Appointment, b: Appointment) =>
  `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`) || a.queueNumber - b.queueNumber

function ManageAppointments() {
  const {
    appointments, archivedAppointments, loading,
    fetchAdminAppointments, fetchArchivedAppointments,
    confirmAppointment, startAppointment, completeAppointment,
    deleteAppointment,
  } = useAppointments()
  const { showToast } = useToast()

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'All'>('All')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [tab, setTab] = useState<'active' | 'archived'>('active')
  const [busyId, setBusyId] = useState<number | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchAdminAppointments()
    fetchArchivedAppointments({ silent: true })
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchAdminAppointments({ silent: true })
        fetchArchivedAppointments({ silent: true })
      }
    }, AUTO_REFRESH_MS)
    return () => clearInterval(timer)
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([
      fetchAdminAppointments({ silent: true }),
      fetchArchivedAppointments({ silent: true }),
    ])
    setRefreshing(false)
    showToast('Appointments refreshed', 'info')
  }

  const today = toLocalDateString(new Date())

  const matchesSearch = (a: Appointment) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return a.userName.toLowerCase().includes(q) ||
      a.queueNumber.toString().includes(q) ||
      a.service.toLowerCase().includes(q)
  }

  const matchesDate = (a: Appointment) =>
    dateFilter === 'all' ||
    (dateFilter === 'today' && a.date === today) ||
    (dateFilter === 'upcoming' && a.date >= today) ||
    (dateFilter === 'past' && a.date < today)

  const visibleActive = useMemo(() => appointments
    .filter(a => statusFilter === 'All' || a.status === statusFilter)
    .filter(matchesDate)
    .filter(matchesSearch)
    .sort(bySchedule), [appointments, statusFilter, dateFilter, searchQuery, today])

  const visibleArchived = useMemo(() => archivedAppointments
    .filter(matchesDate)
    .filter(matchesSearch)
    .sort(bySchedule)
    .reverse(), [archivedAppointments, dateFilter, searchQuery, today])

  const rows = tab === 'active' ? visibleActive : visibleArchived

  // Run a status action, show the result as a toast
  const runAction = async (
    appointment: Appointment,
    action: (id: number) => Promise<ActionResult>,
    successText: string,
  ) => {
    setBusyId(appointment.id)
    const res = await action(appointment.id)
    setBusyId(null)
    if (res.success) showToast(successText, 'success')
    else showToast(res.message || 'Action failed. Please try again.', 'error')
  }

  // Only one person should be "Serving" per service per day; warn before starting another
  const handleStart = (appointment: Appointment) => {
    const alreadyServing = appointments.find(a =>
      a.id !== appointment.id && a.status === 'Serving' &&
      a.service === appointment.service && a.date === appointment.date)
    if (alreadyServing && !window.confirm(
      `#${alreadyServing.queueNumber} (${alreadyServing.userName}) is still being served for ${appointment.service}. ` +
      `Start #${appointment.queueNumber} anyway?`)) return
    runAction(appointment, startAppointment, `Now serving #${appointment.queueNumber}`)
  }

  const handleArchive = (appointment: Appointment) => {
    if (!window.confirm(`Archive appointment #${appointment.queueNumber} (${appointment.userName})?`)) return
    runAction(appointment, deleteAppointment, 'Appointment archived')
  }

  const getStatusBadgeClass = (status: AppointmentStatus) => {
    const map: Record<AppointmentStatus, string> = {
      Pending: 'pending', Confirmed: 'confirmed', Serving: 'serving',
      Completed: 'completed', Cancelled: 'cancelled',
    }
    return `status-badge ${map[status] || ''}`
  }

  const getActionButtons = (appointment: Appointment) => {
    const busy = busyId === appointment.id
    const buttons = []

    switch (appointment.status) {
      case 'Pending':
        buttons.push(
          <button key="confirm" className="action-btn confirm" disabled={busy}
            onClick={() => runAction(appointment, confirmAppointment, `Confirmed #${appointment.queueNumber}`)}>
            <FiCheckCircle className="action-icon" /> Confirm
          </button>
        )
        break
      case 'Confirmed':
        buttons.push(
          <button key="start" className="action-btn start" disabled={busy} onClick={() => handleStart(appointment)}>
            <FiPlayCircle className="action-icon" /> Start
          </button>
        )
        break
      case 'Serving':
        buttons.push(
          <button key="complete" className="action-btn complete" disabled={busy}
            onClick={() => runAction(appointment, completeAppointment, `Completed #${appointment.queueNumber}`)}>
            <FiCheckCircle className="action-icon" /> Complete
          </button>
        )
        break
    }

    buttons.push(
      <button key="delete" className="action-btn delete" title="Archive appointment" disabled={busy}
        onClick={() => handleArchive(appointment)}>
        <FiTrash2 className="action-icon" />
      </button>
    )

    return <div className="actions-cell">{buttons}</div>
  }

  // Quick counts for the active list
  const counts = useMemo(() => ({
    today: appointments.filter(a => a.date === today && a.status !== 'Cancelled').length,
    waiting: appointments.filter(a => (a.status === 'Pending' || a.status === 'Confirmed') && !isMissed(a)).length,
    serving: appointments.filter(a => a.status === 'Serving').length,
  }), [appointments, today])

  if (loading) {
    return (
      <div className="manage-appointments">
        <div className="skeleton" style={{ height: 48, marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 320 }} />
      </div>
    )
  }

  return (
    <div className="manage-appointments">
      <div className="appointment-counts stagger">
        <div className="count-chip"><strong>{counts.today}</strong> today</div>
        <div className="count-chip"><strong>{counts.waiting}</strong> waiting</div>
        <div className="count-chip serving"><strong>{counts.serving}</strong> serving now</div>
      </div>

      {/* Tabs */}
      <div className="appointments-tabs">
        <button className={`tab-btn ${tab === 'active' ? 'active' : ''}`} onClick={() => setTab('active')}>
          Active ({appointments.length})
        </button>
        <button className={`tab-btn ${tab === 'archived' ? 'active' : ''}`} onClick={() => setTab('archived')}>
          <FiArchive style={{ marginRight: 4 }} />
          Archived ({archivedAppointments.length})
        </button>
      </div>

      {/* Controls */}
      <div className="appointments-controls">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by name, queue # or service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select className="status-filter" value={dateFilter} onChange={(e) => setDateFilter(e.target.value as DateFilter)}>
          <option value="all">All Dates</option>
          <option value="today">Today</option>
          <option value="upcoming">Upcoming</option>
          <option value="past">Past</option>
        </select>
        {tab === 'active' && (
          <select
            className="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as AppointmentStatus | 'All')}
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Serving">Serving</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        )}
        <button className="refresh-btn" onClick={handleRefresh} disabled={refreshing}>
          <FiRefreshCw className={`refresh-icon ${refreshing ? 'spinning' : ''}`} /> {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
      <p className="auto-refresh-note">Auto-refreshes every 30 seconds</p>

      {/* Table */}
      <div className="appointments-table-container">
        <table className="appointments-table">
          <thead>
            <tr>
              <th>Queue #</th>
              <th>User</th>
              <th>Service</th>
              <th>Date & Time</th>
              <th>Status</th>
              {tab === 'active' && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map(appointment => (
              <tr key={appointment.id} className={appointment.status === 'Serving' ? 'row-serving' : ''}>
                <td><span className="queue-number">{appointment.queueNumber}</span></td>
                <td><div className="user-name">{appointment.userName}</div></td>
                <td>{appointment.service}</td>
                <td>
                  <div className="datetime">
                    <div>
                      {formatDisplayDate(appointment.date)}
                      {appointment.date === today && <span className="today-tag">Today</span>}
                    </div>
                    <div className="time">
                      {formatDisplayTime(appointment.time)}
                      {appointment.estimatedEnd && ` – ${formatDisplayTime(appointment.estimatedEnd)}`}
                    </div>
                  </div>
                </td>
                <td>
                  <span className={getStatusBadgeClass(appointment.status)}>
                    <span className={`status-dot ${appointment.status.toLowerCase()}-dot`}></span>
                    {appointment.status}
                  </span>
                  {isMissed(appointment) && <div className="missed-note">Date passed</div>}
                </td>
                {tab === 'active' && <td>{getActionButtons(appointment)}</td>}
              </tr>
            ))}
          </tbody>
        </table>

        {rows.length === 0 && (
          <div className="empty-state">
            <p>{tab === 'active' ? 'No appointments match these filters.' : 'No archived appointments.'}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ManageAppointments
