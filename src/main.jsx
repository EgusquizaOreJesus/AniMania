import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'; // Your global styles
import '@fortawesome/fontawesome-free/css/all.min.css'; // Font Awesome
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
