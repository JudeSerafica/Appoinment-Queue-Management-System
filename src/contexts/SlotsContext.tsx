import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { getAdminSlots, getSlots, SlotData, deleteSlot as apiDeleteSlot } from '../api/routes'

export interface TimeSlot {
  id: number
  serviceId: number
  serviceName: string
  date: string
  time: string
  capacity: number
  booked: number
}

interface SlotsContextType {
  slots: TimeSlot[]
  loading: boolean
  addSlot: (slot: Omit<TimeSlot, 'id' | 'booked'>) => void
  updateSlot: (slot: TimeSlot) => void
  deleteSlot: (id: number) => void
  getSlotsByService: (serviceId: number) => TimeSlot[]
  getAvailableSlots: (serviceId: number) => TimeSlot[]
  bookSlot: (slotId: number) => boolean
  getSlotsForDate: (serviceId: number, date: string) => TimeSlot[]
  fetchSlots: () => Promise<void>
}

const SlotsContext = createContext<SlotsContextType | undefined>(undefined)

export function SlotsProvider({ children }: { children: ReactNode }) {
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)

  const fetchSlots = useCallback(async () => {
    setLoading(true)
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')

      const res = user.role === 'admin'
        ? await getAdminSlots()
        : await getSlots()

      if (res.success) {
        const mapped: TimeSlot[] = res.data.map((s: SlotData) => ({
          id: s.id,
          serviceId: s.service_id,
          serviceName: s.service_name,
          date: s.slot_date,
          time: s.slot_time,
          capacity: s.capacity,
          booked: s.capacity - s.available_capacity,
        }))
        setSlots(mapped)
      }
    } catch (err) {
      console.error('Failed to fetch slots:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const addSlot = (newSlot: Omit<TimeSlot, 'id' | 'booked'>) => {
    // Use `prev` (not `slots`) so several adds in a row get unique temporary ids.
    // Real ids replace these when fetchSlots() runs after generation.
    setSlots(prev => [...prev, {
      ...newSlot,
      id: prev.length > 0 ? Math.max(...prev.map(s => s.id)) + 1 : 1,
      booked: 0,
    }])
  }

  const updateSlot = (updatedSlot: TimeSlot) => {
    setSlots(prev => prev.map(s => s.id === updatedSlot.id ? updatedSlot : s))
  }

  const deleteSlot = async (id: number) => {
    try {
      const res = await apiDeleteSlot(id)
      if (res.success) {
        setSlots(prev => prev.filter(s => s.id !== id))
      } else {
        console.error('Delete slot failed:', res.message)
      }
    } catch (err) {
      console.error('Cannot connect to server:', err)
    }
  }

  // ← useCallback so useMemo in SelectTimeSlot re-runs correctly
  const getSlotsByService = useCallback(
    (serviceId: number) => slots.filter(s => s.serviceId === serviceId),
    [slots]
  )

  const getAvailableSlots = useCallback(
    (serviceId: number) => slots.filter(s => s.serviceId === serviceId && s.booked < s.capacity),
    [slots]
  )

  const bookSlot = (slotId: number): boolean => {
    const slot = slots.find(s => s.id === slotId)
    if (!slot || slot.booked >= slot.capacity) return false
    setSlots(prev => prev.map(s => s.id === slotId ? { ...s, booked: s.booked + 1 } : s))
    return true
  }

  const getSlotsForDate = useCallback(
    (serviceId: number, date: string) =>
      slots.filter(s => s.serviceId === serviceId && s.date === date),
    [slots]
  )

  return (
    <SlotsContext.Provider value={{
      slots, loading, addSlot, updateSlot, deleteSlot,
      getSlotsByService, getAvailableSlots, bookSlot,
      getSlotsForDate, fetchSlots,
    }}>
      {children}
    </SlotsContext.Provider>
  )
}

export function useSlots() {
  const context = useContext(SlotsContext)
  if (!context) throw new Error('useSlots must be used within a SlotsProvider')
  return context
}