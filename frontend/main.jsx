import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { UserProvider } from './contexts/UserContext.jsx'
import { DataProvider } from './contexts/DataContext.jsx'

if (typeof document !== 'undefined') {
  const classList = document.body.classList;
  if (!classList.contains('theme-holo')) {
    classList.add('theme-holo');
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <UserProvider>
      <DataProvider>
        <App />
      </DataProvider>
    </UserProvider>
  </StrictMode>,
)
