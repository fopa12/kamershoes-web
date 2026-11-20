// frontend/src/components/CartDrawer.jsx
import React from 'react';
import { useCart } from '../context/CartContext';

export default function CartDrawer({ isOpen, onClose, onProceedToCheckout }) {
  const { cartItems, updateQuantity, removeFromCart, getSubtotal } = useCart();

  return (
    <div className={`fixed inset-0 z-50 overflow-hidden font-sans transition-all duration-300 ${isOpen ? 'visible' : 'invisible'}`}>
      {/* 🌑 Ombre d'arrière-plan avec fermeture au clic */}
      <div 
        className={`absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        {/* 📋 Corps du tiroir coulissant avec animation de glissement */}
        <div className={`w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between h-full border-l border-zinc-100 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          
          {/* 🏷️ En-tête du Panier */}
          <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
            <h3 className="text-lg font-medium text-zinc-900 flex items-center gap-2">
              👜 Votre Panier
            </h3>
            <button 
              type="button"
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-900 text-sm p-2 transition-colors cursor-pointer"
            >
              Fermer ✕
            </button>
          </div>

          {/* 📦 Liste des articles ajoutés */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {cartItems.length === 0 ? (
              <div className="text-center py-20 text-zinc-400 font-light text-sm">
                Votre panier est vide pour le moment. <br />
                <span className="text-xs text-zinc-400 block mt-2">Visitez la boutique pour y ajouter vos coups de cœur !</span>
              </div>
            ) : (
              cartItems.map((item) => (
                <div key={item.variant_id} className="flex items-center space-x-4 border-b border-zinc-100 pb-4">
                  {/* Photo miniature du produit */}
                  <img 
                    src={item.image_url} 
                    alt={item.name} 
                    className="w-20 h-16 object-cover rounded-md bg-zinc-50 border border-zinc-200"
                  />
                  
                  {/* Détails de la ligne */}
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-zinc-900 line-clamp-1">{item.name}</h4>
                    <p className="text-[11px] text-amber-700 font-medium mt-0.5 uppercase tracking-wider">
                      {item.category === 'sacs' ? `Couleur: ${item.color}` : `Pointure: ${item.size}`}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      {/* Sélecteur de quantité pro */}
                      <div className="flex items-center border border-zinc-200 rounded-md bg-slate-50 overflow-hidden">
                        <button 
                          type="button"
                          onClick={() => updateQuantity(item.variant_id, item.quantity - 1)}
                          className="px-2.5 py-1 text-zinc-500 hover:bg-zinc-900 hover:bg-zinc-200/50 transition-colors cursor-pointer"
                        >
                          -
                        </button>
                        <span className="px-2 text-xs font-semibold text-zinc-800">{item.quantity}</span>
                        <button 
                          type="button"
                          onClick={() => updateQuantity(item.variant_id, item.quantity + 1)}
                          className="px-2.5 py-1 text-zinc-500 hover:bg-zinc-900 hover:bg-zinc-200/50 transition-colors cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                      {/* Prix de la ligne */}
                      <span className="text-sm font-semibold text-zinc-900">
                        {(item.price_cad * item.quantity).toFixed(2)} $
                      </span>
                    </div>
                  </div>
                  
                  {/* Bouton de suppression */}
                  <button 
                    type="button"
                    onClick={() => removeFromCart(item.variant_id)}
                    className="text-zinc-400 hover:text-red-600 transition-colors p-2 text-sm cursor-pointer"
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>

          {/* 💸 Pied de page fixe : Calculs et bouton Caisse */}
          {cartItems.length > 0 && (
            <div className="p-6 border-t border-zinc-100 bg-zinc-50">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-zinc-500 font-light">Sous-total (Hors taxes)</span>
                <span className="text-lg font-bold text-zinc-900">{getSubtotal().toFixed(2)} CAD</span>
              </div>
              <p className="text-[11px] text-zinc-400 font-light mb-6">
                Les taxes provinciales canadiennes et les frais de livraison seront calculés lors de l'étape de validation.
              </p>
              <button 
                type="button"
                onClick={onProceedToCheckout}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-3.5 rounded-md transition-colors shadow-md hover:shadow-lg text-sm text-center cursor-pointer"
              >
                Passer à la Caisse
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
