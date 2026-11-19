import { useState } from 'react'
import './MyQueue.css'
import QueueStatus from '../../components/QueueStatus/QueueStatus'
import PastAppointmentsDetail from '../../components/PastAppointmentsDetail/PastAppointmentsDetail'
import type { Appointment } from '../../contexts/AppointmentsContext'

interface MyQueueProps {
  onBookNew: () => void
}

function MyQueue({ onBookNew }: MyQueueProps) {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)

  return (
    <div className="my-queue">
      {selectedAppointment ? (
        <div className="page-enter">
          <PastAppointmentsDetail
            appointment={selectedAppointment}
            onGoBack={() => setSelectedAppointment(null)}
            onBookAgain={onBookNew}
          />
        </div>
      ) : (
        <QueueStatus onViewPastAppointment={setSelectedAppointment} onBookNew={onBookNew} />
      )}
    </div>
  )
}

export default MyQueue
