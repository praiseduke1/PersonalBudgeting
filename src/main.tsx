import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './context/AuthContext.tsx'
import { initTheme } from './lib/theme'
import ErrorBoundary from './components/common/ErrorBoundary'
import OfflineBanner from './components/common/OfflineBanner'

initTheme()

function renderApp() {
  try {
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <BrowserRouter>
          <ErrorBoundary>
            <AuthProvider>
              <OfflineBanner />
              <App />
              <Toaster position="top-right" toastOptions={{
                duration: 3000,
                style: { background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }
              }} />
            </AuthProvider>
          </ErrorBoundary>
        </BrowserRouter>
      </React.StrictMode>,
    )
    window.__appLoaded = true
  } catch (e) {
    const msg = e instanceof Error ? e.message + '\n' + e.stack : String(e)
    sessionStorage.setItem('__app_err', msg)
    console.error('FATAL:', e)
  }
}

renderApp()
