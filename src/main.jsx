// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
// Importa el componente principal de tu aplicación
import App from './App.jsx'
// Importa los estilos globales
import './index.css'

// Renderiza la aplicación React dentro del <div id="root"> en tu index.html
ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)