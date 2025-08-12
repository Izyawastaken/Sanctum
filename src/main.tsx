import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import RootTheme from './root/RootTheme'

// Register service worker for blazing fast performance (only in production)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Get the base URL from Vite's import.meta.env
    const base = import.meta.env.BASE_URL || '/';
    const swPath = `${base}sw.js`.replace('//', '/');
    
    navigator.serviceWorker.register(swPath)
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Lazy load components for code splitting
const Builder = lazy(() => import('./pages/Builder'))
const Viewer = lazy(() => import('./pages/Viewer'))

// Performance monitoring
if (typeof performance !== 'undefined') {
  performance.mark('app-start');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RootTheme>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <Suspense fallback={
                      <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100vh',
              fontSize: '1.2rem',
              color: 'var(--accent, #ff7a00)'
            }}>
              Loading Sanctum...
            </div>
        }>
          <Routes>
            <Route path="/" element={<Builder />} />
            <Route path="/view/:id" element={<Viewer />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </RootTheme>
  </React.StrictMode>,
)

// Performance measurement
if (typeof performance !== 'undefined') {
  performance.mark('app-loaded');
  performance.measure('app-load-time', 'app-start', 'app-loaded');
} 