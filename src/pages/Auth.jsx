import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config'; // adresse unique de l'API (Vercel), définie dans src/config.js

// Le champ « detail » de l'API est un texte, sauf pour les erreurs de validation (liste d'objets)
const readError = (data, fallback) => (data && typeof data.detail === 'string' ? data.detail : fallback);

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const endpoint = isLogin ? '/auth/login' : '/auth/register';

    let body;
    const headers = {};

    if (isLogin) {
      // FastAPI (OAuth2) attend un formulaire encodé : « username » contient l'adresse courriel
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);
      body = formData;
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
    } else {
      // L'inscription attend un corps JSON
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify({ email, password, full_name: fullName });
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body,
      });

      // Si le serveur répond autre chose que du JSON (page d'erreur), on ne plante pas
      let data = {};
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(readError(data, "Une erreur est survenue lors de l'authentification."));
      }

      if (isLogin) {
        // Le jeton de session est lu par la page de paiement sous la clé « token »
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('token_type', data.token_type);

        alert("🎉 Connexion réussie ! Bienvenue sur l'Atelier.");
        navigate('/'); // Retour à l'accueil
      } else {
        alert('✨ Inscription validée ! Vous pouvez maintenant vous connecter.');
        setIsLogin(true);
        setPassword('');
      }
    } catch (err) {
      // « Failed to fetch » = le serveur est injoignable (réseau, mauvaise adresse ou blocage CORS)
      if (err instanceof TypeError) {
        setError('Impossible de joindre le serveur. Vérifiez votre connexion internet et réessayez.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-xl shadow-xl border border-zinc-100 overflow-hidden max-w-4xl w-full grid grid-cols-1 md:grid-cols-2">
        {/* 🎨 PANNEAU GAUCHE : identité de la marque */}
        <div className="hidden md:flex flex-col justify-between bg-zinc-950 p-12 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://unsplash.com')] bg-cover bg-center opacity-20 filter grayscale contrast-125" />

          <div className="relative z-10">
            <span className="text-amber-500 font-semibold tracking-wider text-xs uppercase">
              Maroquinerie d'Excellence
            </span>
            <h2 className="text-3xl font-light tracking-tight mt-2 font-serif italic text-amber-100">
              kamershoes Canada
            </h2>
          </div>

          <div className="relative z-10">
            <p className="text-sm text-zinc-400 font-light leading-relaxed">
              "Chaque mocassin, chaque babouche et chaque sac raconte l'histoire d'un savoir-faire artisanal précis, conçu pour durer toute une vie."
            </p>
          </div>
        </div>

        {/* 🔐 PANNEAU DROIT : formulaire */}
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <div className="mb-8 text-center md:text-left">
            <h3 className="text-2xl font-medium tracking-tight text-zinc-900">
              {isLogin ? "Bienvenue à l'Atelier" : 'Créer un compte client'}
            </h3>
            <p className="text-sm text-zinc-500 mt-2 font-light">
              {isLogin
                ? "Connectez-vous pour suivre l'expédition de vos colis au Canada."
                : 'Inscrivez-vous pour commander vos articles personnalisés.'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-4 rounded-md mb-6 border border-red-100 font-light">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500 mb-2">Nom Complet</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-50 border border-zinc-200 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-amber-600 transition-colors"
                  placeholder="Ex: Simplice Mella"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500 mb-2">Adresse Courriel</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-zinc-200 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-amber-600 transition-colors"
                placeholder="votre.email@exemple.com"
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500 mb-2">Mot de passe</label>
              <input
                type="password"
                required
                minLength={isLogin ? undefined : 8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-zinc-200 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-amber-600 transition-colors"
                placeholder="••••••••"
              />
              {!isLogin && <p className="text-xs text-zinc-400 mt-2">8 caractères minimum.</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-3 px-4 rounded-md transition-all duration-300 shadow-lg hover:shadow-amber-600/10 disabled:bg-zinc-400"
            >
              {loading ? 'Traitement en cours...' : isLogin ? 'Se connecter' : 'Créer mon compte'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-sm text-zinc-600 hover:text-amber-700 font-light transition-colors underline underline-offset-4"
            >
              {isLogin ? 'Nouveau sur la boutique ? Créer un compte' : 'Déjà client ? Se connecter'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
