import { createContext, useContext, useState, ReactNode } from 'react'
import {
  getAppointmentsByUser,
  getAdminAppointments,
  updateAppointmentStatus,
  deleteAppointment as apiDeleteAppointment,
  getArchivedAppointments as apiGetArchived,
  cancelAppointment as apiCancelAppointment,
  AppointmentData,
} from '../api/routes'
import { toLocalDateString } from '../utils/date'

export type AppointmentStatus = 'Pending' | 'Confirmed' | 'Serving' | 'Completed' | 'Cancelled'

// Appointments still waiting or in progress (not completed and not cancelled)
export const ACTIVE_STATUSES: AppointmentStatus[] = ['Pending', 'Confirmed', 'Serving']

type StatusAndDate = { status: AppointmentStatus; date: string }

// Pending/confirmed but the date already passed = the user never got served
export const isMissed = (a: StatusAndDate) =>
  (a.status === 'Pending' || a.status === 'Confirmed') && a.date < toLocalDateString(new Date())

// Still upcoming or in progress (a past-dated pending appointment is not active)
export const isActiveAppointment = (a: StatusAndDate) =>
  ACTIVE_STATUSES.includes(a.status) && !isMissed(a)

// Only upcoming pending/confirmed appointments can be cancelled by the user
export const isCancellable = (a: StatusAndDate) =>
  (a.status === 'Pending' || a.status === 'Confirmed') && !isMissed(a)

// Label shown to the user ("Missed" instead of a stale "Pending")
export const displayStatus = (a: StatusAndDate): string =>
  isMissed(a) ? 'Missed' : a.status

export interface ActionResult {
  success: boolean
  message: string
}

export interface Appointment {
  id: number
  queueNumber: number
  userName: string
  userEmail: string
  service: string
  date: string
  time: string
  estimatedEnd?: string
  status: AppointmentStatus
}

interface AppointmentsContextType {
  appointments: Appointment[]
  archivedAppointments: Appointment[]
  loading: boolean
  addAppointment: (appointment: Omit<Appointment, 'id' | 'status'>) => void
  updateStatus: (id: number, status: AppointmentStatus) => Promise<ActionResult>
  confirmAppointment: (id: number) => Promise<ActionResult>
  startAppointment: (id: number) => Promise<ActionResult>
  completeAppointment: (id: number) => Promise<ActionResult>
  deleteAppointment: (id: number) => Promise<ActionResult>
  filterByStatus: (status: AppointmentStatus | 'All') => Appointment[]
  searchAppointments: (query: string) => Appointment[]
  fetchUserAppointments: (userId: string, options?: { silent?: boolean }) => Promise<void>
  cancelAppointment: (id: number) => Promise<{ success: boolean; message: string }>
  fetchAdminAppointments: (options?: { silent?: boolean }) => Promise<void>
  fetchArchivedAppointments: (options?: { silent?: boolean }) => Promise<void>
}

const AppointmentsContext = createContext<AppointmentsContextType | undefined>(undefined)

const capitalize = (s: string) =>
  s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()

export function AppointmentsProvider({ children }: { children: ReactNode }) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [archivedAppointments, setArchivedAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(false)

  // silent: refresh in the background (polling) without showing the loading state
  const fetchUserAppointments = async (userId: string, options: { silent?: boolean } = {}) => {
    if (!options.silent) setLoading(true)
    try {
      const res = await getAppointmentsByUser(userId)
      if (res.success) {
        const mapped = res.data.map((a: AppointmentData) => ({
          id: a.id,
          queueNumber: a.queue_number,
          userName: a.user_name || '',
          userEmail: '',
          service: a.service_name,
          date: a.appointment_date,
          time: a.appointment_time,
          estimatedEnd: a.estimated_end || undefined,
          status: capitalize(a.status) as AppointmentStatus,
        }))
        setAppointments(mapped)
      }
    } catch (err) {
      console.error('Failed to fetch appointments:', err)
    } finally {
      if (!options.silent) setLoading(false)
    }
  }

  const cancelAppointment = async (id: number) => {
    try {
      const res = await apiCancelAppointment(id)
      if (res.success) {
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'Cancelled' } : a))
        return { success: true, message: 'Appointment cancelled' }
      }
      return { success: false, message: res.message }
    } catch {
      return { success: false, message: 'Cannot connect to server' }
    }
  }

  // silent: background refresh (auto-refresh) without the loading state
  const fetchAdminAppointments = async (options: { silent?: boolean } = {}) => {
    if (!options.silent) setLoading(true)
    try {
      const res = await getAdminAppointments()
      if (res.success) {
        const mapped = res.data.map((a: AppointmentData) => ({
          id: a.id,
          queueNumber: a.queue_number,
          userName: a.user_name || '',
          userEmail: '',
          service: a.service_name,
          date: a.appointment_date,
          time: a.appointment_time,
          estimatedEnd: a.estimated_end || undefined,
          status: capitalize(a.status) as AppointmentStatus,
        }))
        setAppointments(mapped)
      }
    } catch (err) {
      console.error('Failed to fetch admin appointments:', err)
    } finally {
      if (!options.silent) setLoading(false)
    }
  }

  const fetchArchivedAppointments = async (options: { silent?: boolean } = {}) => {
    if (!options.silent) setLoading(true)
    try {
      const res = await apiGetArchived()
      if (res.success) {
        const mapped = res.data.map((a: AppointmentData) => ({
          id: a.id,
          queueNumber: a.queue_number,
          userName: a.user_name || '',
          userEmail: '',
          service: a.service_name,
          date: a.appointment_date,
          time: a.appointment_time,
          status: capitalize(a.status) as AppointmentStatus,
        }))
        setArchivedAppointments(mapped)
      }
    } catch (err) {
      console.error('Failed to fetch archived appointments:', err)
    } finally {
      if (!options.silent) setLoading(false)
    }
  }

  const addAppointment = (appointment: Omit<Appointment, 'id' | 'status'>) => {
    setAppointments(prev => [{ ...appointment, id: Date.now(), status: 'Pending' }, ...prev])
  }

  const updateStatus = async (id: number, status: AppointmentStatus): Promise<ActionResult> => {
    try {
      const res = await updateAppointmentStatus(id, status.toLowerCase())
      if (res.success) {
        setAppointments(prev =>
          prev.map(app => app.id === id ? { ...app, status } : app)
        )
        return { success: true, message: '' }
      }
      return { success: false, message: res.message }
    } catch {
      return { success: false, message: 'Cannot connect to server' }
    }
  }

  // Soft delete — removes from active list, moves to archived
  const deleteAppointment = async (id: number): Promise<ActionResult> => {
    try {
      const res = await apiDeleteAppointment(id)
      if (res.success) {
        const deleted = appointments.find(a => a.id === id)
        if (deleted) {
          setAppointments(prev => prev.filter(a => a.id !== id))
          setArchivedAppointments(prev => [deleted, ...prev])
        }
        return { success: true, message: '' }
      }
      return { success: false, message: res.message }
    } catch {
      return { success: false, message: 'Cannot connect to server' }
    }
  }

  const confirmAppointment  = (id: number) => updateStatus(id, 'Confirmed')
  const startAppointment    = (id: number) => updateStatus(id, 'Serving')
  const completeAppointment = (id: number) => updateStatus(id, 'Completed')

  const filterByStatus = (status: AppointmentStatus | 'All') =>
    status === 'All' ? appointments : appointments.filter(a => a.status === status)

  const searchAppointments = (query: string) => {
    const q = query.toLowerCase()
    return appointments.filter(a =>
      a.userName.toLowerCase().includes(q) ||
      a.queueNumber.toString().includes(q) ||
      a.service.toLowerCase().includes(q)
    )
  }

  return (
    <AppointmentsContext.Provider value={{
      appointments, archivedAppointments, loading,
      addAppointment, updateStatus,
      confirmAppointment, startAppointment,
      completeAppointment, deleteAppointment,
      filterByStatus, searchAppointments,
      fetchUserAppointments, fetchAdminAppointments, cancelAppointment,
      fetchArchivedAppointments,
    }}>
      {children}
    </AppointmentsContext.Provider>
  )
}

export function useAppointments() {
  const context = useContext(AppointmentsContext)
  if (!context) throw new Error('useAppointments must be used within an AppointmentsProvider')
  return context
}