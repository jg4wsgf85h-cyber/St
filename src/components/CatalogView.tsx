import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Search, Heart, Sparkles, Filter, ChevronDown, ShoppingBag, Eye } from 'lucide-react';
import { VideoItem } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import ProductCardMedia from './ProductCardMedia';

interface CatalogViewProps {
  products: VideoItem[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onSelectProduct: (product: VideoItem) => void;
  triggerHaptic: (style: 'light' | 'medium' | 'heavy') => void;
}

export default function CatalogView({
  products,
  selectedCategory,
  setSelectedCategory,
  favorites,
  onToggleFavorite,
  onSelectProduct,
  triggerHaptic
}: CatalogViewProps) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'featured' | 'priceAsc' | 'priceDesc' | 'rating'>('featured');

  const categories = useMemo(() => {
    const base = [t('categoryAll'), 'Dry Sift', 'Beldia', 'Frozen Sift', 'Static', 'WPFF'];
    const pCats = new Set<string>();
    (products || []).forEach((p) => {
      if (p.category && p.category.trim()) {
        const cLower = p.category.trim().toLowerCase();
        if (!cLower.includes('rabat') && !cLower.includes('meet up') && !cLower.includes('accessoire')) {
          pCats.add(p.category.trim());
        }
      }
    });

    const merged = [...base];
    pCats.forEach((cat) => {
      if (!merged.some((c) => c.toLowerCase() === cat.toLowerCase())) {
        merged.push(cat);
      }
    });
    return merged;
  }, [products, t]);

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const productCat = (p.category || '').toLowerCase().trim();
        const selCat = (selectedCategory || 'Tous').toLowerCase().trim();

        if (
          productCat.includes('rabat') ||
          productCat.includes('meet up') ||
          productCat.includes('accessoire')
        ) {
          return false;
        }

        let matchesCategory = false;
        if (selCat === 'tous' || selCat === 'all' || selCat === t('categoryAll').toLowerCase() || !selCat) {
          matchesCategory = true;
        } else if (selCat.includes('beld')) {
          matchesCategory = productCat.includes('beld');
        } else if (selCat.includes('dry') || selCat.includes('sift')) {
          matchesCategory = productCat.includes('dry') || productCat.includes('sift');
        } else if (selCat.includes('frozen')) {
          matchesCategory = productCat.includes('frozen');
        } else if (selCat.includes('static')) {
          matchesCategory = productCat.includes('static');
        } else if (selCat.includes('wpff') || selCat.includes('wppf')) {
          matchesCategory = productCat.includes('wpff') || productCat.includes('wppf');
        } else {
          matchesCategory = productCat.includes(selCat) || selCat.includes(productCat);
        }

        const matchesSearch =
          (p.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.description || '').toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'priceAsc') return a.price - b.price;
        if (sortBy === 'priceDesc') return b.price - a.price;
        if (sortBy === 'rating') return (b.rating || 5) - (a.rating || 5);
        return 0; // default order
      });
  }, [products, selectedCategory, searchQuery, sortBy, t]);

  return (
    <div className="space-y-5 pb-24 pt-2 px-4 max-w-2xl mx-auto" id="catalog-view">
      {/* Title & Filter Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <span>{t('navCatalog')}</span>
              <span className="px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 font-mono text-[10px] font-extrabold">
                {filteredProducts.length} Réf.
              </span>
            </h2>
            <p className="text-xs text-neutral-400 font-mono">
              Biscotti Boys Farm Reserve • Expédition sous 24h
            </p>
          </div>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-neutral-900 border border-orange-500/30 text-orange-400 text-xs font-mono font-bold rounded-xl px-2.5 py-1.5 focus:outline-none appearance-none cursor-pointer pr-7"
            >
              <option value="featured">Vedettes</option>
              <option value="priceAsc">Prix : Bas → Haut</option>
              <option value="priceDesc">Prix : Haut → Bas</option>
              <option value="rating">Avis Clients</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-orange-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full bg-neutral-900/80 border border-white/10 focus:border-orange-500 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 font-mono focus:outline-none transition shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs font-mono"
            >
              X
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => {
            const selLower = (selectedCategory || '').toLowerCase().trim();
            const catLower = cat.toLowerCase().trim();
            
            let active = selectedCategory === cat;
            if (!active) {
              if (selLower.includes('frozen') && catLower.includes('frozen')) active = true;
              else if (selLower.includes('static') && catLower.includes('static')) active = true;
              else if ((selLower.includes('dry') || selLower.includes('wpff') || selLower.includes('wppf')) && (catLower.includes('dry') || catLower.includes('wpff') || catLower.includes('wppf'))) active = true;
              else if (selLower.includes('accessoire') && catLower.includes('accessoire')) active = true;
              else if ((selLower === 'tous' || selLower === 'all' || selLower === t('categoryAll').toLowerCase() || !selLower) && (catLower === 'tous' || catLower === 'all' || catLower === t('categoryAll').toLowerCase())) active = true;
            }

            return (
              <button
                key={cat}
                onClick={() => {
                  triggerHaptic('light');
                  setSelectedCategory(cat);
                }}
                className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-extrabold whitespace-nowrap transition cursor-pointer border ${
                  active
                    ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-black border-orange-500 shadow-[0_0_12px_rgba(255,107,0,0.3)]'
                    : 'bg-neutral-900/60 text-neutral-400 border-white/10 hover:border-orange-500/30 hover:text-white'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-neutral-900/30 rounded-3xl border border-white/5">
          <p className="text-neutral-400 font-mono text-xs">
            {t('noProductsFound')}
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory(t('categoryAll'));
            }}
            className="px-4 py-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/40 font-mono text-xs font-bold"
          >
            {t('resetFilters')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3.5">
          {filteredProducts.map((p) => {
            const isFav = favorites.includes(p.id);
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
                {/* Image / Video Container */}
                <div className="relative aspect-square w-full bg-neutral-950 overflow-hidden">
                  <ProductCardMedia product={p} hoverScale={true} />

                  {/* Badge */}
                  <div className="absolute top-2 left-2 z-10">
                    <span className="px-2 py-0.5 rounded-md bg-black/80 border border-orange-500/40 text-[#FF6B00] text-[8px] font-mono uppercase font-black tracking-wider backdrop-blur-md">
                      {p.badge || p.category || 'Premium'}
                    </span>
                  </div>

                  {/* Favorite Toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHaptic('light');
                      onToggleFavorite(p.id);
                    }}
                    className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/70 border border-white/10 text-white hover:text-red-500 transition cursor-pointer"
                  >
                    <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
                  </button>
                </div>

                {/* Details */}
                <div className="p-3 space-y-2 bg-black/80 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-white group-hover:text-orange-400 transition line-clamp-1">
                      {p.title}
                    </h4>
                    <p className="text-[10px] text-neutral-400 line-clamp-2 font-sans leading-tight">
                      {p.description}
                    </p>
                  </div>

                  <div className="pt-1 flex items-center justify-between border-t border-white/5">
                    <div>
                      <span className="text-[9px] font-mono text-neutral-500 block uppercase">{t('priceFrom')}</span>
                      <span className="text-xs font-mono font-extrabold text-orange-400">
                        {isAcc ? `${p.price} €` : `${p.price} €/g`}
                      </span>
                    </div>

                    <button className="px-2.5 py-1 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 font-mono text-[10px] font-bold group-hover:bg-orange-500 group-hover:text-black transition">
                      {t('viewDetails')}
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

