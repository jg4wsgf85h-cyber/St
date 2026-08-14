import { motion } from 'motion/react';
import { Heart, Compass, Trash2 } from 'lucide-react';
import { VideoItem } from '../types';
import ProductCardMedia from './ProductCardMedia';

interface FavoritesViewProps {
  products: VideoItem[];
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onSelectProduct: (product: VideoItem) => void;
  onNavigateTab: (tab: 'catalog') => void;
  triggerHaptic: (style: 'light' | 'medium' | 'heavy') => void;
}

export default function FavoritesView({
  products,
  favorites,
  onToggleFavorite,
  onSelectProduct,
  onNavigateTab,
  triggerHaptic
}: FavoritesViewProps) {
  const favProducts = products.filter((p) => favorites.includes(p.id));

  return (
    <div className="space-y-6 pb-24 pt-2 px-4 max-w-2xl mx-auto" id="favorites-view">
      <div className="space-y-1">
        <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
          <span>Mes Récoltes Favorites</span>
          <span className="px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 font-mono text-[10px] font-extrabold">
            {favProducts.length} Sauvegardé(s)
          </span>
        </h2>
        <p className="text-xs text-neutral-400 font-mono">
          Retrouvez vos variétés préférées mises en favoris
        </p>
      </div>

      {favProducts.length === 0 ? (
        <div className="p-10 rounded-3xl bg-neutral-900/40 border border-white/5 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
            <Heart className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">Aucun favori enregistré</h3>
            <p className="text-xs text-neutral-400 font-mono max-w-xs mx-auto">
              Touchez le cœur sur les fiches produits du catalogue pour les conserver ici.
            </p>
          </div>
          <button
            onClick={() => {
              triggerHaptic('medium');
              onNavigateTab('catalog');
            }}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-500 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 mx-auto"
          >
            <Compass className="w-4 h-4" />
            <span>Explorer le Catalogue</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3.5">
          {favProducts.map((p) => {
            const isAcc = (p.category || '').toLowerCase().includes('accessoire');

            return (
              <motion.div
                key={p.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  triggerHaptic('medium');
                  onSelectProduct(p);
                }}
                className="group bg-gradient-to-b from-neutral-900 to-black border border-orange-500/20 hover:border-orange-500/60 rounded-2xl overflow-hidden cursor-pointer transition duration-300 shadow-md relative flex flex-col justify-between"
              >
                <div className="relative aspect-square w-full bg-neutral-950 overflow-hidden">
                  <ProductCardMedia product={p} hoverScale={true} />

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHaptic('light');
                      onToggleFavorite(p.id);
                    }}
                    className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/80 border border-red-500/40 text-red-500 transition cursor-pointer"
                    title="Retirer des favoris"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-3 space-y-1.5 bg-black/80">
                  <h4 className="text-xs font-bold text-white line-clamp-1">{p.title}</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-extrabold text-orange-400">
                      {isAcc ? `${p.price} €` : `${p.price} €/g`}
                    </span>
                    <button className="px-2 py-0.5 rounded bg-orange-500 text-black text-[9px] font-mono font-bold">
                      Voir
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
