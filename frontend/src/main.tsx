import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import L from 'leaflet'
import './index.css'
import App from './App.tsx'

// Ensure Leaflet is globally available for Leaflet plugins (e.g., leaflet.heat)
if (typeof window !== 'undefined') {
  (window as any).L = L;
}


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
