import { useState, useMemo } from 'react'
import './AddSlotModal.css'
import { Service } from '../../contexts/ServicesContext'
import { createSlot } from '../../api/routes'
import { toLocalDateString } from '../../utils/date'

interface AddSlotModalProps {
  onClose: () => void
  onAddSlot: (slot: { time: string; serviceId: number; serviceName: string; capacity: number; date: string }) => void
  onDone: () => void   // ← triggers fetchSlots in parent after all slots created
  selectedDate: Date
  services: Service[]
}

function suggestCapacity(duration: number): number {
  if (duration <= 15) return 5
  if (duration <= 30) return 10
  if (duration <= 60) return 8
  return 5
}

function formatTimeDisplay(t: string): string {
  const [h, m] = t.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
  return `${display}:${m} ${ampm}`
}

function AddSlotModal({ onClose, onAddSlot, onDone, selectedDate, services }: AddSlotModalProps) {
  const activeServices = services.filter(s => s.status === 'Active')

  const [formData, setFormData] = useState({
    serviceId: activeServices.length > 0 ? activeServices[0].id : 0,
    date: selectedDate,
    startTime: '09:00',
    endTime: '17:00',
    capacity: suggestCapacity(activeServices[0]?.duration ?? 30),
  })
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)   // how many slots created so far
  const [total, setTotal] = useState(0)         // how many slots are being created
  const [error, setError] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [displayMonth, setDisplayMonth] = useState(new Date(selectedDate))

  const selectedService = useMemo(
    () => activeServices.find(s => s.id === formData.serviceId),
    [activeServices, formData.serviceId]
  )

  // Re-suggest capacity when service changes
  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = parseInt(e.target.value)
    const svc = activeServices.find(s => s.id === id)
    setFormData(prev => ({
      ...prev,
      serviceId: id,
      capacity: suggestCapacity(svc?.duration ?? 30),
    }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'capacity' ? parseInt(value) : value,
    }))
  }

  const handleSelectDate = (day: number) => {
    const newDate = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), day)
    setFormData(prev => ({ ...prev, date: newDate }))
    setShowDatePicker(false)
  }

  // Generate all time slots based on start, end, duration
  const generatedSlots = useMemo(() => {
    const duration = selectedService?.duration ?? 30
    const slots: string[] = []
    const [startH, startM] = formData.startTime.split(':').map(Number)
    const [endH, endM] = formData.endTime.split(':').map(Number)
    let current = startH * 60 + startM
    const end = endH * 60 + endM
    while (current + duration <= end) {
      const h = Math.floor(current / 60)
      const m = current % 60
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`)
      current += duration
    }
    return slots
  }, [formData.startTime, formData.endTime, selectedService])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (generatedSlots.length === 0) {
      setError('No slots to generate. Check your start/end times.')
      return
    }

    const dateStr = toLocalDateString(formData.date)
    // The server rejects slots in the past, so skip times that have already passed
    const now = new Date()
    const futureSlots = generatedSlots.filter(t => new Date(`${dateStr}T${t}`) > now)
    const skipped = generatedSlots.length - futureSlots.length

    if (futureSlots.length === 0) {
      setError('All selected times are already in the past. Choose a later date or time.')
      return
    }

    setLoading(true)
    setProgress(0)
    setTotal(futureSlots.length)

    try {
      const token = localStorage.getItem('token') || ''
      const svc = activeServices.find(s => s.id === formData.serviceId)

      let failCount = 0

      // Sequential so progress bar is accurate
      for (let i = 0; i < futureSlots.length; i++) {
        const time = futureSlots[i]
        const res = await createSlot({
          service_id: formData.serviceId,
          slot_date: dateStr,
          slot_time: time,
          capacity: formData.capacity,
        }, token)

        if (res.success && svc) {
          onAddSlot({
            serviceId: formData.serviceId,
            serviceName: svc.name,
            time,
            capacity: formData.capacity,
            date: dateStr,
          })
        } else {
          failCount++
        }

        setProgress(i + 1)
      }

      if (failCount > 0) {
        setError(`${failCount} slot(s) failed to create.`)
      }

      // Always refresh parent slots list then close
      onDone()
      if (failCount === 0 && skipped === 0) onClose()
      else if (failCount === 0) setError(`${skipped} past time slot(s) were skipped. ${futureSlots.length} created.`)

    } catch {
      setError('Cannot connect to server.')
    } finally {
      setLoading(false)
    }
  }

  // Calendar helpers
  const getDaysInMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  const getFirstDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1).getDay()
  const monthName = displayMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const paddedDays = Array(getFirstDay(displayMonth)).fill(null)
    .concat(Array.from({ length: getDaysInMonth(displayMonth) }, (_, i) => i + 1))
  const dateLabel = formData.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const progressPct = total > 0
    ? Math.round((progress / total) * 100)
    : 0

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Generate Time Slots</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {error && <p className="modal-error">{error}</p>}

        <form onSubmit={handleSubmit} className="modal-form">

          {/* Service */}
          <div className="form-group">
            <label>Service *</label>
            <select name="serviceId" value={formData.serviceId} onChange={handleServiceChange} required>
              {activeServices.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.duration} min)</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div className="form-group">
            <label>Date *</label>
            <div className="date-selector">
              <input
                type="text" value={dateLabel} readOnly className="date-input"
                onClick={() => setShowDatePicker(p => !p)}
              />
              {showDatePicker && (
                <div className="date-picker-dropdown">
                  <div className="calendar-header">
                    <button type="button" onClick={() => setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1, 1))}>‹</button>
                    <h4>{monthName}</h4>
                    <button type="button" onClick={() => setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 1))}>›</button>
                  </div>
                  <div className="calendar-grid">
                    {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d} className="weekday">{d}</div>)}
                    {paddedDays.map((day, idx) => (
                      <div
                        key={idx}
                        className={`calendar-day ${!day ? 'empty' : ''} ${day === formData.date.getDate() && displayMonth.getMonth() === formData.date.getMonth() ? 'selected' : ''}`}
                        onClick={() => day && handleSelectDate(day)}
                      >{day}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Start / End time */}
          <div className="form-row">
            <div className="form-group">
              <label>Start Time *</label>
              <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>End Time *</label>
              <input type="time" name="endTime" value={formData.endTime} onChange={handleChange} required />
            </div>
          </div>

          {/* Capacity */}
          <div className="form-group">
            <label>
              Capacity per Slot *
              <span className="label-hint"> (suggested for {selectedService?.duration ?? '?'} min slots)</span>
            </label>
            <input
              type="number" name="capacity"
              value={formData.capacity}
              onChange={handleChange}
              min="1" max="500" required
            />
          </div>

          {/* Slot preview */}
          <div className="form-group">
            <label>
              Slots Preview
              <span className="label-hint"> — {generatedSlots.length} slot{generatedSlots.length !== 1 ? 's' : ''} × {selectedService?.duration ?? '?'} min</span>
            </label>
            <div className="slot-preview">
              {generatedSlots.length === 0
                ? <span className="no-preview">No slots — adjust start/end times</span>
                : generatedSlots.map(t => (
                    <span key={t} className="preview-chip">{formatTimeDisplay(t)}</span>
                  ))
              }
            </div>
          </div>

          {/* Progress bar shown while loading */}
          {loading && (
            <div className="progress-wrap">
              <div className="progress-bar" style={{ width: `${progressPct}%` }} />
              <span className="progress-label">{progress} / {total} created</span>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="btn-create" disabled={loading || generatedSlots.length === 0}>
              {loading ? `Creating… ${progressPct}%` : `Generate ${generatedSlots.length} Slots`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddSlotModal