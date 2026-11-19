import { FaCalendarAlt, FaClock } from "react-icons/fa"
import { formatDisplayDate, formatDisplayTime } from '../../utils/date'
import './UpcomingAppointments.css'

interface Appointment {
  id: number
  queueNumber: number
  service: string
  date: string
  time: string
  status: string
}

interface UpcomingAppointmentsProps {
  appointments: Appointment[]
  onBookNew?: () => void
  onViewQueue?: () => void
}

function UpcomingAppointments({ appointments, onBookNew, onViewQueue }: UpcomingAppointmentsProps) {
  return (
    <div className="upcoming-appointments">
      <div className="appointments-header">
        <h2>Upcoming Appointments</h2>
        <button className="book-new-btn" onClick={onBookNew}>Book New →</button>
      </div>

      {appointments.length === 0 ? (
        <div className="no-appointments">
          <FaCalendarAlt className="empty-icon" color="#2f6f73" />
          <p>No upcoming appointments</p>
          <p className="empty-subtext">Book a service to get started</p>
          <button className="browse-services-btn" onClick={onBookNew}>Browse Services</button>
        </div>
      ) : (
        <div className="appointments-grid stagger">
          {appointments.map((apt) => (
            <button key={apt.id} className="appointment-card" onClick={onViewQueue}>
              <div className="appointment-status">
                <span className={`status-badge ${apt.status.toLowerCase()}`}>
                  {apt.status}
                </span>
                <span className="card-queue-number">#{apt.queueNumber}</span>
              </div>
              <div className="appointment-details">
                <h3>{apt.service}</h3>
                <p><FaCalendarAlt /> {formatDisplayDate(apt.date)}</p>
                <p><FaClock /> {formatDisplayTime(apt.time)}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default UpcomingAppointments
