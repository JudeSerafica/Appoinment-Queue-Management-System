import { useMemo, useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts'
import { FiBarChart2, FiCheckCircle, FiPercent, FiClock } from 'react-icons/fi'
import { useAppointments } from '../../contexts/AppointmentsContext'
import { useServices } from '../../contexts/ServicesContext'
import { formatDisplayDate, formatDisplayTime, toLocalDateString } from '../../utils/date'
import './ManageReports.css'

type Range = '7' | '30' | '90' | 'all'

const RANGE_LABEL: Record<Range, string> = {
  '7': 'Last 7 days', '30': 'Last 30 days', '90': 'Last 90 days', all: 'All time',
}

const STATUS_COLORS: Record<string, string> = {
  Pending: '#DAA520',
  Confirmed: '#3f8f95',
  Serving: '#27AE60',
  Completed: '#888888',
  Cancelled: '#B0BEC5',
}

function ManageReports() {
  const { appointments, fetchAdminAppointments } = useAppointments()
  const { services } = useServices()
  const [range, setRange] = useState<Range>('30')

  useEffect(() => { fetchAdminAppointments() }, [])

  // Appointments inside the chosen date range
  const inRange = useMemo(() => {
    if (range === 'all') return appointments
    const from = new Date()
    from.setDate(from.getDate() - (Number(range) - 1))
    const fromKey = toLocalDateString(from)
    return appointments.filter(a => a.date >= fromKey)
  }, [appointments, range])

  // Service duration by name, for the estimated wait time
  const durationByService = useMemo(() => {
    const map: Record<string, number> = {}
    services.forEach(s => { map[s.name] = s.duration })
    return map
  }, [services])

  // Estimated wait = people ahead in the slot (queue # - 1) × service duration
  const estimatedWait = (a: { queueNumber: number; service: string }) =>
    Math.max(a.queueNumber - 1, 0) * (durationByService[a.service] ?? 0)

  const notCancelled = useMemo(() => inRange.filter(a => a.status !== 'Cancelled'), [inRange])

  const stats = useMemo(() => {
    const total = inRange.length
    const cancelled = inRange.length - notCancelled.length
    const completed = inRange.filter(a => a.status === 'Completed').length
    const completionRate = notCancelled.length > 0 ? Math.round((completed / notCancelled.length) * 100) : 0
    const avgWait = notCancelled.length > 0
      ? Math.round(notCancelled.reduce((sum, a) => sum + estimatedWait(a), 0) / notCancelled.length)
      : 0
    return { total, cancelled, completed, completionRate, avgWait }
  }, [inRange, notCancelled, durationByService])

  const serviceDemandData = useMemo(() => {
    const counts: Record<string, number> = {}
    notCancelled.forEach(a => { counts[a.service] = (counts[a.service] || 0) + 1 })
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
  }, [notCancelled])

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {}
    inRange.forEach(a => { counts[a.status] = (counts[a.status] || 0) + 1 })
    return Object.keys(STATUS_COLORS)
      .map(name => ({ name, value: counts[name] || 0, color: STATUS_COLORS[name] }))
      .filter(d => d.value > 0)
  }, [inRange])

  // Group by hour so 9:00, 9:15 and 9:30 count together as "9 AM"
  const peakHoursData = useMemo(() => {
    const counts: Record<number, number> = {}
    notCancelled.forEach(a => {
      const hour = Number(a.time.split(':')[0])
      if (!Number.isNaN(hour)) counts[hour] = (counts[hour] || 0) + 1
    })
    return Object.entries(counts)
      .map(([hour, count]) => ({ hour: Number(hour), count }))
      .sort((a, b) => a.hour - b.hour)
      .map(({ hour, count }) => ({ time: formatDisplayTime(`${hour}:00`).replace(':00', ''), count }))
  }, [notCancelled])

  const waitTimeData = useMemo(() => {
    const byDate: Record<string, { total: number; count: number }> = {}
    notCancelled.forEach(a => {
      if (!byDate[a.date]) byDate[a.date] = { total: 0, count: 0 }
      byDate[a.date].total += estimatedWait(a)
      byDate[a.date].count++
    })
    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, d]) => ({ date: formatDisplayDate(date).replace(/, \d{4}$/, ''), waitTime: Math.round(d.total / d.count) }))
  }, [notCancelled, durationByService])

  const hasData = inRange.length > 0

  return (
    <div className="manage-reports">
      <div className="reports-toolbar">
        <span>Showing: <strong>{RANGE_LABEL[range]}</strong></span>
        <div className="range-buttons" role="group" aria-label="Date range">
          {(Object.keys(RANGE_LABEL) as Range[]).map(r => (
            <button
              key={r}
              className={`range-btn ${range === r ? 'active' : ''}`}
              onClick={() => setRange(r)}
              aria-pressed={range === r}
            >
              {r === 'all' ? 'All' : `${r}d`}
            </button>
          ))}
        </div>
      </div>

      <div className="stats-grid stagger">
        <div className="stat-card">
          <div className="stat-header"><span>Total Appointments</span><FiBarChart2 className="stat-icon" style={{ color: '#2f6f73' }}/></div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-hint">{stats.cancelled} cancelled</div>
        </div>
        <div className="stat-card">
          <div className="stat-header"><span>Completed</span><FiCheckCircle className="stat-icon" style={{ color: '#2f6f73' }}/></div>
          <div className="stat-value">{stats.completed}</div>
        </div>
        <div className="stat-card">
          <div className="stat-header"><span>Completion Rate</span><FiPercent className="stat-icon" style={{ color: '#2f6f73' }}/></div>
          <div className="stat-value">{stats.completionRate}%</div>
          <div className="stat-hint">Excludes cancelled</div>
        </div>
        <div className="stat-card">
          <div className="stat-header"><span>Avg Estimated Wait</span><FiClock className="stat-icon" style={{ color: '#2f6f73' }}/></div>
          <div className="stat-value">{stats.avgWait} min</div>
          <div className="stat-hint">People ahead × service duration</div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-container wide">
          <div className="chart-header"><div><h3>Wait Time Report</h3><p>Average estimated wait per day (people ahead × service duration)</p></div></div>
          <div className="chart-content">
            {hasData && waitTimeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={waitTimeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} label={{ value: 'min', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value) => [`${value} min`, 'Avg estimated wait']} />
                  <Line type="monotone" dataKey="waitTime" stroke="#3f8f95" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <div className="no-data">No wait time data for this period</div>}
          </div>
        </div>

        <div className="chart-container">
          <div className="chart-header"><div><h3>Service Demand</h3><p>Bookings per service (excludes cancelled)</p></div></div>
          <div className="chart-content">
            {hasData && serviceDemandData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={serviceDemandData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Bookings" fill="#3f8f95" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="no-data">No service data for this period</div>}
          </div>
        </div>

        <div className="chart-container">
          <div className="chart-header"><div><h3>Status Breakdown</h3><p>Distribution by status</p></div></div>
          <div className="chart-content">
            {hasData && statusData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                      {statusData.map(entry => <Cell key={entry.name} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="legend">
                  {statusData.map(item => (
                    <div key={item.name} className="legend-item">
                      <span className="legend-color" style={{ backgroundColor: item.color }}></span>
                      <span className="legend-label">{item.name} ({item.value})</span>
                    </div>
                  ))}
                </div>
              </>
            ) : <div className="no-data">No status data for this period</div>}
          </div>
        </div>

        <div className="chart-container wide">
          <div className="chart-header"><div><h3>Peak Hours Distribution</h3><p>Appointments per hour of the day (excludes cancelled)</p></div></div>
          <div className="chart-content">
            {hasData && peakHoursData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={peakHoursData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="Appointments" fill="#1ABC9C" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="no-data">No peak hours data for this period</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ManageReports
