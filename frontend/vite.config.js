import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// CampusCare frontend — React + Vite.
// Backend runs separately at http://localhost:5000 (npm start in backend/).
// To point at a deployed backend, set VITE_API_URL in a .env file.
export default defineConfig({
  plugins: [react()],
})
