// frontend/src/pages/Checkout.jsx
import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCart } from '../context/CartContext';
import { API_URL } from '../config';

// 🔑 Clé PUBLIQUE Stripe (pk_test_... ou pk_live_...), définie dans frontend/.env :
//    VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
// Ne jamais mettre la clé secrète (sk_...) dans le frontend : tout visiteur peut la lire.
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = STRIPE_PUBLISHABLE_KEY ? loadStripe(STRIPE_PUBLISHABLE_KEY, { locale: 'fr' }) : null;

// Le champ « detail » de l'API est un texte, sauf pour les erreurs de validation (liste)
const readError = (data, fallback) => (data && typeof data.detail === 'string' ? data.detail : fallback);

// ---------------------------------------------------------------------------
// Formulaire de carte : les chiffres de la carte vont directement à Stripe (iframe sécurisée)
// ---------------------------------------------------------------------------
function PaymentForm({ total, onPaid }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setMessage('');

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/checkout` },
      redirect: 'if_required', // pas de redirection pour les cartes (la 3D Secure s'affiche dans une fenêtre)
    });

    if (error) {
      setMessage(error.message || 'Le paiement a échoué. Veuillez réessayer.');
      setSubmitting(false);
      return;
    }

    if (paymentIntent && paymentIntent.status === 'succeeded') {
      await onPaid(paymentIntent.id);
      return;
    }

    if (paymentIntent && paymentIntent.status === 'processing') {
      setMessage('Votre paiement est en cours de traitement. Vous recevrez un courriel de confirmation.');
    } else {
      setMessage("Le paiement n'a pas pu être confirmé. Veuillez réessayer.");
    }
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {message && <div className="text-xs text-red-600">⚠️ {message}</div>}
      <button
        type="submit"
        disabled={!stripe || !elements || submitting}
        className="w-full bg-zinc-950 text-white font-medium py-4 rounded-xl disabled:opacity-50"
      >
        {submitting ? 'Paiement en cours...' : `Payer ${total.toFixed(2)} $ CAD`}
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Page de paiement
// ---------------------------------------------------------------------------
export default function Checkout() {
  const { cartItems, clearCart } = useCart();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('ON');
  const [postalCode, setPostalCode] = useState('');
  const [taxSummary, setTaxSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clientSecret, setClientSecret] = useState(null);
  const [success, setSuccess] = useState(null);

  const lockedAddress = Boolean(clientSecret); // l'adresse (donc les taxes) est figée une fois le paiement préparé

  useEffect(() => {
    if (cartItems.length === 0) return;
    const fetchTaxes = async () => {
      try {
        const response = await fetch(`${API_URL}/orders/estimate-tax`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            province_code: province,
            items: cartItems.map((item) => ({ product_id: item.product_id, variant_id: item.variant_id, quantity: item.quantity })),
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(readError(data, 'Erreur de calcul fiscal'));
        setTaxSummary(data);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchTaxes();
  }, [province, cartItems]);

  // Étape 1 : l'API valide le panier, calcule le total et prépare le paiement Stripe
  const handleCreateIntent = async (e) => {
    e.preventDefault();
    if (!taxSummary) return;
    const cleanPostalCode = postalCode.replace(/\s+/g, '').toUpperCase();
    if (cleanPostalCode.length !== 6) {
      setError('⚠️ Le code postal canadien doit comporter 6 caractères (Ex: H3B1A7).');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/payments/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
        body: JSON.stringify({
          province_code: province,
          fullName,
          email,
          address,
          city,
          postalCode: cleanPostalCode,
          items: cartItems.map((item) => ({ product_id: item.product_id, variant_id: item.variant_id, quantity: item.quantity })),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(readError(data, 'Erreur lors de la préparation du paiement'));
      setClientSecret(data.client_secret);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Étape 3 : la carte est débitée ; on demande à l'API de vérifier auprès de Stripe et de valider la commande
  const handlePaid = async (paymentIntentId) => {
    try {
      const response = await fetch(`${API_URL}/payments/confirm-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_intent_id: paymentIntentId }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 409) {
        // Article épuisé (remboursé) ou paiement en cours de vérification
        setError(readError(data, 'Votre commande nécessite une vérification.'));
        setClientSecret(null);
        return;
      }
      setSuccess({ orderId: response.ok ? data.order_id : null });
    } catch {
      // Le paiement a réussi : le webhook finalisera la commande même si cet appel échoue
      setSuccess({ orderId: null });
    }
    clearCart();
  };

  // ----- Affichage -----
  if (success) {
    return (
      <div className="max-w-xl mx-auto py-16 px-6 text-center space-y-4 font-sans">
        <h2 className="text-2xl font-medium">🎉 Paiement confirmé</h2>
        {success.orderId ? (
          <p>
            Votre commande <b>ATK-00{success.orderId}</b> est en préparation à l'Atelier.
          </p>
        ) : (
          <p>Votre paiement a bien été reçu. Votre commande est en cours de validation.</p>
        )}
        <p className="text-sm text-zinc-500">Votre facture vous sera envoyée par courriel à {email}.</p>
        <a href="/" className="inline-block bg-zinc-950 text-white font-medium px-8 py-3 rounded-xl">
          Retour à l'accueil
        </a>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-16 px-6 text-center font-sans">
        <p className="text-zinc-500">Votre panier est vide.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto py-12 px-6 font-sans">
      <div className="bg-white p-8 rounded-2xl border shadow-sm space-y-6">
        <form onSubmit={handleCreateIntent} className="space-y-6">
          <h3 className="text-xl font-medium border-b pb-3">📍 Adresse de Livraison au Canada</h3>
          <input type="text" required disabled={lockedAddress} value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full border rounded-lg px-4 py-3 text-sm" placeholder="Nom complet" />
          <input type="email" required disabled={lockedAddress} value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded-lg px-4 py-3 text-sm" placeholder="Adresse Courriel" />
          <input type="text" required disabled={lockedAddress} value={address} onChange={(e) => setAddress(e.target.value)} className="w-full border rounded-lg px-4 py-3 text-sm" placeholder="Adresse civique" />
          <div className="grid grid-cols-3 gap-4">
            <input type="text" required disabled={lockedAddress} value={city} onChange={(e) => setCity(e.target.value)} className="w-full border rounded-lg px-2 py-3 text-sm" placeholder="Ville" />
            <select disabled={lockedAddress} value={province} onChange={(e) => setProvince(e.target.value)} className="w-full border rounded-lg px-2 py-3 text-sm">
              <option value="ON">Ontario</option>
              <option value="QC">Québec</option>
              <option value="AB">Alberta</option>
              <option value="BC">Colombie-Britannique</option>
            </select>
            <input type="text" required disabled={lockedAddress} maxLength="7" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className="w-full border rounded-lg px-2 py-3 text-sm uppercase" placeholder="H3B 1A7" />
          </div>
          {!lockedAddress && (
            <>
              {error && <div className="text-xs text-red-600">⚠️ {error}</div>}
              <button type="submit" disabled={loading || !taxSummary} className="w-full bg-zinc-950 text-white font-medium py-4 rounded-xl disabled:opacity-50">
                {loading ? "Préparation du paiement..." : 'Continuer vers le paiement'}
              </button>
            </>
          )}
        </form>

        {lockedAddress && (
          <div className="pt-6 border-t space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-500">💳 Paiement sécurisé par Stripe</h3>
              <button type="button" onClick={() => setClientSecret(null)} className="text-xs underline text-zinc-500">
                Modifier l'adresse
              </button>
            </div>
            {!stripePromise ? (
              <div className="text-xs text-red-600">
                ⚠️ Paiement indisponible : la clé publique Stripe (VITE_STRIPE_PUBLISHABLE_KEY) est manquante.
              </div>
            ) : (
              <Elements
                key={clientSecret}
                stripe={stripePromise}
                options={{ clientSecret, locale: 'fr', appearance: { theme: 'stripe' } }}
              >
                <PaymentForm total={taxSummary ? taxSummary.total_with_tax || 0 : 0} onPaid={handlePaid} />
              </Elements>
            )}
          </div>
        )}
      </div>

      <div className="bg-white p-8 rounded-2xl border shadow-sm h-fit space-y-4">
        <h3 className="text-lg font-medium border-b pb-2">Reçu Comptable</h3>
        {cartItems.map((item) => (
          <div key={item.variant_id || item.id} className="flex justify-between items-center text-sm py-1">
            <span>
              {item.name} (x{item.quantity})
            </span>
            <span className="font-medium">{(item.price_cad * item.quantity).toFixed(2)} $</span>
          </div>
        ))}
        {taxSummary && (
          <div className="pt-4 border-t space-y-2 text-xs text-zinc-400 uppercase tracking-wider">
            <div className="flex justify-between">
              <span>Sous-total :</span>
              <span className="font-mono text-zinc-800">{(taxSummary.subtotal || 0).toFixed(2)} $</span>
            </div>
            <div className="flex justify-between text-red-600 font-medium">
              <span>Taxes ({province}) :</span>
              <span className="font-mono">{(taxSummary.tax_amount || 0).toFixed(2)} $</span>
            </div>
            <div className="flex justify-between text-sm text-zinc-950 font-bold pt-2 border-t border-dashed">
              <span>Montant Global (CAD) :</span>
              <span className="font-mono text-base text-red-600">{(taxSummary.total_with_tax || 0).toFixed(2)} $</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
