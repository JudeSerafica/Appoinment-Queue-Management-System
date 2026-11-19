// Backend API address.
// - Local development: falls back to the XAMPP backend below.
// - Vercel: set the VITE_API_BASE environment variable in the Vercel project
//   settings to your hosted backend, e.g. https://your-backend.example.com/api
const API_BASE: string =
  (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/+$/, '') ||
  'http://localhost/AppointmenManagements/api'

export default API_BASE
