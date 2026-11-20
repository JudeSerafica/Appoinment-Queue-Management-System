import { useCallback, useEffect, useRef, useState } from 'react'
import { FiRefreshCcw } from 'react-icons/fi'
import { FaCalendarAlt, FaClock, FaTimes } from 'react-icons/fa'
import {
  useAppointments, Appointment, isActiveAppointment, isCancellable, displayStatus,
} from '../../contexts/AppointmentsContext'
import { useToast } from '../../contexts/ToastContext'
import { useConfirm } from '../../contexts/ConfirmContext'
import { getQueueStatus, QueueStatusData } from '../../api/routes'
import { formatDisplayDate, formatDisplayTime, formatMinutes, toLocalDateString } from '../../utils/date'
import './QueueStatus.css'

interface QueueStatusProps {
  onViewPastAppointment: (appointment: Appointment) => void
  onBookNew: () => void
}

const POLL_MS = 15000 // refresh the live queue every 15 seconds

const bySchedule = (a: Appointment, b: Appointment) =>
  `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)

const STATUS_LABEL: Record<string, string> = {
  Pending: '⊙ Pending',
  Confirmed: '✓ Confirmed',
  Serving: '▶ Serving',
  Completed: '✓ Completed',
  Cancelled: '✕ Cancelled',
  Missed: '! Missed',
}

function QueueStatus({ onViewPastAppointment, onBookNew }: QueueStatusProps) {
  const { appointments, fetchUserAppointments, cancelAppointment } = useAppointments()
  const { showToast } = useToast()
  const confirm = useConfirm()
  const [queueInfo, setQueueInfo] = useState<Record<number, QueueStatusData>>({})
  const [firstLoad, setFirstLoad] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [cancellingId, setCancellingId] = useState<number | null>(null)
  const previousStatus = useRef<Record<number, string>>({})

  const refresh = useCallback(async (silent: boolean) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (!user?.id) return
    if (!silent) setRefreshing(true)
    try {
      const [, queueRes] = await Promise.all([
        fetchUserAppointments(String(user.id), { silent: true }),
        getQueueStatus(),
      ])
      if (queueRes.success) {
        const map: Record<number, QueueStatusData> = {}
        queueRes.data.forEach(q => { map[q.appointment_id] = q })
        setQueueInfo(map)
      }
      setLastUpdated(new Date())
    } catch {
      if (!silent) showToast('Could not refresh the queue. Check your connection.', 'error')
    } finally {
      setRefreshing(false)
      setFirstLoad(false)
    }
  }, [fetchUserAppointments, showToast])

  // Initial load + polling; pause while the browser tab is hidden
  useEffect(() => {
    refresh(true)
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') refresh(true)
    }, POLL_MS)
    return () => clearInterval(timer)
  }, [])

  // Notify the user when one of their appointments starts being served
  useEffect(() => {
    appointments.forEach(a => {
      const before = previousStatus.current[a.id]
      if (before && before !== 'Serving' && a.status === 'Serving') {
        showToast(`It's your turn! ${a.service} is now serving you.`, 'info')
      }
      previousStatus.current[a.id] = a.status
    })
  }, [appointments, showToast])

  const handleCancel = async (apt: Appointment) => {
    const when = `${formatDisplayDate(apt.date)} at ${formatDisplayTime(apt.time)}`
    if (!await confirm(`Cancel your ${apt.service} appointment on ${when}?`, {
      title: 'Cancel appointment', confirmText: 'Yes, cancel it', cancelText: 'Keep it', danger: true,
    })) return
    setCancellingId(apt.id)
    const res = await cancelAppointment(apt.id)
    setCancellingId(null)
    if (res.success) {
      showToast('Appointment cancelled', 'success')
      refresh(true)
    } else {
      showToast(res.message || 'Failed to cancel appointment', 'error')
    }
  }

  const active = appointments.filter(isActiveAppointment).sort(bySchedule)
  const past = appointments.filter(a => !isActiveAppointment(a)).sort(bySchedule).reverse()
  const current = active[0]
  const others = active.slice(1)
  const today = toLocalDateString(new Date())

  if (firstLoad) {
    return (
      <div className="queue-status">
        <div className="queue-content">
          <div className="skeleton" style={{ height: 280, marginBottom: 30 }} />
          <div className="skeleton" style={{ height: 120 }} />
        </div>
      </div>
    )
  }

  const renderCurrent = (apt: Appointment) => {
    const info = queueInfo[apt.id]
    const isServing = apt.status === 'Serving'
    const isFutureDay = apt.date > today
    const ahead = info?.people_ahead ?? 0
    const waitMinutes = ahead * (info?.duration ?? 0)
    // Progress: how many of the people before you are already done
    const before = Math.max(apt.queueNumber - 1, 0)
    const progress = isServing ? 100 : before === 0 ? 0 : Math.round(((before - ahead) / before) * 100)

    return (
      <div className={`appointment-item current ${isServing ? 'is-serving' : ''}`}>
        {isServing && (
          <div className="your-turn-banner">▶ It's your turn! Please proceed to the counter.</div>
        )}
        <div className="current-top">
          <div className="appointment-info">
            <strong>{apt.service}</strong>
            <span><FaCalendarAlt /> {formatDisplayDate(apt.date)}</span>
            <span><FaClock /> {formatDisplayTime(apt.time)}</span>
          </div>
          <div className={`status-badge ${apt.status.toLowerCase()}`}>
            {STATUS_LABEL[apt.status] ?? apt.status}
          </div>
        </div>

        <div className="queue-info-grid">
          <div className="queue-info-box highlight">
            <div className="info-label">Your Number</div>
            <div className="info-value">#{apt.queueNumber}</div>
          </div>
          <div className="queue-info-box">
            <div className="info-label">Now Serving</div>
            <div className="info-value">{info?.now_serving ? `#${info.now_serving}` : '—'}</div>
          </div>
          <div className="queue-info-box">
            <div className="info-label">People Ahead</div>
            <div className="info-value">{isServing ? 0 : ahead}</div>
          </div>
          <div className="queue-info-box">
            <div className="info-label">Estimated Wait</div>
            <div className="info-value small">
              {isServing ? 'Now' : isFutureDay ? formatDisplayDate(apt.date) : formatMinutes(waitMinutes)}
            </div>
          </div>
        </div>

        <div className="progress-section">
          <div className="progress-label">Queue progress</div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="progress-info">
            <span>{isServing ? 'Being served' : `${ahead} ahead of you`}</span>
            <span>{progress}%</span>
          </div>
        </div>

        {isCancellable(apt) && (
          <div className="current-actions">
            <button
              className="cancel-appointment-btn"
              onClick={() => handleCancel(apt)}
              disabled={cancellingId === apt.id}
            >
              <FaTimes /> {cancellingId === apt.id ? 'Cancelling…' : 'Cancel Appointment'}
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="queue-status">
      <header className="queue-header">
        <div>
          <h1>Queue Status</h1>
          <p className="live-line">
            <span className="live-dot" /> Live · updates every 15 seconds
            {lastUpdated && <> · last updated {lastUpdated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' })}</>}
          </p>
        </div>
        <button className="refresh-btn" onClick={() => refresh(false)} disabled={refreshing}>
          <FiRefreshCcw className={`refresh-icon ${refreshing ? 'spinning' : ''}`} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </header>

      <div className="queue-content">
        <div className="current-appointment">
          {current ? renderCurrent(current) : (
            <div className="no-current-appointment">
              <p>No active appointment</p>
              <button className="browse-services-btn" onClick={onBookNew}>Book an Appointment</button>
            </div>
          )}
        </div>

        {others.length > 0 && (
          <div className="active-appointments">
            <h2>Other Active Appointments</h2>
            <div className="appointments-list stagger">
              {others.map(apt => (
                <div key={apt.id} className="appointment-item">
                  <div className="appointment-info">
                    <strong>{apt.service} · #{apt.queueNumber}</strong>
                    <span>{formatDisplayDate(apt.date)} · {formatDisplayTime(apt.time)}</span>
                    {queueInfo[apt.id] && (
                      <span>{queueInfo[apt.id].people_ahead} ahead of you</span>
                    )}
                  </div>
                  <div className="item-side">
                    <div className={`status-badge ${apt.status.toLowerCase()}`}>
                      {STATUS_LABEL[apt.status] ?? apt.status}
                    </div>
                    {isCancellable(apt) && (
                      <button
                        className="cancel-link"
                        onClick={() => handleCancel(apt)}
                        disabled={cancellingId === apt.id}
                      >
                        {cancellingId === apt.id ? 'Cancelling…' : 'Cancel'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="past-appointments">
          <h2>Past Appointments</h2>
          <div className="appointments-list stagger">
            {past.length === 0 ? (
              <div className="no-appointments">No past appointments</div>
            ) : (
              past.map(apt => (
                <button
                  key={apt.id}
                  className="appointment-item clickable"
                  onClick={() => onViewPastAppointment(apt)}
                >
                  <div className="appointment-info">
                    <strong>{apt.service}</strong>
                    <span>{formatDisplayDate(apt.date)} · {formatDisplayTime(apt.time)}</span>
                  </div>
                  <div className={`status-badge ${displayStatus(apt).toLowerCase()}`}>
                    {STATUS_LABEL[displayStatus(apt)] ?? displayStatus(apt)}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default QueueStatus
