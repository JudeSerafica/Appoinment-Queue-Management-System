import API_BASE from './config'

type JsonRecord = Record<string, unknown>

export type ApiResult<T> =
  | { success: true; message: string; data: T }
  | { success: false; message: string }

export interface AuthUser {
  id: number
  name: string
  role: 'user' | 'admin'
}

export interface ProfileData {
  id: number
  name: string
  email: string
  phone: string | null
}

export interface AppointmentData {
  id: number
  queue_number: number
  user_name?: string
  service_name: string
  appointment_date: string
  appointment_time: string
  estimated_end?: string
  status: string
}

export interface ServiceData {
  id: number
  name: string
  description: string
  duration: number
  is_active: boolean
}

export interface SlotData {
  id: number
  service_id: number
  service_name: string
  slot_date: string
  slot_time: string
  capacity: number
  available_capacity: number
}

interface LoginCredentials {
  email: string
  password: string
}

interface RegisterData {
  name: string
  email: string
  password: string
}

interface ProfileUpdate {
  name?: string
  phone?: string
}

interface AppointmentCreate {
  service_id: number
  slot_id: number
  notes?: string
}

interface ServiceWrite {
  name: string
  description: string
  duration: number
}

interface ServiceUpdate extends ServiceWrite {
  id: number
  is_active: number
}

interface SlotCreate {
  service_id: number
  slot_date: string
  slot_time: string
  capacity: number
}

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const requiredRecord = (value: unknown, label: string): JsonRecord => {
  if (!isRecord(value)) throw new Error(`Invalid ${label} response`)
  return value
}

const stringField = (record: JsonRecord, key: string): string =>
  typeof record[key] === 'string' ? record[key] as string : ''

const numberField = (record: JsonRecord, key: string): number => {
  const value = Number(record[key])
  if (!Number.isFinite(value)) throw new Error(`Invalid ${key} in API response`)
  return value
}

const recordList = <T>(value: unknown, map: (record: JsonRecord) => T): T[] => {
  if (!Array.isArray(value)) throw new Error('Invalid list response from API')
  return value.map(item => map(requiredRecord(item, 'list item')))
}

const safeFailureMessage = (status: number): string => {
  if (status === 401) return 'Please sign in again.'
  if (status === 403) return 'You do not have permission to perform this action.'
  if (status === 404) return 'The requested item was not found.'
  if (status === 409) return 'This request conflicts with existing information.'
  if (status >= 500) return 'The server could not complete the request.'
  return 'Please check the request and try again.'
}

async function request<T>(
  path: string,
  init: RequestInit,
  select: (data: unknown) => T,
): Promise<ApiResult<T>> {
  const response = await fetch(`${API_BASE}${path}`, init)

  // Expired or invalid login: clear it and send the user back to sign in.
  // (/auth/* returns 401 for wrong credentials, so it is excluded.)
  if (response.status === 401 && !path.startsWith('/auth/') && localStorage.getItem('token')) {
    let role = ''
    try { role = JSON.parse(localStorage.getItem('user') || '{}').role ?? '' } catch { /* ignore */ }
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('isAdminLoggedIn')
    try { sessionStorage.setItem('sessionExpired', '1') } catch { /* ignore */ }
    window.location.assign(role === 'admin' ? '/admin' : '/login')
    return { success: false, message: 'Your session has expired. Please log in again.' }
  }

  let body: unknown

  try {
    body = await response.json()
  } catch {
    throw new Error('The server returned an invalid response.')
  }

  const envelope = requiredRecord(body, 'API')
  if (!response.ok || envelope.success !== true) {
    // Show the server's validation message (4xx) when it gives one; hide 5xx details
    const serverMessage = typeof envelope.message === 'string' ? envelope.message.trim() : ''
    const useServerMessage = serverMessage !== '' && response.status >= 400 && response.status < 500
    return {
      success: false,
      message: useServerMessage ? serverMessage : safeFailureMessage(response.status),
    }
  }

  return {
    success: true,
    message: 'Request completed.',
    data: select(envelope.data),
  }
}

const jsonHeaders = { 'Content-Type': 'application/json' }
const authHeaders = (token: string) => ({ Authorization: `Bearer ${token}` })
const authenticatedJsonHeaders = (token: string) => ({
  ...jsonHeaders,
  ...authHeaders(token),
})

const selectUser = (value: unknown): AuthUser => {
  const user = requiredRecord(value, 'user')
  const role = user.role
  if (role !== 'user' && role !== 'admin') throw new Error('Invalid user role in API response')
  return {
    id: numberField(user, 'id'),
    name: stringField(user, 'name'),
    role,
  }
}

const selectProfile = (value: unknown): ProfileData => {
  const profile = requiredRecord(value, 'profile')
  return {
    id: numberField(profile, 'id'),
    name: stringField(profile, 'name'),
    email: stringField(profile, 'email'),
    phone: typeof profile.phone === 'string' ? profile.phone : null,
  }
}

const selectAppointment = (record: JsonRecord): AppointmentData => {
  const appointment: AppointmentData = {
    id: numberField(record, 'id'),
    queue_number: numberField(record, 'queue_number'),
    service_name: stringField(record, 'service_name'),
    appointment_date: stringField(record, 'appointment_date'),
    appointment_time: stringField(record, 'appointment_time'),
    status: stringField(record, 'status'),
  }
  if (typeof record.user_name === 'string') appointment.user_name = record.user_name
  if (typeof record.estimated_end === 'string') appointment.estimated_end = record.estimated_end
  return appointment
}

const selectService = (record: JsonRecord): ServiceData => ({
  id: numberField(record, 'id'),
  name: stringField(record, 'name'),
  description: stringField(record, 'description'),
  duration: numberField(record, 'duration'),
  is_active: record.is_active === true || record.is_active === 1 || record.is_active === '1',
})

const selectSlot = (record: JsonRecord): SlotData => ({
  id: numberField(record, 'id'),
  service_id: numberField(record, 'service_id'),
  service_name: stringField(record, 'service_name'),
  slot_date: stringField(record, 'slot_date'),
  slot_time: stringField(record, 'slot_time'),
  capacity: numberField(record, 'capacity'),
  available_capacity: numberField(record, 'available_capacity'),
})

const selectId = (value: unknown, key: string): number =>
  numberField(requiredRecord(value, 'creation'), key)

const noData = (_value: unknown): null => null

// Authentication
export const login = (credentials: LoginCredentials) =>
  request('/auth/login', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(credentials),
  }, value => {
    const data = requiredRecord(value, 'login')
    if (typeof data.token !== 'string' || data.token.length === 0) {
      throw new Error('Invalid login response')
    }
    return { token: data.token, user: selectUser(data.user) }
  })

export const register = (userData: RegisterData) =>
  request('/auth/register', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(userData),
  }, noData)

// User
export const getProfile = (token: string) =>
  request('/users/profile', { headers: authHeaders(token) }, selectProfile)

export const updateProfile = (data: ProfileUpdate, token: string) =>
  request('/users/profile', {
    method: 'PUT',
    headers: authenticatedJsonHeaders(token),
    body: JSON.stringify(data),
  }, selectProfile)

// Appointments
export const getAppointmentsByUser = (userId: string, token: string) =>
  request(`/appointments/user/${encodeURIComponent(userId)}`, {
    headers: authHeaders(token),
  }, value => recordList(value, selectAppointment))

export const createAppointment = (data: AppointmentCreate, token: string) =>
  request('/appointments', {
    method: 'POST',
    headers: authenticatedJsonHeaders(token),
    body: JSON.stringify(data),
  }, value => {
    const record = requiredRecord(value, 'appointment')
    return {
      appointment_id: numberField(record, 'appointment_id'),
      queue_number: numberField(record, 'queue_number'),
      appointment_date: stringField(record, 'appointment_date'),
      appointment_time: stringField(record, 'appointment_time'),
      estimated_end: stringField(record, 'estimated_end'),
    }
  })

export const updateAppointmentStatus = (id: number, status: string, token: string) =>
  request('/appointments', {
    method: 'PUT',
    headers: authenticatedJsonHeaders(token),
    body: JSON.stringify({ id, status }),
  }, noData)

export const deleteAppointment = (id: number, token: string) =>
  request('/appointments', {
    method: 'DELETE',
    headers: authenticatedJsonHeaders(token),
    body: JSON.stringify({ id }),
  }, noData)

export const getArchivedAppointments = (token: string) =>
  request('/appointments/archived', {
    headers: authHeaders(token),
  }, value => recordList(value, selectAppointment))

// User cancels their own pending/confirmed appointment
export const cancelAppointment = (id: number, token: string) =>
  request('/appointments/cancel', {
    method: 'PUT',
    headers: authenticatedJsonHeaders(token),
    body: JSON.stringify({ id }),
  }, noData)

export interface QueueStatusData {
  appointment_id: number
  slot_id: number
  queue_number: number
  status: string
  duration: number
  now_serving: number | null   // null = nobody is being served yet in this slot
  people_ahead: number
}

export const getQueueStatus = (token: string) =>
  request('/appointments/queue', { headers: authHeaders(token) }, value =>
    recordList(value, (record): QueueStatusData => ({
      appointment_id: numberField(record, 'appointment_id'),
      slot_id: numberField(record, 'slot_id'),
      queue_number: numberField(record, 'queue_number'),
      status: stringField(record, 'status'),
      duration: numberField(record, 'duration'),
      now_serving: record.now_serving === null || record.now_serving === undefined
        ? null
        : numberField(record, 'now_serving'),
      people_ahead: numberField(record, 'people_ahead'),
    })))

export const changePassword = (
  data: { current_password: string; new_password: string },
  token: string,
) =>
  request('/users/password', {
    method: 'PUT',
    headers: authenticatedJsonHeaders(token),
    body: JSON.stringify(data),
  }, noData)

// Services
export const getServices = () =>
  request('/services', {}, value => recordList(value, selectService))

export const createService = (data: ServiceWrite, token: string) =>
  request('/services', {
    method: 'POST',
    headers: authenticatedJsonHeaders(token),
    body: JSON.stringify(data),
  }, value => ({ service_id: selectId(value, 'service_id') }))

export const updateService = (data: ServiceUpdate, token: string) =>
  request('/services', {
    method: 'PUT',
    headers: authenticatedJsonHeaders(token),
    body: JSON.stringify(data),
  }, noData)

// Slots
export const getSlots = () =>
  request('/slots', {}, value => recordList(value, selectSlot))

export const getAdminSlots = (token: string) =>
  request('/admin/slots', { headers: authHeaders(token) }, value =>
    recordList(value, selectSlot))

export const createSlot = (data: SlotCreate, token: string) =>
  request('/slots', {
    method: 'POST',
    headers: authenticatedJsonHeaders(token),
    body: JSON.stringify(data),
  }, value => ({ slot_id: selectId(value, 'slot_id') }))

export const deleteService = (id: number, token: string) =>
  request('/services', {
    method: 'DELETE',
    headers: authenticatedJsonHeaders(token),
    body: JSON.stringify({ id }),
  }, noData)

export const deleteSlot = (id: number, token: string) =>
  request('/slots', {
    method: 'DELETE',
    headers: authenticatedJsonHeaders(token),
    body: JSON.stringify({ id }),
  }, noData)

// Admin
export const getAdminAppointments = (token: string) =>
  request('/admin/appointments', { headers: authHeaders(token) }, value =>
    recordList(value, selectAppointment))

// Reports expose only aggregate fields used by reporting screens.
const selectReportRows = (value: unknown, allowedFields: string[]) =>
  recordList(value, record => Object.fromEntries(
    allowedFields.flatMap(key => {
      const field = record[key]
      return typeof field === 'string' || typeof field === 'number' || typeof field === 'boolean'
        ? [[key, field]]
        : []
    }),
  ))

const reportUrl = (path: string, from?: string, to?: string) => {
  const params = new URLSearchParams()
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  const query = params.toString()
  return `${path}${query ? `?${query}` : ''}`
}

export const getWaitTimeReport = (token: string, from?: string, to?: string) =>
  request(reportUrl('/reports/wait-time', from, to), {
    headers: authHeaders(token),
  }, value => selectReportRows(value, [
    'date', 'service_name', 'average_wait_time', 'avg_wait_time',
    'wait_time', 'total_appointments', 'appointment_count',
  ]))

export const getServiceDemandReport = (token: string, from?: string, to?: string) =>
  request(reportUrl('/reports/service-demand', from, to), {
    headers: authHeaders(token),
  }, value => selectReportRows(value, [
    'service_id', 'service_name', 'demand', 'total_appointments', 'appointment_count',
  ]))
