// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import AppShell from './AppShell'; // Tu archivo original intacto
import './index.css'; // Tus estilos globales de Tailwind

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppShell />
  </React.StrictMode>
);