import { useMemo } from 'react';
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
      { name: 'Tous', query: 'Tous' },
      { name: 'Dry Sift 🍯', query: 'Dry Sift' },
      { name: 'Beldia 🇲🇦', query: 'Beldia' },
      { name: 'Static 🧤', query: 'Static' },
      { name: 'Frozen Sift 🧊', query: 'Frozen' },
      { name: 'WPFF 🧈', query: 'WPFF' },
    ];

    const knownQueries = new Set(['tous', 'static', 'frozen', 'wppf', 'wpff']);
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
          !cLower.includes('meet up') &&
          !cLower.includes('acc')
        ) {
          knownQueries.add(cLower);
          list.push({ name: cTrim, query: cTrim });
        }
      }
    });

    return list;
  }, [products]);

  return (
    <div className="space-y-4 pb-24 pt-2 px-4 max-w-2xl mx-auto" id="categories-view">
      <div className="space-y-1">
        <h2 className="text-lg font-black text-white tracking-tight uppercase">
          Filtrer par Catégorie
        </h2>
        <p className="text-xs text-neutral-400 font-mono">
          Sélectionnez une catégorie pour afficher directement les produits correspondants.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2">
        {categoriesList.map((cat) => {
          const count = cat.query === 'Tous'
            ? products.length
            : products.filter((p) => {
                const pCat = (p.category || '').toLowerCase();
                const qCat = cat.query.toLowerCase();
                if (qCat === 'accessoires') return pCat.includes('accessoire') || pCat.includes('acc');
                if (qCat === 'wpff' || qCat === 'wppf' || qCat === 'dry') return pCat.includes('wpff') || pCat.includes('wppf') || pCat.includes('dry');
                return pCat.includes(qCat);
              }).length;

          return (
            <button
              key={cat.name}
              onClick={() => {
                triggerHaptic('medium');
                onSelectCategory(cat.query);
              }}
              className="p-4 rounded-2xl bg-neutral-900 border border-white/10 hover:border-orange-500/50 text-left transition cursor-pointer flex items-center justify-between group shadow-md"
            >
              <div>
                <span className="text-sm font-bold text-white group-hover:text-orange-400 transition block uppercase">
                  {cat.name}
                </span>
                <span className="text-[10px] text-neutral-500 font-mono">
                  {count} produit{count > 1 ? 's' : ''}
                </span>
              </div>
              <span className="text-xs text-orange-500 font-mono font-bold group-hover:translate-x-1 transition">
                →
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
