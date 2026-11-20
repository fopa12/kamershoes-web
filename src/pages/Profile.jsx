import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/auth');
      return;
    }
    
    const fetchOrderHistory = async () => {
      try {
        const response = await fetch('https://kamershoes-api-8ag6.vercel.app/orders/history', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error("Échec de la récupération de l'historique.");
        const data = await response.json();
        setOrders(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderHistory();
  }, [token]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Livré': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case "Expédié - En cours de livraison": return 'bg-blue-50 text-blue-700 border-blue-200';
      case "Payé - En préparation à l'Atelier": return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-zinc-50 text-zinc-600 border-zinc-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 font-sans">
      <div className="mb-8">
        <h2 className="text-2xl font-light tracking-tight text-zinc-900">Mon Espace Client</h2>
        <p className="text-xs text-zinc-500 font-light mt-1">Suivez vos confections artisanales en route vers le Canada.</p>
      </div>

      {loading && <p className="text-zinc-400 text-sm animate-pulse">Chargement de vos colis...</p>}
      {error && <div className="p-4 bg-red-50 text-red-600 text-sm rounded-md">⚠️ {error}</div>}

      {!loading && !error && orders.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-zinc-100 p-8 shadow-sm">
          <p className="text-sm text-zinc-500 font-light">Vous n'avez pas encore passé de commande.</p>
        </div>
      )}

      <div className="space-y-6">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-xl border border-zinc-100 shadow-sm overflow-hidden">
            {/* Top Bar de la Commande */}
            <div className="bg-zinc-50 px-6 py-4 border-b border-zinc-100 flex flex-wrap justify-between items-center gap-4">
              <div className="flex space-x-6 text-xs text-zinc-500 font-light">
                <div><span className="block uppercase tracking-wider text-[10px] font-bold text-zinc-400">Date</span> {new Date(order.created_at).toLocaleDateString('fr-CA')}</div>
                <div><span className="block uppercase tracking-wider text-[10px] font-bold text-zinc-400">Total</span> <strong className="text-zinc-900 font-medium">{order.total_amount.toFixed(2)} $</strong></div>
                <div><span className="block uppercase tracking-wider text-[10px] font-bold text-zinc-400">N° Suivi</span> <span className="font-mono text-zinc-900">{order.tracking_number || "Génération en cours"}</span></div>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full border ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
            </div>

            {/* Corps du suivi de commande */}
            <div className="p-6">
              <p className="text-xs text-zinc-400 font-light mb-4">📍 Destination : <span className="text-zinc-700 font-normal">{order.shipping_address} ({order.province_code})</span></p>
              
              {/* Infographie simplifiée de livraison */}
              <div className="relative flex justify-between items-center max-w-md mx-auto py-4">
                <div className="absolute h-0.5 bg-zinc-200 left-0 right-0 top-1/2 -translate-y-1/2 z-0" />
                <div className={`w-3 h-3 rounded-full z-10 ${order.status !== 'En attente de paiement' ? 'bg-amber-600' : 'bg-zinc-300'}`} title="Préparation" />
                <div className={`w-3 h-3 rounded-full z-10 ${order.status === 'Expédié - En cours de livraison' || order.status === 'Livré' ? 'bg-blue-600' : 'bg-zinc-300'}`} title="Transit" />
                <div className={`w-3 h-3 rounded-full z-10 ${order.status === 'Livré' ? 'bg-emerald-600' : 'bg-zinc-300'}`} title="Livré" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
