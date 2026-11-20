import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom'; // 🧭 Importation du gestionnaire de navigation
import App from './App.jsx';
import './index.css'; // Les styles CSS de base de Vite
import { CartProvider } from './context/CartContext.jsx';

// 🎨 SÉCURITÉ GRAPHIQUE ÉLÉGANTE : Injection forcée des couleurs lin/crème
// Évite les flashs blancs du navigateur au rechargement de la page.
if (typeof document !== 'undefined') {
  document.documentElement.style.backgroundColor = '#f5f3eb'; // Applique var(--bg) sur <html>
  document.body.style.backgroundColor = '#f5f3eb';          // Applique var(--bg) sur <body>
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CartProvider>
      <Router> {/* 🔌 Le routeur englobe l'application pour activer les redirections fluides */}
        <App />
      </Router>
    </CartProvider>
  </React.StrictMode>,
);
