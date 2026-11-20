// frontend/src/pages/Catalog.jsx - Partie 1 de 2
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { API_URL } from '../config';

export default function Catalog() { 
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selections, setSelections] = useState({});
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true); setError('');
        let url = `${API_URL}/products/?category=${activeCategory}`;
        if (searchQuery.trim() !== '') {
          url += `&search=${encodeURIComponent(searchQuery)}`;
        }
        const response = await fetch(url);
        if (!response.ok) throw new Error("Erreur de chargement de l'inventaire.");
        const data = await response.json();
        setProducts(data);
        
        const defaultSelections = {};
        data.forEach(p => {
          if (p.variants && p.variants.length > 0) {
            defaultSelections[p.id] = p.variants[0];
          }
        });
        setSelections(defaultSelections);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => { fetchProducts(); }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [activeCategory, searchQuery]);

  const handleVariantChange = (productId, variant) => {
    setSelections(prev => ({ ...prev, [productId]: variant }));
  };

  const handleAddClick = (product) => {
    const selectedVariant = selections[product.id];
    if (!selectedVariant) return;
    if (selectedVariant.stock <= 0) {
      alert("❌ Cet article est temporairement en rupture de stock au Canada.");
      return;
    }
    addToCart(product, selectedVariant.id, selectedVariant.size, selectedVariant.color, 1);
    alert(`Bag👜 ${product.name} ajouté au panier d'achat canadien.`);
    navigate('/checkout'); 
  };
  // frontend/src/pages/Catalog.jsx - Partie 2 de 2
  return (
    <div className="max-w-7xl mx-auto px-6 py-16 font-sans">
      <div className="text-center max-w-xl mx-auto mb-16">
        <span className="text-red-700 text-[10px] font-bold uppercase tracking-wider bg-red-50 px-3 py-1 rounded-full">
          Prestige & Haute Maroquinerie 🍁
        </span>
        <h2 className="text-3xl font-serif italic text-zinc-950 mt-4">La Boutique de l'Atelier</h2>
      </div>

      <div className="flex justify-center space-x-6 mb-8 border-b pb-3">
        {[
          { id: 'all', label: 'Tout voir' },
          { id: 'chaussures', label: 'Mocassins' },
          { id: 'babouches', label: 'Babouches' },
          { id: 'sacs', label: 'Sacs de Luxe' }
        ].map((tab) => (
          <button key={tab.id} type="button" onClick={() => { setActiveCategory(tab.id); setSearchQuery(''); }}
            className={`text-xs uppercase px-3 py-2 border-b-2 ${activeCategory === tab.id ? 'border-red-600 text-red-700 font-bold' : 'border-transparent text-zinc-400'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="max-w-md mx-auto mb-16 relative">
        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Rechercher un modèle... 🍁" className="w-full border rounded-xl pl-10 pr-4 py-3 text-xs" />
      </div>

      {loading && <div className="text-center py-12 text-xs uppercase text-zinc-400">Inventaire en cours...</div>}
      {error && <div className="text-center py-6 text-sm text-red-600 bg-red-50 rounded-xl">⚠️ {error}</div>}

      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {products.map((product) => {
            const currentSelection = selections[product.id];
            return (
              <div key={product.id} className="flex flex-col justify-between border p-4 rounded-xl bg-white shadow-xs">
                <div className="relative aspect-[4/3] bg-zinc-50 flex items-center justify-center p-4 border-b">
                  <img src={product.image_url} alt={product.name} className="h-full w-full object-contain" />
                  <span className="absolute top-2 right-2 bg-zinc-950 text-white text-[10px] px-2 py-0.5 rounded font-mono">
                    {product.price_cad.toFixed(2)} CAD
                  </span>
                </div>
                <div className="pt-4 flex-grow flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-zinc-900">{product.name}</h3>
                    <p className="text-xs text-zinc-400 line-clamp-2 mt-1">{product.description}</p>
                  </div>
                  <div className="space-y-3">
                    {product.variants && (
                      <div className="flex flex-wrap gap-1">
                        {product.variants.map((v) => (
                          <button key={v.id} type="button" onClick={() => handleVariantChange(product.id, v)}
                            className={`text-[9px] px-2 py-0.5 border rounded ${currentSelection?.id === v.id ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-500'}`}>
                            T{v.size} ({v.stock}u)
                          </button>
                        ))}
                      </div>
                    )}
                    <button type="button" onClick={() => handleAddClick(product)} disabled={!currentSelection || currentSelection.stock <= 0}
                      className="w-full bg-zinc-950 text-white text-[10px] font-bold uppercase py-3 rounded-lg disabled:bg-zinc-100 disabled:text-zinc-400">
                      {!currentSelection || currentSelection.stock <= 0 ? "Rupture" : "Commander l'article 🍁"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
