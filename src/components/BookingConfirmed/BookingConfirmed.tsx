import { formatDisplayTime } from '../../utils/date'
import './BookingConfirmed.css'

interface Service {
  id: number
  name: string
  duration: number
}

interface BookingData {
  service: Service | null
  date: string
  time: string
}

interface BookingConfirmedProps {
  bookingData: BookingData
  queueNumber: number
  appointmentTime: string   // your personal time (slot start + your place in queue)
  estimatedEnd?: string
  onBookAnother: () => void
  onTrackQueue: () => void
}

function BookingConfirmed({ bookingData, queueNumber, appointmentTime, estimatedEnd, onBookAnother, onTrackQueue }: BookingConfirmedProps) {
  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  return (
    <div className="booking-confirmed">
      <div className="confirmed-container">
        {/* Animated checkmark: circle draws, then the tick */}
        <svg className="success-check" viewBox="0 0 52 52" aria-hidden="true">
          <circle className="check-circle" cx="26" cy="26" r="24" fill="none" />
          <path className="check-tick" fill="none" d="M15 27l7 7 15-15" />
        </svg>
        <h1>Appointment Booked!</h1>
        <p className="confirmed-message">Your queue number has been assigned. Please arrive a few minutes before your time.</p>

        <div className="queue-number-box">
          <div className="queue-label">Your Queue Number</div>
          <div className="queue-number">#{queueNumber}</div>
        </div>

        {bookingData.service && (
          <div className="booking-details">
            <div className="detail-row">
              <span className="detail-label">Service</span>
              <span className="detail-value">{bookingData.service.name}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Date</span>
              <span className="detail-value">{formatDate(bookingData.date)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Your Time</span>
              <span className="detail-value">
                {formatDisplayTime(appointmentTime)}
                {estimatedEnd && ` – ${formatDisplayTime(estimatedEnd)}`}
              </span>
            </div>
          </div>
        )}

        <div className="confirmed-actions">
          <button className="secondary-btn" onClick={onBookAnother}>
            Book Another
          </button>
          <button className="primary-btn" onClick={onTrackQueue}>
            Track Queue
          </button>
        </div>
      </div>
    </div>
  )
}

export default BookingConfirmed
