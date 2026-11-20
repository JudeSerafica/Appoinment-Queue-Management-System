import { useState, useEffect, useMemo } from 'react'
import { FaTrash } from "react-icons/fa";
import AddSlotModal from '../AddSlotModal/AddSlotModal'
import './ManageSlots.css'
import { useServices } from '../../contexts/ServicesContext'
import { useSlots, TimeSlot } from '../../contexts/SlotsContext'
import { useToast } from '../../contexts/ToastContext'
import { useConfirm } from '../../contexts/ConfirmContext'
import { toLocalDateString, formatDisplayTime } from '../../utils/date'

function ManageSlots() {
  const { services } = useServices()
  const { slots, deleteSlot, fetchSlots } = useSlots()
  const { showToast } = useToast()
  const confirm = useConfirm()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedServiceId, setSelectedServiceId] = useState<number | 'all'>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => { fetchSlots() }, [])

  const selectedKey = toLocalDateString(selectedDate)
  const todayKey = toLocalDateString(new Date())

  // Slots matching the service filter (used for calendar dots)
  const serviceSlots = useMemo(
    () => selectedServiceId === 'all' ? slots : slots.filter(s => s.serviceId === selectedServiceId),
    [slots, selectedServiceId]
  )

  // Table shows only the selected day, earliest first
  const daySlots = useMemo(
    () => serviceSlots
      .filter(s => s.date === selectedKey)
      .sort((a, b) => a.time.localeCompare(b.time) || a.serviceName.localeCompare(b.serviceName)),
    [serviceSlots, selectedKey]
  )

  const datesWithSlots = useMemo(() => new Set(serviceSlots.map(s => s.date)), [serviceSlots])

  const handleDelete = async (slot: TimeSlot) => {
    if (slot.booked > 0) {
      showToast(`Cannot delete: ${slot.booked} appointment(s) are booked in this slot.`, 'error')
      return
    }
    const label = `${slot.serviceName} at ${formatDisplayTime(slot.time)}`
    if (!await confirm(`Delete the slot for ${label}?`, { title: 'Delete slot', confirmText: 'Delete', danger: true })) return
    setDeletingId(slot.id)
    await deleteSlot(slot.id)
    setDeletingId(null)
    await fetchSlots()
    showToast('Slot deleted', 'success')
  }

  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay()

  const monthName = selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const daysInMonth = getDaysInMonth(selectedDate)
  const firstDay = getFirstDayOfMonth(selectedDate)
  const paddedDays: (number | null)[] = Array(firstDay).fill(null)
    .concat(Array.from({ length: daysInMonth }, (_, i) => i + 1))

  const dayKey = (day: number) =>
    toLocalDateString(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day))

  const selectedDateStr = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  const totalCapacity = daySlots.reduce((sum, s) => sum + s.capacity, 0)
  const totalBooked = daySlots.reduce((sum, s) => sum + s.booked, 0)

  return (
    <div className="manage-slots">
      <div className="manage-slots-header">
        <h2>Manage Slots</h2>
        <button className="btn-add-slot" onClick={() => setIsModalOpen(true)}>+ Add Slots</button>
      </div>

      <div className="slots-container">
        <div className="calendar-section">
          <div className="calendar-header">
            <button
              aria-label="Previous month"
              onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}
            >‹</button>
            <h3>{monthName}</h3>
            <button
              aria-label="Next month"
              onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}
            >›</button>
          </div>
          <div className="calendar-grid">
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d} className="weekday">{d}</div>)}
            {paddedDays.map((day, idx) => day === null ? (
              <div key={idx} className="calendar-day empty" />
            ) : (
              <button
                key={idx}
                className={[
                  'calendar-day',
                  day === selectedDate.getDate() ? 'selected' : '',
                  dayKey(day) === todayKey ? 'today' : '',
                  dayKey(day) < todayKey ? 'past' : '',
                ].filter(Boolean).join(' ')}
                onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day))}
              >
                {day}
                {datesWithSlots.has(dayKey(day)) && <span className="slot-dot" />}
              </button>
            ))}
          </div>
          <button className="today-btn" onClick={() => setSelectedDate(new Date())}>Today</button>
        </div>

        <div className="slots-section">
          <div className="slots-header">
            <div className="slots-info">
              <select
                className="service-filter"
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              >
                <option value="all">All Services</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <span className="date-display">{selectedDateStr}</span>
            </div>
            {daySlots.length > 0 && (
              <span className="day-summary">
                {daySlots.length} slot{daySlots.length !== 1 ? 's' : ''} · {totalBooked}/{totalCapacity} booked
              </span>
            )}
          </div>

          <div className="slots-table-container">
            <table className="slots-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Service</th>
                  <th>Capacity</th>
                  <th>Booked</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {daySlots.map(slot => (
                  <tr key={slot.id}>
                    <td>{formatDisplayTime(slot.time)}</td>
                    <td>{slot.serviceName}</td>
                    <td>{slot.capacity}</td>
                    <td className="booked-cell">
                      <span className={slot.booked >= slot.capacity ? 'full' : ''}>
                        {slot.booked}/{slot.capacity}{slot.booked >= slot.capacity && ' · Full'}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button
                        className="btn-delete-slot"
                        onClick={() => handleDelete(slot)}
                        disabled={deletingId === slot.id}
                        title={slot.booked > 0 ? 'Slot has bookings and cannot be deleted' : 'Delete Slot'}
                      >
                        <FaTrash color={slot.booked > 0 ? '#bbb' : 'red'} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {daySlots.length === 0 && (
              <div className="empty-state">
                <p>No slots on this date. Dates with a dot have slots, or click "Add Slots" to create some.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <AddSlotModal
          onClose={() => setIsModalOpen(false)}
          onAddSlot={() => { /* list is reloaded from the server in onDone */ }}
          onDone={() => fetchSlots()}   // the modal itself reports created/failed counts
          selectedDate={selectedDate}
          services={services}
        />
      )}
    </div>
  )
}

export default ManageSlots
