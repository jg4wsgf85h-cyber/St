import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Heart, Sparkles, ChevronDown, ChevronRight, X } from 'lucide-react';
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

interface CategoryTab {
  id: string;
  label: string;
  query: string;
  icon?: any;
  emoji?: string;
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

  const categoryTabs = useMemo<CategoryTab[]>(() => {
    const baseTabs: CategoryTab[] = [
      { id: 'all', label: 'TOUS', query: 'Tous', icon: Sparkles },
      { id: 'drysift', label: 'DRYSIFT 90U', query: 'Dry Sift', emoji: '🍯' },
      { id: 'frozensift', label: 'FROZEN SIFT PREMIUM', query: 'Frozen', emoji: '🧊' },
      { id: 'wppf', label: 'WPPF', query: 'WPFF', emoji: '🧈' },
      { id: 'static', label: 'STATIC', query: 'Static', emoji: '🧤' },
      { id: 'beldia', label: 'BELDIA', query: 'Beldia', emoji: '🇲🇦' }
    ];

    const knownIds = new Set(['all', 'drysift', 'frozensift', 'wppf', 'static', 'beldia']);

    (products || []).forEach((p) => {
      if (p.category && p.category.trim()) {
        const cTrim = p.category.trim();
        const cLower = cTrim.toLowerCase();
        
        const isKnown =
          cLower.includes('dry') ||
          cLower.includes('sift') ||
          cLower.includes('frozen') ||
          cLower.includes('fresh') ||
          cLower.includes('wppf') ||
          cLower.includes('wpff') ||
          cLower.includes('static') ||
          cLower.includes('beld') ||
          cLower.includes('rabat') ||
          cLower.includes('meet up');

        if (!isKnown && !knownIds.has(cLower)) {
          knownIds.add(cLower);
          baseTabs.push({
            id: cLower,
            label: cTrim.toUpperCase(),
            query: cTrim,
            emoji: '🏷️'
          });
        }
      }
    });

    return baseTabs;
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const productCat = (p.category || '').toLowerCase().trim();
        const selCat = (selectedCategory || 'Tous').toLowerCase().trim();

        if (
          productCat.includes('rabat') ||
          productCat.includes('meet up')
        ) {
          return false;
        }

        let matchesCategory = false;
        if (selCat === 'tous' || selCat === 'all' || selCat === t('categoryAll').toLowerCase() || !selCat) {
          matchesCategory = true;
        } else if (selCat.includes('beld')) {
          matchesCategory = productCat.includes('beld');
        } else if (selCat.includes('dry') || selCat.includes('sift') || selCat.includes('90u')) {
          matchesCategory = productCat.includes('dry') || productCat.includes('sift');
        } else if (selCat.includes('frozen') || selCat.includes('fresh')) {
          matchesCategory = productCat.includes('frozen') || productCat.includes('fresh');
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
        return 0;
      });
  }, [products, selectedCategory, searchQuery, sortBy, t]);

  const activeTabId = useMemo(() => {
    const sel = (selectedCategory || 'Tous').toLowerCase().trim();
    if (sel === 'tous' || sel === 'all') return 'all';
    if (sel.includes('dry') || sel.includes('90u')) return 'drysift';
    if (sel.includes('frozen') || sel.includes('fresh')) return 'frozensift';
    if (sel.includes('wpff') || sel.includes('wppf')) return 'wppf';
    if (sel.includes('static')) return 'static';
    if (sel.includes('beld')) return 'beldia';
    return sel;
  }, [selectedCategory]);

  return (
    <div className="space-y-4 pb-24 pt-2 px-3 sm:px-4 max-w-2xl mx-auto" id="catalog-view">
      {/* Title & Filter Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <span className="bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent uppercase">
                {t('navCatalog')}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[10px] font-extrabold">
                {filteredProducts.length} Réf.
              </span>
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              👽⛰️ALIENS FARMS OFFICIEL⛰️👽 Reserve • Expédition sous 24h
            </p>
          </div>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-zinc-900 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold rounded-xl px-2.5 py-1.5 focus:outline-none appearance-none cursor-pointer pr-7"
            >
              <option value="featured">Vedettes</option>
              <option value="priceAsc">Prix : Bas → Haut</option>
              <option value="priceDesc">Prix : Haut → Bas</option>
              <option value="rating">Avis Clients</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-amber-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full bg-zinc-900/90 border border-white/10 focus:border-amber-500 rounded-2xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-zinc-500 font-mono focus:outline-none transition shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Pills (Horizontal Scrolling) */}
        <div className="relative -mx-3 sm:-mx-4 px-3 sm:px-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar scroll-smooth">
            {categoryTabs.map((tab) => {
              const Icon = tab.icon;
              const isSelected =
                tab.id === 'all'
                  ? selectedCategory === 'Tous' || selectedCategory === 'All' || !selectedCategory
                  : activeTabId === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    triggerHaptic('medium');
                    setSelectedCategory(tab.query);
                  }}
                  className={`relative flex items-center gap-1.5 px-4 py-2.5 rounded-xl sm:rounded-2xl font-mono text-xs font-black tracking-wider uppercase whitespace-nowrap transition-all duration-300 cursor-pointer shrink-0 border ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-600/20 text-amber-300 border-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.35)] ring-1 ring-amber-400/50'
                      : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-white/10 hover:border-white/20'
                  }`}
                >
                  {Icon ? (
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-300 animate-pulse' : 'text-zinc-400'}`} />
                  ) : tab.emoji ? (
                    <span className="text-xs">{tab.emoji}</span>
                  ) : null}

                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-zinc-950/40 rounded-3xl border border-white/5">
          <p className="text-zinc-400 font-mono text-xs">
            {t('noProductsFound')}
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory(t('categoryAll'));
            }}
            className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 font-mono text-xs font-bold"
          >
            {t('resetFilters')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-3.5">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((p, idx) => {
              const isFav = favorites.includes(p.id);

              return (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                  transition={{ duration: 0.22, delay: Math.min(idx * 0.03, 0.3) }}
                  whileHover={{ scale: 1.015, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    triggerHaptic('medium');
                    onSelectProduct(p);
                  }}
                  className="group relative bg-gradient-to-b from-zinc-900/90 to-black border border-white/10 hover:border-amber-500/50 rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 shadow-md hover:shadow-[0_4px_20px_rgba(245,158,11,0.15)] flex flex-col justify-between"
                >
                  {/* Image / Video Container */}
                  <div className="relative aspect-square w-full bg-zinc-950 overflow-hidden">
                    <ProductCardMedia product={p} hoverScale={true} />

                    {/* Badge */}
                    <div className="absolute top-2 left-2 z-10">
                      <span className="px-2 py-0.5 rounded-md bg-black/80 border border-amber-500/40 text-amber-300 text-[8px] font-mono uppercase font-black tracking-wider backdrop-blur-md shadow-sm">
                        {p.badge || p.category || 'PREMIUM'}
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
                  <div className="p-3 space-y-2 bg-black/70 flex-1 flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="text-[9px] font-mono font-bold text-amber-400/90 uppercase tracking-wider line-clamp-1">
                        {p.category || 'ALIENS FARMS'}
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition line-clamp-1 uppercase">
                        {p.title}
                      </h4>
                      {p.description && (
                        <p className="text-[10px] text-zinc-400 line-clamp-1 font-sans leading-tight">
                          {p.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-white/5">
                      <span className="text-xs sm:text-sm font-black font-mono text-amber-400">
                        {p.price} €
                      </span>

                      <span className="text-[10px] font-mono text-zinc-400 group-hover:text-amber-300 transition flex items-center gap-0.5">
                        <span>Voir</span>
                        <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
