import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './main.css'
import CatalogApp from './CatalogApp'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CatalogApp />
  </StrictMode>,
)
