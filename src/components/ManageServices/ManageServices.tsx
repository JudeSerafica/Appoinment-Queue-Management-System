import { useState } from 'react'
import { FaTrash } from "react-icons/fa";
import { MdEdit } from "react-icons/md";
import AddServiceModal from '../AddServiceModal/AddServiceModal'
import EditServiceModal from '../EditServiceModal/EditServiceModal'
import './ManageServices.css'
import { useServices, Service } from '../../contexts/ServicesContext'
import { useToast } from '../../contexts/ToastContext'
import { useConfirm } from '../../contexts/ConfirmContext'

function ManageServices() {
  const { services, refreshServices, updateService, deleteService } = useServices()
  const { showToast } = useToast()
  const confirm = useConfirm()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)

  const handleAddService = () => {
    refreshServices()   // reload so the new service shows its real id and status
    setIsModalOpen(false)
  }

  const handleDeleteService = async (id: number) => {
    const service = services.find(s => s.id === id)
    if (!await confirm(`Delete "${service?.name ?? 'this service'}"? It will no longer be available for booking.`, { title: 'Delete service', confirmText: 'Delete', danger: true })) return
    const res = await deleteService(id)
    if (res.success) showToast('Service deleted', 'success')
    else showToast(`Failed to delete service: ${res.message}`, 'error')
  }

  // Save the new status to the server (updateService updates the list on success)
  const handleToggleStatus = async (id: number) => {
    const service = services.find(s => s.id === id)
    if (!service) return
    const success = await updateService({
      ...service,
      status: service.status === 'Active' ? 'Inactive' : 'Active',
    })
    if (!success) showToast('Failed to update service status. Please try again.', 'error')
  }

  const handleEditService = async (service: Service) => {
      const success = await updateService(service)
      if (success) {
        setIsEditModalOpen(false)
        setSelectedService(null)
      } else {
        showToast('Failed to update service. Please try again.', 'error')
      }
    }
  const openEditModal = (service: Service) => {
    setSelectedService(service)
    setIsEditModalOpen(true)
  }

  return (
    <div className="manage-services">
      <div className="manage-services-header">
        <h2>All Services</h2>
        <button className="btn-add-service" onClick={() => setIsModalOpen(true)}>
          + Add Service
        </button>
      </div>

      <div className="services-table-container">
        <table className="services-table">
          <thead>
            <tr>
              <th>Service</th>
              <th>Duration (min)</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.map(service => (
              <tr key={service.id}>
                <td>{service.name}</td>
                <td>{service.duration}</td>
                <td>
                  <button
                    className={`status-badge status-${service.status.toLowerCase()}`}
                    onClick={() => handleToggleStatus(service.id)}
                    title="Click to toggle status"
                    style={{ cursor: 'pointer', border: 'none', background: 'none', font: 'inherit' }}
                  >
                    {service.status}
                  </button>
                </td>
                <td className="actions-cell">
                  <button
                    className="btn-action btn-toggle"
                    onClick={() => openEditModal(service)}
                    title="Edit Service"
                  >
                    <MdEdit color="gray" />
                  </button>
                  <button
                    className="btn-action btn-delete"
                    onClick={() => handleDeleteService(service.id)}
                    title="Delete Service"
                  >
                    <FaTrash color="red" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {services.length === 0 && (
          <div className="empty-state">
            <p>No services yet. Click "Add Service" to create one.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <AddServiceModal
          onClose={() => setIsModalOpen(false)}
          onAddService={handleAddService}
        />
      )}

      {isEditModalOpen && selectedService && (
        <EditServiceModal
          service={selectedService}
          onClose={() => {
            setIsEditModalOpen(false)
            setSelectedService(null)
          }}
          onUpdateService={handleEditService}
        />
      )}
    </div>
  )
}

export default ManageServices
