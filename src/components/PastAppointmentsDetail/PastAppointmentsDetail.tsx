import { displayStatus, type Appointment } from '../../contexts/AppointmentsContext'
import { formatDisplayDate, formatDisplayTime } from '../../utils/date'
import './PastAppointmentsDetail.css'

interface PastAppointmentsDetailProps {
  appointment: Appointment
  onGoBack: () => void
  onBookAgain: () => void
}

function PastAppointmentsDetail({ appointment, onGoBack, onBookAgain }: PastAppointmentsDetailProps) {
  const rows: [string, string][] = [
    ['Queue Number', `#${appointment.queueNumber}`],
    ['Date', formatDisplayDate(appointment.date)],
    ['Scheduled Time', formatDisplayTime(appointment.time)],
  ]
  if (appointment.estimatedEnd) rows.push(['Estimated End', formatDisplayTime(appointment.estimatedEnd)])
  const note = displayStatus(appointment) === 'Missed'
    ? 'This appointment date has passed and it was not completed.'
    : appointment.status === 'Cancelled'
      ? 'This appointment was cancelled.'
      : ''

  return (
    <div className="past-appointments-detail">
      <header className="detail-header">
        <button className="back-btn" onClick={onGoBack}>← Back to Queue</button>
      </header>

      <div className="detail-content">
        <h1>{appointment.service}</h1>

        <div className="appointment-detail-card">
          <p>
            <strong>Status:</strong>{' '}
            <span className={`status-badge ${displayStatus(appointment).toLowerCase()}`}>
              {displayStatus(appointment)}
            </span>
          </p>
          {rows.map(([label, value]) => (
            <p key={label}><strong>{label}:</strong> {value}</p>
          ))}
          {note && <p className="detail-note">{note}</p>}
        </div>

        <div className="detail-actions">
          <button className="book-again-btn" onClick={onBookAgain}>Book Again</button>
        </div>
      </div>
    </div>
  )
}

export default PastAppointmentsDetail
