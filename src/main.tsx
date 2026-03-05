import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/App'
import { setupGlobalErrorTracking } from './shared/observability/errorTracking'
import './styles/global.css'

setupGlobalErrorTracking()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
