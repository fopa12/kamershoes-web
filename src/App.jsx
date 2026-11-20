// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Catalog from './pages/Catalog'; 
import Checkout from './pages/Checkout'; 
import Dashboard from './pages/Dashboard'; 
import Profile from './pages/Profile'; 
import CartDrawer from './components/CartDrawer'; 
import { useCart } from './context/CartContext';

// 🌟 Enterprise Sticky Navigation Layout avec accents canadiens épurés et commutateur manuel Dark Mode
function Navbar({ onCartOpen, isDark, onToggleDark }) {
  const { getItemsCount } = useCart();

  return (
    /* ✅ dark:bg-stone-900/80 s'active instantanément au clic sur l'interrupteur lune */
    <nav className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border-b border-zinc-200/50 dark:border-stone-800 sticky top-0 z-50 font-sans transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Typographie de marque de prestige aux couleurs nationales */}
        <Link to="/" className="text-xl font-medium tracking-tight text-zinc-950 dark:text-stone-100 font-serif italic group uppercase">
         KAMERSHOES CANADA <span className="text-red-600 dark:text-red-500 font-sans not-italic text-xs tracking-widest uppercase ml-1 transition-colors group-hover:text-zinc-950 dark:group-hover:text-white">🍁</span>
        </Link>

        {/* Liens de navigation globaux épurés et nocturnes */}
        <div className="flex items-center space-x-6 text-xs uppercase tracking-wider font-medium text-zinc-500 dark:text-stone-400">
          <Link to="/" className="hover:text-red-600 dark:hover:text-red-400 transition-colors">Accueil</Link>
          <Link to="/catalog" className="hover:text-red-600 dark:hover:text-red-400 transition-colors">Boutique</Link> 
          <Link to="/auth" className="hover:text-red-600 dark:hover:text-red-400 transition-colors">Mon Compte</Link>
          <Link to="/profile" className="hover:text-red-600 dark:hover:text-red-400 transition-colors text-zinc-900 dark:text-stone-200">Suivi Colis</Link> 
          <Link to="/admin-dashboard" className="text-zinc-400 dark:text-stone-500 hover:text-red-600 dark:hover:text-red-400 transition-colors text-[10px] bg-zinc-50 dark:bg-stone-800 px-2.5 py-1 rounded border border-zinc-200/60 dark:border-stone-700 font-bold">Gestion</Link> 
          
          {/* ⚡ LE COMMUTATEUR MANUEL DE MODE SOMBRE (Interrupteur Physique) */}
          <button
            type="button"
            onClick={onToggleDark}
            className="bg-zinc-50 dark:bg-stone-800 hover:bg-zinc-100 dark:hover:bg-stone-700 border border-zinc-200/60 dark:border-stone-700 p-2 rounded-full cursor-pointer text-sm transition-all active:scale-95 flex items-center justify-center shadow-sm"
            title={isDark ? "Passer à l'ambiance claire" : "Passer à l'ambiance sombre"}
          >
            {isDark ? '☀️' : '🌙'}
          </button>

          {/* Déclencheur du tiroir du panier */}
          <button 
            type="button"
            onClick={onCartOpen} 
            className="relative bg-zinc-50 dark:bg-stone-800 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 text-zinc-900 dark:text-stone-100 p-2.5 rounded-full transition-all cursor-pointer border border-zinc-200/40 dark:border-stone-700"
          >
            👜
            {getItemsCount() > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 dark:bg-red-500 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full animate-pulse shadow-sm">
                {getItemsCount()}
              </span>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
// 🎬 Master Orchestrator Component (Partie 2/3)
export default function App() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // 🧠 Initialisation intelligente : Extrait le choix historique de l'acheteur stocké dans le navigateur
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });
  
  const navigate = useNavigate();

  // ⚡ Effet d'injection globale : Aligne la classe .dark de <html> sur l'état du bouton poussoir
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const handleToggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    navigate('/checkout'); 
  };
  // 🎬 Rendu principal des briques de l'application (Partie 3/3)
  return (
    /* bg-transparent délègue la couleur au fichier index.css qui applique var(--bg) de lin ou d'encre */
    <div className="min-h-screen bg-transparent flex flex-col justify-between transition-all duration-300">
      
      {/* Liaison des états tactiles et du commutateur avec la barre supérieure */}
      <Navbar 
        onCartOpen={() => setIsCartOpen(true)} 
        isDark={darkMode}
        onToggleDark={handleToggleDarkMode}
      />
      
      {/* 🗺️ Cartographie des routes dynamiques de la plateforme */}
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalog" element={<Catalog onCartOpen={() => setIsCartOpen(true)} />} /> 
          <Route path="/checkout" element={<Checkout />} /> 
          <Route path="/profile" element={<Profile />} /> 
          <Route path="/admin-dashboard" element={<Dashboard />} /> 
          <Route path="/auth" element={<Auth />} />
        </Routes>
      </main>

      {/* 👜 Intégration du composant Tiroir de Panier de niveau entreprise */}
      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        onProceedToCheckout={handleProceedToCheckout}
      />

      {/* 📋 Minimalist Luxury Branding Footer avec Ligne de Code Signature Intégrée */}
      <footer className="bg-zinc-950 dark:bg-stone-950 text-zinc-500 dark:text-stone-500 py-10 text-center text-[11px] font-light tracking-wide border-t border-zinc-900 dark:border-stone-900 uppercase">
        <div className="space-y-2">
          <p>© 2026 kamershoes-Canada. Tous droits réservés. Confection artisanale de luxe.</p>
          {/* Bloc d'ingénierie logicielle parfaitement centré en dessous */}
          <p className="text-[10px] tracking-[0.15em] text-zinc-600 dark:text-stone-600 font-medium normal-case">
            Dev by <span className="text-zinc-400 dark:text-stone-300 font-bold">FM.jordan</span> <span className="text-red-600 dark:text-red-500 font-semibold uppercase">TECH</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
