import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'

const App = lazy(() => import('./App.jsx'))

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-background"><div className="w-8 h-8 rounded-full border-2 border-outline-variant/30 border-t-primary animate-spin" /></div>}>
        <App />
      </Suspense>
    </BrowserRouter>
  </StrictMode>,
)
