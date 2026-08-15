import { useMemo } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { VideoItem } from '../types';

interface CategoriesViewProps {
  products: VideoItem[];
  onSelectCategory: (categoryName: string) => void;
  triggerHaptic: (style: 'light' | 'medium' | 'heavy') => void;
}

export default function CategoriesView({
  products,
  onSelectCategory,
  triggerHaptic
}: CategoriesViewProps) {
  const categoriesList = useMemo(() => {
    const list = [
      { name: 'Tous les Produits', query: 'Tous', emoji: '✨' },
      { name: 'DRYSIFT 90U', query: 'Dry Sift', emoji: '🍯' },
      { name: 'FROZEN SIFT PREMIUM', query: 'Frozen', emoji: '🧊' },
      { name: 'WPPF', query: 'WPFF', emoji: '🧈' },
      { name: 'STATIC', query: 'Static', emoji: '🧤' },
      { name: 'BELDIA', query: 'Beldia', emoji: '🇲🇦' }
    ];

    const knownQueries = new Set(['tous', 'static', 'frozen', 'wppf', 'wpff', 'beldia', 'dry sift']);
    (products || []).forEach((p) => {
      if (p.category && p.category.trim()) {
        const cTrim = p.category.trim();
        const cLower = cTrim.toLowerCase();
        if (
          !knownQueries.has(cLower) &&
          !cLower.includes('frozen') &&
          !cLower.includes('static') &&
          !cLower.includes('dry') &&
          !cLower.includes('wppf') &&
          !cLower.includes('wpff') &&
          !cLower.includes('rabat') &&
          !cLower.includes('meet up')
        ) {
          knownQueries.add(cLower);
          list.push({ name: cTrim.toUpperCase(), query: cTrim, emoji: '🏷️' });
        }
      }
    });

    return list;
  }, [products]);

  return (
    <div className="space-y-4 pb-24 pt-2 px-3 sm:px-4 max-w-2xl mx-auto" id="categories-view">
      <div className="space-y-1">
        <h2 className="text-lg font-black text-white tracking-tight uppercase flex items-center gap-2">
          <span className="bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
            Catégories Reserve
          </span>
        </h2>
        <p className="text-xs text-zinc-400 font-mono">
          Sélectionnez une catégorie pour filtrer instantanément le catalogue.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2">
        {categoriesList.map((cat) => {
          const count = cat.query === 'Tous'
            ? products.length
            : products.filter((p) => {
                const pCat = (p.category || '').toLowerCase();
                const qCat = cat.query.toLowerCase();
                if (qCat === 'dry sift' || qCat.includes('dry')) return pCat.includes('dry') || pCat.includes('sift');
                if (qCat === 'frozen' || qCat.includes('frozen')) return pCat.includes('frozen') || pCat.includes('fresh');
                if (qCat === 'wpff' || qCat === 'wppf') return pCat.includes('wpff') || pCat.includes('wppf');
                if (qCat === 'static') return pCat.includes('static');
                if (qCat === 'beldia') return pCat.includes('beld');
                return pCat.includes(qCat);
              }).length;

          return (
            <button
              key={cat.name}
              onClick={() => {
                triggerHaptic('medium');
                onSelectCategory(cat.query);
              }}
              className="p-4 rounded-2xl bg-zinc-900/80 border border-white/10 hover:border-amber-500/60 hover:bg-zinc-800/90 text-left transition-all duration-300 cursor-pointer flex items-center justify-between group shadow-md hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]"
            >
              <div className="space-y-1">
                <div className="text-lg">{cat.emoji}</div>
                <span className="text-xs font-black text-white group-hover:text-amber-300 transition block uppercase font-mono">
                  {cat.name}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {count} réf{count > 1 ? 's' : ''}
                </span>
              </div>
              <div className="w-7 h-7 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center text-zinc-400 group-hover:text-amber-400 group-hover:border-amber-500/40 transition">
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
