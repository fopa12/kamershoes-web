// frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]); // 🧾 État réactif pour stocker le registre logistique
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // États pour le formulaire de création de produit
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceCad, setPriceCad] = useState('');
  const [category, setCategory] = useState('chaussures');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [variants, setVariants] = useState([{ size: 42, color: '', stock: 5 }]);

  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      alert("🚫 Accès refusé. Veuillez vous connecter avec votre compte Admin.");
      navigate('/auth');
      return;
    }
    fetchAdminData();
  }, [token]);

  // Extraction simultanée des stocks d'articles et du carnet logistique Postes Canada depuis PostgreSQL
  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // A) Lecture des produits du catalogue public
      const prodResponse = await fetch('https://kamershoes-api-8ag6.vercel.app/products/');
      if (!prodResponse.ok) throw new Error("Erreur de chargement de l'inventaire.");
      const prodData = await prodResponse.json();
      setProducts(prodData);

      // B) Lecture de l'historique des factures de commandes
      const orderResponse = await fetch('https://kamershoes-api-8ag6.vercel.app/payments/admin/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (orderResponse.ok) {
        const orderData = await orderResponse.json();
        setOrders(orderData);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🗑️ ACTION INDÉPENDANTE 1 : Retirer un article de la boutique (Sans détruire l'historique des ventes)
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("🗑️ Êtes-vous sûr de vouloir supprimer définitivement ce modèle du catalogue canadien ?")) return;
    try {
      const response = await fetch(`https://kamershoes-api-8ag6.vercel.app/products/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Échec de la suppression.");
      alert("✓ Modèle retiré de la vitrine avec succès.");
      fetchAdminData(); 
    } catch (err) {
      alert(`⚠️ Erreur : ${err.message}`);
    }
  };

  // 💥 ACTION INDÉPENDANTE 2 : Purge totale des tables (Uniquement pour la maintenance à zéro)
  const handlePurgeAllHistory = async () => {
    if (!window.confirm("⚠️ ATTENTION ACTION CRITIQUE : Voulez-vous supprimer l'INTÉGRALITÉ du catalogue et remettre l'Atelier a zéro ?")) return;
    try {
      const response = await fetch('https://kamershoes-api-8ag6.vercel.app/products/purge/all-history', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Échec de la purge globale.");
      alert("💥 Tout l'inventaire a été balayé. Base de données à zéro.");
      fetchAdminData();
    } catch (err) {
      alert(`⚠️ Erreur : ${err.message}`);
    }
  };
  // Synchronisation Cloud Storage : Envoi de la photo de votre chaussure/sac sur Cloudinary
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('https://kamershoes-api-8ag6.vercel.app/uploads/image', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Échec de l'envoi de l'image.");
      setImageUrl(data.image_url);
      alert('📸 Photo synchronisée avec le Cloud Cloudinary !');
    } catch (err) {
      alert(`⚠️ Erreur image : ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleAddVariant = () => {
    setVariants([...variants, { size: category === 'sacs' ? '' : 42, color: '', stock: 5 }]);
  };

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...variants];
    newVariants[index][field] = value;
    setVariants(newVariants);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const formattedVariants = variants.map(v => ({
      size: category === 'sacs' ? null : parseInt(v.size),
      color: category === 'sacs' ? v.color : null,
      stock: parseInt(v.stock)
    }));

    try {
      const response = await fetch('https://kamershoes-api-8ag6.vercel.app/products/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          name,
          description,
          price_cad: parseFloat(priceCad),
          image_url: imageUrl || 'https://unsplash.com',
          category,
          is_active: true,
          variants: formattedVariants
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Erreur de création de l'article.");

      alert('🎉 Nouvelle confection ajoutée au catalogue canadien !');
      setName(''); setDescription(''); setPriceCad(''); setImageUrl('');
      setVariants([{ size: 42, color: '', stock: 5 }]);
      fetchAdminData(); 
    } catch (err) {
      setError(err.message);
    }
  };

  // 🚚 COMPOSANT INTERNE DE LIGNE LOGISTIQUE REPARÉ ET COMPLET
  const OrderShippingRow = ({ order, token, onRefresh }) => {
    const [trackingNumber, setTrackingNumber] = useState('');

    const handleShipSubmit = async (e) => {
      e.preventDefault();
      if (!trackingNumber.trim()) return alert("Veuillez saisir un numéro de suivi Postes Canada.");

      let clientEmail = order.email;
      
      if (!clientEmail && order.shipping_address) {
        const segments = order.shipping_address.split(',');
        const extracted = segments.find(s => s.includes('@'));
        if (extracted) clientEmail = extracted.trim();
      }

      if (!clientEmail) {
        clientEmail = "fopsimella@gmail.com";
      }

      try {
        const response = await fetch(`https://kamershoes-api-8ag6.vercel.app/payments/admin/orders/${order.id}/ship`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            tracking_number: trackingNumber,
            email: clientEmail // Envoi dynamique à l'adresse de l'acheteur réel
          })
        });

        if (!response.ok) throw new Error("Échec du traitement de l'ordre d'expédition.");
        alert(`✈️ Colis ATK-00${order.id} validé ! Le numéro Postes Canada a été envoyé à : ${clientEmail}`);
        onRefresh();
      } catch (err) {
        alert(`⚠️ Erreur d'expédition : ${err.message}`);
      }
    };

    return (
      <div className="py-4 space-y-2 text-xs hover:bg-stone-50/40 px-2 rounded-xl transition-colors">
        <div className="flex justify-between items-center">
          <h4 className="font-semibold text-zinc-800">Facture #ATK-00{order.id}</h4>
          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${order.status === 'SHIPPED' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700 animate-pulse'}`}>
            {order.status === 'SHIPPED' ? 'Expédié' : 'À Préparer'}
          </span>
        </div>
        <p className="text-[10px] text-zinc-400 font-light truncate">{order.shipping_address}</p>
        <p className="font-mono text-zinc-900 font-bold">{(order.total_amount || 0).toFixed(2)} $ CAD</p>

        {order.status !== 'SHIPPED' ? (
          <form onSubmit={handleShipSubmit} className="flex gap-2 pt-1">
            <input 
              type="text" 
              required
              placeholder="Code Postes Canada" 
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              className="w-full bg-stone-50 border border-zinc-200 rounded-md px-2 py-1.5 text-[10px] focus:outline-none focus:border-red-600/30"
            />
            <button type="submit" className="bg-zinc-950 hover:bg-red-600 text-white px-3 rounded-md text-[10px] uppercase font-bold tracking-wider transition-colors cursor-pointer">OK</button>
          </form>
        ) : (
          <p className="text-[10px] font-mono text-zinc-500 bg-stone-50 p-2 rounded border border-zinc-100">
            📦 Suivi : <span className="text-red-600 font-semibold">{order.tracking_number}</span>
          </p>
        )}
      </div>
    );
  };
  return (
    <div className="max-w-[92rem] mx-auto px-4 sm:px-6 py-12 font-sans grid grid-cols-1 xl:grid-cols-4 gap-8">
      
      {/* 🛠️ PANNEAU A : LE FORMULAIRE DE CRÉATION (À gauche) */}
      <div className="xl:col-span-1 bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm h-fit">
        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900 border-b border-zinc-100 pb-3 mb-4">⚒️ Ajouter une confection</h3>
        <form onSubmit={handleProductSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Nom du modèle</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full bg-stone-50/50 border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-red-600/30" placeholder="Mocassin Croco Noir" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Description</label>
            <textarea required value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-stone-50/50 border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-red-600/30 h-16" placeholder="Détails du cuir et finitions..." />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Prix (CAD)</label>
              <input type="number" step="0.01" required value={priceCad} onChange={e => setPriceCad(e.target.value)} className="w-full bg-stone-50/50 border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-red-600/30" placeholder="240.00" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Catégorie</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-stone-50/50 border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-red-600/30">
                <option value="chaussures">Mocassin</option>
                <option value="babouches">Babouche</option>
                <option value="sacs">Sac de Luxe</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Photo de la pièce</label>
            <input type="file" onChange={handleImageUpload} className="w-full text-[10px] text-zinc-400" />
          </div>
          <div className="pt-2">
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] font-bold uppercase text-zinc-400">Variantes & Stocks</label>
              <button type="button" onClick={handleAddVariant} className="text-[10px] text-red-600 font-bold hover:underline">+ Nouvelle variante</button>
            </div>
            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
              {variants.map((v, index) => (
                <div key={index} className="grid grid-cols-2 gap-2 bg-stone-50/50 p-2 rounded-xl border border-zinc-100">
                  <input type="text" required value={category === 'sacs' ? v.color : v.size} onChange={e => handleVariantChange(index, category === 'sacs' ? 'color' : 'size', e.target.value)} className="bg-white border border-zinc-200 rounded-md px-2 py-1 text-[11px]" placeholder={category === 'sacs' ? "Noir" : "42"} />
                  <input type="number" required value={v.stock} onChange={e => handleVariantChange(index, 'stock', e.target.value)} className="bg-white border border-zinc-200 rounded-md px-2 py-1 text-[11px]" placeholder="5" />
                </div>
              ))}
            </div>
          </div>
          <button type="submit" disabled={uploading} className="w-full bg-zinc-950 hover:bg-red-600 text-white font-medium py-3 rounded-xl text-xs uppercase tracking-wider transition-all duration-300 shadow-sm cursor-pointer mt-2">Enregistrer la pièce</button>
        </form>
      </div>

      {/* 📦 PANNEAU B : LE CATALOGUE CENTRAL DES CRÉATIONS (Au centre) */}
      <div className="xl:col-span-2 bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm h-fit">
        <div className="border-b border-zinc-100 pb-3 mb-4 flex justify-between items-center">
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900">📦 Catalogue des Souliers & Sacs</h3>
          <button onClick={handlePurgeAllHistory} className="text-[9px] bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-100 px-2.5 py-1 rounded-md uppercase tracking-wider font-bold transition-all duration-300">💥 Purger Tout</button>
        </div>
        
        {loading ? (
          <div className="text-center py-12 text-xs tracking-widest text-zinc-400 uppercase animate-pulse">Extraction de l'inventaire...</div>
        ) : (
          <div className="divide-y divide-zinc-100 max-h-[65vh] overflow-y-auto pr-2">
            {products.map(product => (
              <div key={product.id} className="py-3 flex items-center justify-between text-xs hover:bg-stone-50/40 px-2 rounded-xl transition-colors">
                <div className="h-10 w-10 bg-zinc-50 border rounded-lg overflow-hidden flex items-center justify-center p-1"><img src={product.image_url} alt="" className="max-h-full max-w-full object-contain" /></div>
                <div className="flex-grow pl-3"><h4 className="font-medium text-zinc-800">{product.name}</h4><span className="text-[9px] uppercase tracking-wider text-zinc-400">{product.category}</span></div>
                
                <div className="w-36 space-y-0.5 text-right pr-4">
                  {product.variants && product.variants.map(v => (
                    <div key={v.id} className="flex justify-between text-[10px] bg-stone-50/50 px-1.5 py-0.5 rounded border border-zinc-100/50">
                      <span className="text-zinc-400">{product.category === 'sacs' ? v.color : `T:${v.size}`}</span>
                      <span className={v.stock <= 0 ? "text-red-500 font-bold" : "text-emerald-700 font-medium"}>{v.stock} u</span>
                    </div>
                  ))}
                </div>

                <span className="font-semibold text-zinc-900 pr-4">{product.price_cad.toFixed(2)} $</span>
                <button onClick={() => handleDeleteProduct(product.id)} className="text-zinc-400 hover:text-red-600 p-2 text-sm cursor-pointer">🗑️</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 🚚 PANNEAU C : LE REGISTRE DES EXPÉDITIONS POSTES CANADA (À droite) */}
      <div className="xl:col-span-1 bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm h-fit">
        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900 border-b border-zinc-100 pb-3 mb-4">🚚 Expéditions & Postes Canada</h3>
        <div className="divide-y divide-zinc-100 max-h-[65vh] overflow-y-auto pr-2">
          {orders.map(order => (
            <OrderShippingRow key={order.id} order={order} token={token} onRefresh={fetchAdminData} />
          ))}
          {orders.length === 0 && (
            <div className="text-center py-12 text-zinc-400 font-light text-[10px] uppercase tracking-widest">
              Aucun colis en attente de traitement.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
