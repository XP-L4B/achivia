import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/theme-mockup.css'
import './styles/desktop.css'
import './styles/terminal.css'
import './styles/buttons.css'
import './styles/motion.css'
import './styles/sfondi.css'
import './styles/arena.css'
import './styles/lexora.css'
import App from './App.jsx'
import { sorvegliaIPezzi } from './lib/pezziMancanti'

// Prima di disegnare: se un pezzo caricato a parte non c'e' piu' sul
// server — succede a chi ha l'app aperta mentre pubblichiamo — l'app se ne
// accorge e va a prendere la versione nuova invece di rompersi.
sorvegliaIPezzi()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
