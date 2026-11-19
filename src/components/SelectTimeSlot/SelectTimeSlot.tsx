import { useState, useMemo, useEffect } from 'react'
import './SelectTimeSlot.css'
import { Service } from '../../contexts/ServicesContext'
import { useSlots } from '../../contexts/SlotsContext'

interface SelectTimeSlotProps {
  service: Service
  onSelectTime: (date: string, time: string, slotId: number) => void
  onGoBack: () => void
}

function formatTime(t: string): string {
  const [h, m] = t.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
  return `${display}:${m} ${ampm}`
}

function SelectTimeSlot({ service, onSelectTime, onGoBack }: SelectTimeSlotProps) {
  const { slots, getSlotsByService, fetchSlots } = useSlots()
  const [selectedDate, setSelectedDate] = useState<number | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  useEffect(() => { fetchSlots() }, [])

  // Only slots that start in the future and still have room
  const serviceSlots = useMemo(() => {
    const now = new Date()
    return getSlotsByService(service.id).filter(s =>
      s.booked < s.capacity && new Date(`${s.date}T${s.time}`) > now)
  }, [slots, service.id])

  // Jump the calendar to the earliest date that has an open slot
  const [autoPicked, setAutoPicked] = useState(false)
  useEffect(() => {
    if (autoPicked || serviceSlots.length === 0) return
    const first = [...serviceSlots].sort((a, b) =>
      `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))[0]
    const [y, m, d] = first.date.split('-').map(Number)
    setCurrentMonth(new Date(y, m - 1, 1))
    setSelectedDate(d)
    setAutoPicked(true)
  }, [serviceSlots, autoPicked])

  const clearSelection = () => {
    setSelectedDate(null)
    setSelectedTime(null)
    setSelectedSlotId(null)
  }

  const getDaysInMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  const getFirstDayOfMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), 1).getDay()

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const daysInMonth = getDaysInMonth(currentMonth)
  const firstDay = getFirstDayOfMonth(currentMonth)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const emptyDays = Array.from({ length: firstDay })

  const toDateStr = (day: number) =>
    `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  // Sorted ascending by time
  const availableSlots = useMemo(() => {
    if (!selectedDate) return []
    return serviceSlots
      .filter(s => s.date === toDateStr(selectedDate))
      .sort((a, b) => a.time.localeCompare(b.time))
  }, [serviceSlots, selectedDate, currentMonth])

  const handleContinue = () => {
    if (selectedDate && selectedTime && selectedSlotId)
      onSelectTime(toDateStr(selectedDate), selectedTime, selectedSlotId)
  }

  const today = new Date()
  const isDisabled = (day: number) => {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    return d < new Date(today.getFullYear(), today.getMonth(), today.getDate())
  }

  const hasSlots = (day: number) =>
    serviceSlots.some(s => s.date === toDateStr(day))

  // Capacity fill level for colour coding
  const fillLevel = (slot: { capacity: number; booked: number }) => {
    const pct = slot.booked / slot.capacity
    if (pct >= 0.9) return 'fill-critical'
    if (pct >= 0.6) return 'fill-high'
    return 'fill-ok'
  }

  return (
    <div className="select-time-slot">
      <header className="time-slot-header">
        <button className="back-btn" onClick={onGoBack}>← Back</button>
        <div>
          <h1>Select Time Slot</h1>
          <p>Booking: {service.name} · {service.duration} min</p>
        </div>
      </header>

      <div className="time-slot-content">

        {/* ── Calendar ── */}
        <div className="calendar-section">
          <div className="section-label">Select Date</div>
          <div className="calendar">
            <div className="cal-header">
              <button
                onClick={() => { setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)); clearSelection() }}
                disabled={currentMonth.getFullYear() === today.getFullYear() && currentMonth.getMonth() <= today.getMonth()}
                aria-label="Previous month"
              >‹</button>
              <span>{monthName}</span>
              <button
                onClick={() => { setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)); clearSelection() }}
                aria-label="Next month"
              >›</button>
            </div>
            <div className="cal-weekdays">
              {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="cal-days">
              {emptyDays.map((_, i) => <div key={`e-${i}`} className="empty-day" />)}
              {days.map(day => (
                <button
                  key={day}
                  className={[
                    'day',
                    selectedDate === day ? 'selected' : '',
                    isDisabled(day) ? 'disabled' : '',
                    hasSlots(day) ? 'has-slots' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => {
                    setSelectedDate(day)
                    setSelectedTime(null)
                    setSelectedSlotId(null)
                  }}
                  disabled={isDisabled(day)}
                >
                  {day}
                  {hasSlots(day) && !isDisabled(day) && <span className="dot" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Slots list ── */}
        <div className="slots-section">
          <div className="section-label">
            Available Slots
            {selectedDate && availableSlots.length > 0 && (
              <span className="slot-count">{availableSlots.length} available</span>
            )}
          </div>

          <div className="slots-list">
            {!selectedDate ? (
              <div className="empty-state">Select a date to see available slots</div>
            ) : availableSlots.length === 0 ? (
              <div className="empty-state">
                {serviceSlots.length === 0
                  ? 'No open slots for this service yet. Please check back later.'
                  : 'No available slots for this date. Dates with a dot have open slots.'}
              </div>
            ) : (
              availableSlots.map(slot => {
                const spotsLeft = slot.capacity - slot.booked
                const isSelected = selectedSlotId === slot.id
                return (
                  <button
                    key={slot.id}
                    className={['slot-row', isSelected ? 'selected' : '', fillLevel(slot)].join(' ')}
                    onClick={() => { setSelectedSlotId(slot.id); setSelectedTime(slot.time) }}
                  >
                    <div className="slot-time">{formatTime(slot.time)}</div>
                    <div className="slot-meta">
                      <span className="spots-badge">{spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left</span>
                      <div className="fill-bar">
                        <div
                          className="fill-bar-inner"
                          style={{ width: `${Math.round((slot.booked / slot.capacity) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>

          <button
            className="continue-btn"
            onClick={handleContinue}
            disabled={!selectedDate || !selectedTime}
          >
            Continue →
          </button>
        </div>

      </div>
    </div>
  )
}

export default SelectTimeSlot