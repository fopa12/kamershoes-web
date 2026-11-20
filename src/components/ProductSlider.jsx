// frontend/src/components/ProductSlider.jsx
import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const SPEED_PX_PER_FRAME = 0.6; // vitesse du défilement (≈ 36 px par seconde) : augmentez pour aller plus vite
const MIN_ITEMS = 8;            // nombre minimal de cartes dans un « tour » (garantit une boucle continue)
const CARD_STEP = 288;          // largeur d'une carte (w-64 = 256 px) + espace entre cartes (gap-8 = 32 px)

// Image de remplacement si la photo d'un produit ne se charge pas (évite aussi une boucle d'erreurs)
const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='100%' height='100%' fill='#f5f5f4'/></svg>"
  );

const FADE_MASK = 'linear-gradient(to right, transparent, black 6%, black 94%, transparent)';

/**
 * Bandeau de produits qui défile tout seul, en boucle infinie.
 * - Se met en pause quand la souris survole le bandeau (ou au toucher).
 * - Flèches gauche/droite au survol ; balayage tactile et défilement horizontal du trackpad possibles.
 * - Respecte le réglage « réduire les animations » du système (aucun défilement automatique dans ce cas).
 *
 * Utilisation :  <ProductSlider products={products} getHref={() => '/catalog'} />
 */
export default function ProductSlider({ products = [], getHref }) {
  const trackRef = useRef(null);
  const hoverPausedRef = useRef(false);
  const pauseUntilRef = useRef(0);
  const posRef = useRef(0);

  // Un « tour » = la liste répétée jusqu'à MIN_ITEMS cartes.
  // Trois tours identiques forment une boucle sans couture dans les deux sens.
  const cycle = [];
  if (products.length > 0) {
    const repetitions = Math.ceil(MIN_ITEMS / products.length);
    for (let r = 0; r < repetitions; r += 1) cycle.push(...products);
  }
  const items = [...cycle, ...cycle, ...cycle];

  useEffect(() => {
    const el = trackRef.current;
    if (!el || products.length === 0) return undefined;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const copyWidth = () => el.scrollWidth / 3;

    // On démarre sur le tour du milieu : on peut ainsi reculer ou avancer sans jamais atteindre un bord
    el.scrollLeft = copyWidth();
    posRef.current = el.scrollLeft;

    let frame;
    const step = () => {
      const cw = copyWidth();
      if (cw > 0) {
        // Si l'utilisateur a fait défiler à la main (flèches, balayage), on repart de la position réelle
        if (Math.abs(el.scrollLeft - posRef.current) > 1.5) posRef.current = el.scrollLeft;

        const paused = reduceMotion || hoverPausedRef.current || performance.now() < pauseUntilRef.current;
        let changed = false;

        if (!paused) {
          // Position gardée en nombre décimal : le navigateur arrondit scrollLeft, ce qui bloquerait les petits pas
          posRef.current += SPEED_PX_PER_FRAME;
          changed = true;
        }
        if (posRef.current >= cw * 2) {
          posRef.current -= cw; // saut d'un tour entier : invisible, car les tours sont identiques
          changed = true;
        } else if (posRef.current < cw) {
          posRef.current += cw;
          changed = true;
        }
        if (changed) el.scrollLeft = posRef.current;
      }
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);

    return () => cancelAnimationFrame(frame);
  }, [products.length]);

  const scrollByCard = (direction) => {
    const el = trackRef.current;
    if (!el) return;
    pauseUntilRef.current = performance.now() + 1200; // laisse l'animation des flèches se terminer
    el.scrollBy({ left: direction * CARD_STEP, behavior: 'smooth' });
  };

  if (products.length === 0) return null;

  return (
    <div
      className="relative group/slider"
      onMouseEnter={() => {
        hoverPausedRef.current = true;
      }}
      onMouseLeave={() => {
        hoverPausedRef.current = false;
      }}
      onFocus={() => {
        hoverPausedRef.current = true;
      }}
      onBlur={() => {
        hoverPausedRef.current = false;
      }}
      onTouchStart={() => {
        hoverPausedRef.current = true;
      }}
      onTouchEnd={() => {
        hoverPausedRef.current = false;
        pauseUntilRef.current = performance.now() + 3000; // reprend 3 secondes après le dernier toucher
      }}
    >
      {/* Barre de défilement masquée */}
      <style>{`.product-slider-track{scrollbar-width:none;-ms-overflow-style:none}.product-slider-track::-webkit-scrollbar{display:none}`}</style>

      <div
        ref={trackRef}
        className="product-slider-track flex gap-8 overflow-x-auto py-4 px-2"
        style={{ maskImage: FADE_MASK, WebkitMaskImage: FADE_MASK }}
        role="list"
        aria-label="Nos créations"
      >
        {items.map((product, index) => {
          const isCopy = index >= products.length; // seules les premières cartes sont « réelles » pour les lecteurs d'écran
          const price = Number(product.price_cad || 0).toFixed(2);
          const href = getHref ? getHref(product) : null;

          const card = (
            <div className="group/card w-64 bg-white dark:bg-stone-900 border border-zinc-100 dark:border-stone-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-red-600/10 dark:hover:border-red-500/10 transition-all duration-500">
              {/* Cadre d'exposition 4/3 : object-contain pour montrer la pièce en entier */}
              <div className="relative aspect-[4/3] w-full bg-stone-50/40 dark:bg-stone-950/20 flex items-center justify-center overflow-hidden border-b border-zinc-100/60 dark:border-stone-800 p-4">
                <img
                  src={product.image_url}
                  alt={isCopy ? '' : product.name}
                  loading="lazy"
                  draggable={false}
                  className="h-full w-full object-contain group-hover/card:scale-105 transition-transform duration-700 ease-out"
                  onError={(e) => {
                    e.currentTarget.onerror = null; // une seule tentative : évite une boucle d'erreurs
                    e.currentTarget.src = PLACEHOLDER_IMAGE;
                  }}
                />
              </div>

              <div className="p-4 bg-white dark:bg-stone-900">
                <span className="text-xs font-medium text-zinc-800 dark:text-stone-200 tracking-tight group-hover/card:text-red-600 dark:group-hover/card:text-red-400 transition-colors block truncate">
                  {product.name}
                </span>
                <span className="text-[10px] text-zinc-400 dark:text-stone-500 font-mono">{price} $ CAD</span>
              </div>
            </div>
          );

          const key = `${index}-${product.id}`;
          return href ? (
            <Link
              key={key}
              to={href}
              role="listitem"
              aria-hidden={isCopy ? 'true' : undefined}
              tabIndex={isCopy ? -1 : undefined}
              className="shrink-0 block"
            >
              {card}
            </Link>
          ) : (
            <div key={key} role="listitem" aria-hidden={isCopy ? 'true' : undefined} className="shrink-0">
              {card}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        aria-label="Voir les articles précédents"
        onClick={() => scrollByCard(-1)}
        className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 dark:bg-stone-800/90 shadow-md text-zinc-800 dark:text-stone-100 text-xl leading-none opacity-0 group-hover/slider:opacity-100 focus:opacity-100 transition-opacity"
      >
        ‹
      </button>
      <button
        type="button"
        aria-label="Voir les articles suivants"
        onClick={() => scrollByCard(1)}
        className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 dark:bg-stone-800/90 shadow-md text-zinc-800 dark:text-stone-100 text-xl leading-none opacity-0 group-hover/slider:opacity-100 focus:opacity-100 transition-opacity"
      >
        ›
      </button>
    </div>
  );
}