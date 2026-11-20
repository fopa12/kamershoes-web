import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import ProductSlider from '../components/ProductSlider';

// 🌾 IMPORTATION SÉCURISÉE ET CLOISONNÉE DES 6 PHOTOS DE VOTRE ORDINATEUR
import imgHero1 from '../assets/hero1.jpg';
import imgHero2 from '../assets/hero2.jpg';
import imgHero3 from '../assets/hero3.jpg';
import imgHero4 from '../assets/hero4.jpg';
import imgHero5 from '../assets/hero5.jpg';
import imgHero6 from '../assets/hero6.jpg';

export default function Home() {
  const [homeSearch, setHomeSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [currentBgIdx, setCurrentBgIdx] = useState(0); // ⚡ Indice réactif pour l'image de fond active
  const navigate = useNavigate();

  // 🖼️ Tableau étanche contenant vos 6 photos locales importées pour l'ambiance visuelle
  const backgroundImages = [imgHero1, imgHero2, imgHero3, imgHero4, imgHero5, imgHero6];

  // 🔄 ÉVOLUTION AUTOMATIQUE DU SLIDER D'ARRIÈRE-PLAN (Toutes les 5 secondes)
  useEffect(() => {
    const bgInterval = setInterval(() => {
      setCurrentBgIdx((prevIdx) => (prevIdx + 1) % backgroundImages.length);
    }, 5000);
    return () => clearInterval(bgInterval);
  }, [backgroundImages.length]);

  // ⚡ Récupération automatique des articles réels depuis l'API Cloud centralisée
  useEffect(() => {
    const fetchHomeProducts = async () => {
      try {
        const response = await fetch(`${API_URL}/products/`);
        if (response.ok) {
          const data = await response.json();
          setProducts(data);
        }
      } catch (err) {
        console.error("Impossible de charger les articles pour le défilement:", err);
      }
    };
    fetchHomeProducts();
  }, []);

  // ⚡ Gestionnaire de recherche directionnel vers la boutique
  const handleHomeSearchSubmit = (e) => {
    e.preventDefault();
    if (homeSearch.trim() === '') return;
    navigate('/catalog', { state: { initialSearch: homeSearch } });
  };

  return (
    <div className="min-h-screen font-sans flex flex-col justify-between overflow-x-hidden bg-transparent">
      
      {/* 🌟 LUXURY CANADIAN HERO SECTION WITH INTEGRATED BACKGROUND SLIDER */}
      <div className="relative flex-grow flex flex-col justify-center items-center text-center px-6 py-32 overflow-hidden min-h-[80vh]">
        
        {/* A) Les 6 Images de fond locales défilant en fondu croisé fluide (Fade Transition) */}
        {backgroundImages.map((imgUrl, idx) => (
          <div
            key={idx}
            style={{ backgroundImage: `url(${imgUrl})` }}
            className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ease-in-out scale-102 ${
              idx === currentBgIdx ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          />
        ))}

        {/* B) 🖤 LE VOILE DE SÉCURITÉ : Assure le contraste blanc des textes en mode Clair ET Sombre */}
        <div className="absolute inset-0 bg-stone-950/40 dark:bg-black/70 transition-colors duration-500 z-20" />

        {/* C) Les textes et la barre de recherche au premier plan (z-30) */}
        <div className="max-w-3xl mx-auto relative z-30 text-white">
          <span className="text-white font-medium tracking-widest text-[10px] uppercase bg-black/30 dark:bg-stone-900/60 px-4 py-1.5 rounded-full border border-white/10 dark:border-stone-800 backdrop-blur-md">
            kamershoes Canada 🍁
          </span>
          <h1 className="text-4xl md:text-6xl font-serif italic text-white mt-6 mb-6 tracking-wide drop-shadow-md">
            Maison du Mocassin & Haute Maroquinerie
          </h1>
          <p className="text-zinc-200 dark:text-stone-300 font-light max-w-lg mx-auto mb-10 text-sm md:text-base leading-relaxed drop-shadow-sm">
            Découvrez nos collections exclusives de mocassins, babouches traditionnelles et sacs de luxe confectionnés à la main avec une finesse artisanale d'exception.
          </p>

          {/* BARRE DE RECHERCHE INTEGRÉE PREMIUM (FOND REPREND LE FLOU DE LUXE) */}
          <form onSubmit={handleHomeSearchSubmit} className="max-w-md mx-auto mb-8 relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-300 text-xs">
              🔍
            </div>
            <input
              type="text"
              value={homeSearch}
              onChange={(e) => setHomeSearch(e.target.value)}
              placeholder="Que cherchez-vous à l'Atelier ? (ex: Croco, Noir...) 🍁"
              className="w-full bg-white/15 dark:bg-stone-900/40 border border-white/20 dark:border-stone-800 text-white focus:border-red-500/50 rounded-xl pl-10 pr-24 py-4 text-xs tracking-wide focus:outline-none transition-all placeholder-zinc-300 backdrop-blur-md shadow-lg group-hover:border-white/30"
            />
            <button
              type="submit"
              className="absolute right-2 top-2 bottom-2 bg-white text-zinc-950 hover:bg-red-600 hover:text-white font-bold text-[10px] uppercase tracking-wider px-5 rounded-lg transition-all cursor-pointer active:scale-98"
            >
              Trouver
            </button>
          </form>

          <Link 
            to="/catalog" 
            className="bg-white hover:bg-red-600 hover:text-white text-zinc-950 font-semibold text-xs uppercase tracking-wider px-10 py-4 rounded-xl transition-all shadow-md hover:shadow-xl active:scale-98 cursor-pointer inline-block"
          >
            Visiter la Boutique
          </Link>
        </div>
      </div>

      {/* 🧭 CARROUSEL DÉFILANT AUTOMATIQUE ET INFINI */}
      <div className="w-full py-16 border-t border-zinc-200/40 dark:border-stone-900 bg-transparent">
        <div className="text-center mb-10">
          <h3 className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-400 dark:text-stone-500">Nos Univers de Prestige</h3>
          <div className="h-[1px] w-6 bg-red-600 mx-auto mt-3"></div>
        </div>

        {/* 🔄 BANDEAU DE DÉFILEMENT : se met en pause au survol, flèches au survol, balayage tactile */}
        <ProductSlider products={products} getHref={() => '/catalog'} />
      </div>

    </div>
  );
}