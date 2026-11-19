import { FaCalendarAlt, FaCheckCircle, FaUsers } from "react-icons/fa"
import './AppointmentOverview.css'

interface AppointmentOverviewProps {
  upcoming: number
  completed: number
  queuePosition: number | string
  onViewQueue?: () => void
}

function AppointmentOverview({ upcoming, completed, queuePosition, onViewQueue }: AppointmentOverviewProps) {
  return (
    <div className="appointment-overview stagger">
      <div className="overview-card">
        <div className="card-header">
          <span>Upcoming</span>
          <FaCalendarAlt className="card-icon" />
        </div>
        <div className="card-value">{upcoming}</div>
        <div className="card-hint">Pending, confirmed or serving</div>
      </div>

      <div className="overview-card">
        <div className="card-header">
          <span>Completed</span>
          <FaCheckCircle className="card-icon" />
        </div>
        <div className="card-value">{completed}</div>
        <div className="card-hint">Finished appointments</div>
      </div>

      <button className="overview-card clickable" onClick={onViewQueue} disabled={!onViewQueue}>
        <div className="card-header">
          <span>Next Queue Number</span>
          <FaUsers className="card-icon" />
        </div>
        <div className="card-value">{queuePosition}</div>
        <div className="card-hint">View live queue →</div>
      </button>
    </div>
  )
}

export default AppointmentOverview
