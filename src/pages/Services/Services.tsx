import { useState } from 'react'
import './Services.css'
import ServicesList from '../../components/ServicesList/ServicesList'
import SelectTimeSlot from '../../components/SelectTimeSlot/SelectTimeSlot'
import ConfirmBooking from '../../components/ConfirmBooking/ConfirmBooking'
import BookingConfirmed from '../../components/BookingConfirmed/BookingConfirmed'
import { useServices, Service } from '../../contexts/ServicesContext'
import { createAppointment } from '../../api/routes'
import { useToast } from '../../contexts/ToastContext'

interface ServicesProps {
  onTrackQueue: () => void
}

const STEPS = [
  { key: 'list', label: 'Choose Service' },
  { key: 'time', label: 'Pick a Time' },
  { key: 'confirm', label: 'Confirm' },
  { key: 'confirmed', label: 'Done' },
] as const

interface BookingData {
  service: Service | null
  date: string
  time: string
  slotId: number | null
}

function Services({ onTrackQueue }: ServicesProps) {
  const { getActiveServices, loading } = useServices()
  const { showToast } = useToast()
  const [step, setStep] = useState<'list' | 'time' | 'confirm' | 'confirmed'>('list')
  const [bookingData, setBookingData] = useState<BookingData>({
    service: null, date: '', time: '', slotId: null
  })
  const [queueNumber, setQueueNumber] = useState(0)
  const [bookingResult, setBookingResult] = useState<{ time: string; end: string } | null>(null)
  const [bookingError, setBookingError] = useState('')
  const [bookingLoading, setBookingLoading] = useState(false)

  const activeServices = getActiveServices()

  interface BookingResult {
    queue_number: number
    appointment_date: string
    appointment_time: string
    estimated_end: string
  }

  const handleSelectService = (service: Service) => {
    setBookingData({ service, date: '', time: '', slotId: null })
    setStep('time')
  }

  const handleSelectTime = (date: string, time: string, slotId: number) => {
    setBookingData(prev => ({ ...prev, date, time, slotId }))
    setStep('confirm')
  }

  const handleConfirmBooking = async (): Promise<BookingResult | null> => {
    if (!bookingData.service || !bookingData.slotId) return null

    setBookingLoading(true)
    setBookingError('')

    try {
      const res = await createAppointment({
        service_id: bookingData.service.id,
        slot_id: bookingData.slotId,
        notes: '',
      })

      if (res.success) {
        setQueueNumber(res.data.queue_number)
        // The server shifts your time by your place in the queue
        setBookingResult({ time: res.data.appointment_time, end: res.data.estimated_end })
        setStep('confirmed')
        showToast(`Booked! Your queue number is #${res.data.queue_number}`, 'success')
        return {
          queue_number: res.data.queue_number,
          appointment_date: res.data.appointment_date,
          appointment_time: res.data.appointment_time,
          estimated_end: res.data.estimated_end,
        }
      } else {
        setBookingError(res.message || 'Booking failed. Please try again.')
        return null
      }
    } catch (err) {
      setBookingError('Cannot connect to server')
      return null
    } finally {
      setBookingLoading(false)
    }
  }

  const handleReset = () => {
    setStep('list')
    setBookingData({ service: null, date: '', time: '', slotId: null })
    setQueueNumber(0)
    setBookingResult(null)
    setBookingError('')
  }

  const handleGoBack = () => {
    if (step === 'time') setStep('list')
    else if (step === 'confirm') setStep('time')
    else if (step === 'confirmed') handleReset()
  }

  if (loading) {
    return (
      <div className="services-page" style={{ padding: 40 }}>
        <div className="skeleton" style={{ height: 40, width: 260, marginBottom: 30 }} />
        <div className="skeleton-row">
          <div className="skeleton" style={{ height: 160 }} />
          <div className="skeleton" style={{ height: 160 }} />
          <div className="skeleton" style={{ height: 160 }} />
        </div>
      </div>
    )
  }

  const stepIndex = STEPS.findIndex(st => st.key === step)

  return (
    <div className="services-page">
      {/* Booking progress: Service → Time → Confirm → Done */}
      <ol className="booking-steps" aria-label="Booking progress">
        {STEPS.map((st, i) => (
          <li
            key={st.key}
            className={`booking-step ${i < stepIndex ? 'done' : ''} ${i === stepIndex ? 'current' : ''}`}
            aria-current={i === stepIndex ? 'step' : undefined}
          >
            <span className="step-dot">{i < stepIndex ? '✓' : i + 1}</span>
            <span className="step-label">{st.label}</span>
          </li>
        ))}
      </ol>
      <div key={step} className="page-enter">
      {step === 'list' && (
        <ServicesList services={activeServices} onSelectService={handleSelectService} />
      )}
      {step === 'time' && bookingData.service && (
        <SelectTimeSlot
          service={bookingData.service}
          onSelectTime={handleSelectTime}
          onGoBack={handleGoBack}
        />
      )}
      {step === 'confirm' && bookingData.service && (
        <>
          {bookingError && <p className="booking-error">{bookingError}</p>}
          <ConfirmBooking
            bookingData={bookingData}
            onConfirm={handleConfirmBooking}
            onGoBack={handleGoBack}
            loading={bookingLoading}
          />
        </>
      )}
      {step === 'confirmed' && bookingData.service && (
        <BookingConfirmed
          bookingData={bookingData}
          queueNumber={queueNumber}
          appointmentTime={bookingResult?.time ?? bookingData.time}
          estimatedEnd={bookingResult?.end}
          onBookAnother={handleReset}
          onTrackQueue={onTrackQueue}
        />
      )}
      </div>
    </div>
  )
}

export default Services