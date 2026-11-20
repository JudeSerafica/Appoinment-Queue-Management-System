import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { ServicesProvider } from './contexts/ServicesContext'
import { SlotsProvider } from './contexts/SlotsContext'
import { AppointmentsProvider } from './contexts/AppointmentsContext'
import { ToastProvider } from './contexts/ToastContext'
import { ConfirmProvider } from './contexts/ConfirmContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ToastProvider>
    <ConfirmProvider>
    <ServicesProvider>
      <SlotsProvider>
        <AppointmentsProvider>
          <App />
        </AppointmentsProvider>
      </SlotsProvider>
    </ServicesProvider>
    </ConfirmProvider>
    </ToastProvider>
  </React.StrictMode>,
)
