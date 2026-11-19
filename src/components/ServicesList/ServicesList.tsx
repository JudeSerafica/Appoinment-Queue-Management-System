import { useState } from 'react'
import { FaClipboardList } from 'react-icons/fa'
import './ServicesList.css'
import { Service } from '../../contexts/ServicesContext'

interface ServicesListProps {
  services: Service[]
  onSelectService: (service: Service) => void
}

function ServicesList({ services, onSelectService }: ServicesListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedServiceFilter, setSelectedServiceFilter] = useState('all')

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = selectedServiceFilter === 'all' || service.name === selectedServiceFilter
    return matchesSearch && matchesFilter
  })

  return (
    <div className="services-list">
      <header className="services-header">
        <h1>Services</h1>
        <p>Choose a service to book your appointment</p>
      </header>

      <div className="services-filter-bar">
        <select 
          value={selectedServiceFilter}
          onChange={(e) => setSelectedServiceFilter(e.target.value)}
          className="service-filter-dropdown"
        >
          <option value="all">All Services</option>
          {[...new Set(services.map(s => s.name))].map(serviceName => (
            <option key={serviceName} value={serviceName}>
              {serviceName}
            </option>
          ))}
        </select>
      </div>

      <div className="services-content">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="services-grid stagger">
          {filteredServices.length === 0 ? (
            <div className="no-services">
              <FaClipboardList className="empty-icon" style={{ color: '#2f6f73' }} />
              {services.length === 0 ? (
                <>
                  <p>No services available</p>
                  <p className="empty-subtext">Services will be available soon</p>
                </>
              ) : (
                <>
                  <p>No services match your search</p>
                  <button
                    className="clear-search-btn"
                    onClick={() => { setSearchTerm(''); setSelectedServiceFilter('all') }}
                  >
                    Clear search
                  </button>
                </>
              )}
            </div>
          ) : (
            filteredServices.map(service => (
              <div key={service.id} className="service-card">
                <h3>{service.name}</h3>
                {service.description && <p className="service-description">{service.description}</p>}
                <p className="service-duration">{service.duration} minutes per person</p>
                <button
                  className="book-now-btn"
                  onClick={() => onSelectService(service)}
                >
                  Book Now →
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default ServicesList
