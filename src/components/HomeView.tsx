import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Heart,
  ArrowRight
} from 'lucide-react';
import { VideoItem, BrandingSettings } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import ProductCardMedia from './ProductCardMedia';

interface HomeViewProps {
  branding: BrandingSettings | null;
  tgUser?: any;
  products: VideoItem[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  favorites?: string[];
  onToggleFavorite?: (id: string) => void;
  onSelectProduct: (p: VideoItem) => void;
  onQuickAddToCart?: (p: VideoItem) => void;
  onNavigateTab: (tab: 'catalog' | 'categories' | 'contact' | 'info' | 'reviews' | 'profile' | 'favorites') => void;
  triggerHaptic: (style: 'light' | 'medium' | 'heavy') => void;
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

interface CategoryTab {
  id: string;
  label: string;
  query: string;
  icon?: any;
  emoji?: string;
}

const DEFAULT_HERO_VISUAL = '/secret_farmz_logo.jpg';
const FALLBACK_LOGO = '/secret_farmz_logo.jpg';

export default function HomeView({
  branding,
  tgUser,
  products,
  selectedCategory,
  setSelectedCategory,
  favorites = [],
  onToggleFavorite,
  onSelectProduct,
  triggerHaptic
}: HomeViewProps) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract Telegram user first name dynamically
  const userFirstName = useMemo(() => {
    if (tgUser?.first_name && tgUser.first_name.trim()) {
      return tgUser.first_name.trim();
    }
    if (tgUser?.username && tgUser.username.trim()) {
      return tgUser.username.trim();
    }
    return 'VIP';
  }, [tgUser]);

  // Determine Hero image source
  const heroImageUrl = useMemo(() => {
    return (
      branding?.homepageHeroBgUrl ||
      branding?.introBgUrl ||
      branding?.launchScreenUrl ||
      branding?.logoUrl ||
      DEFAULT_HERO_VISUAL
    );
  }, [branding]);

  // Luxury Category Tabs with refined icons/emojis
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

  // Filter products by selected category and search query
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    const sel = (selectedCategory || 'Tous').toLowerCase().trim();
    const query = searchQuery.toLowerCase().trim();

    return products.filter((p) => {
      const cat = (p.category || '').toLowerCase().trim();

      // Category matching logic
      let matchesCat = false;
      if (sel === 'tous' || sel === 'all' || !sel) {
        matchesCat = true;
      } else if (sel === 'dry sift' || sel.includes('dry') || sel.includes('90u')) {
        matchesCat = cat.includes('dry') || cat.includes('sift');
      } else if (sel === 'frozen' || sel.includes('frozen') || sel.includes('fresh')) {
        matchesCat = cat.includes('frozen') || cat.includes('fresh');
      } else if (sel === 'wpff' || sel.includes('wpff') || sel.includes('wppf')) {
        matchesCat = cat.includes('wpff') || cat.includes('wppf');
      } else if (sel === 'static' || sel.includes('static')) {
        matchesCat = cat.includes('static');
      } else if (sel === 'beldia' || sel.includes('beld')) {
        matchesCat = cat.includes('beld');
      } else {
        matchesCat = cat.includes(sel) || sel.includes(cat);
      }

      // Search matching logic
      const matchesSearch =
        !query ||
        (p.title || '').toLowerCase().includes(query) ||
        (p.description || '').toLowerCase().includes(query) ||
        (p.category || '').toLowerCase().includes(query);

      return matchesCat && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

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
    <div className="space-y-4 pb-28 pt-1 px-3 sm:px-4 max-w-2xl mx-auto" id="home-view">
      
      {/* 1. COMPACT LUXURY HEADER - CENTERED */}
      <div className="pt-2.5 pb-3 flex flex-col items-center justify-center text-center border-b border-white/[0.08]">
        <h1 className="text-lg sm:text-xl font-black tracking-tight text-white uppercase flex items-center justify-center gap-2">
          <span className="bg-gradient-to-r from-[#f5ecd5] via-[#e5c158] to-[#d4af37] bg-clip-text text-transparent font-extrabold tracking-wide text-center">
            SECRET FARMZ
          </span>
        </h1>
        <p className="text-[10px] sm:text-[11px] font-mono text-zinc-400 uppercase tracking-widest mt-1 text-center">
          Reserve Collection • Live Menu
        </p>
      </div>

      {/* 2. GRANDE IMAGE HERO SECRET FARMZ (CINÉMATIQUE & MOBILE-PERFECT) */}
      <div className="relative w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-amber-400/25 bg-zinc-950 shadow-[0_10px_35px_rgba(0,0,0,0.7)] group">
        <div className="relative aspect-[16/8.5] sm:aspect-[21/9] w-full max-h-56 sm:max-h-64 overflow-hidden flex items-center justify-center bg-black">
          <img
            src={heroImageUrl}
            alt="SECRET FARMZ Visual Hero"
            className="w-full h-full object-cover object-center filter brightness-[0.92] contrast-[1.08] transition-transform duration-700 ease-out group-hover:scale-105"
            loading="eager"
            onError={(e) => {
              // Graceful fallback to logo if hero URL encounters an error
              if ((e.currentTarget as HTMLImageElement).src !== FALLBACK_LOGO) {
                (e.currentTarget as HTMLImageElement).src = FALLBACK_LOGO;
              }
            }}
          />

          {/* Ambient Subtle Golden Backlight Effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent pointer-events-none" />
          <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl sm:rounded-3xl pointer-events-none" />
        </div>
      </div>

      {/* 3 & 4. SECTION DE BIENVENUE PERSONNALISÉE TELEGRAM */}
      <div className="py-2 text-center space-y-1">
        <motion.h2 
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2"
        >
          <span>Salut</span>
          <span className="bg-gradient-to-r from-[#f8f5ee] via-[#e5c158] to-[#d4af37] bg-clip-text text-transparent font-extrabold">
            {userFirstName}
          </span>
          <span className="text-xl sm:text-2xl animate-bounce-subtle">👋</span>
        </motion.h2>

        <p className="text-xs sm:text-sm text-zinc-400 font-sans tracking-wide">
          Bienvenue chez SECRET FARMZ
        </p>
      </div>

      {/* 5. NAVIGATION / CATÉGORIES (HORIZONTALES ET SCROLLABLES) */}
      <div className="relative -mx-3 sm:-mx-4 px-3 sm:px-4 pt-1">
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
                className={`relative flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-mono text-xs font-black tracking-wider uppercase whitespace-nowrap transition-all duration-300 cursor-pointer shrink-0 border ${
                  isSelected
                    ? 'bg-gradient-to-r from-amber-500/25 via-yellow-500/20 to-amber-600/25 text-[#f3e8c8] border-[#e5c158]/80 shadow-[0_0_18px_rgba(229,193,88,0.3)] ring-1 ring-[#e5c158]/40'
                    : 'bg-zinc-900/80 hover:bg-zinc-800/90 text-zinc-400 hover:text-zinc-200 border-white/[0.08] hover:border-white/20'
                }`}
              >
                {Icon ? (
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#f3e8c8] animate-pulse' : 'text-zinc-400'}`} />
                ) : tab.emoji ? (
                  <span className="text-xs">{tab.emoji}</span>
                ) : null}

                <span>{tab.label}</span>

                {isSelected && (
                  <motion.div
                    layoutId="activeCategoryIndicator"
                    className="absolute inset-0 rounded-xl border border-[#e5c158]/80 pointer-events-none"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 6. CATALOGUE PRODUITS : TITRE SECTION & COMPTEUR */}
      <div className="pt-2 pb-1 flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <h2 className="text-sm sm:text-base font-black tracking-wider uppercase bg-gradient-to-r from-[#f8f5ee] via-[#e5c158] to-[#d4af37] bg-clip-text text-transparent drop-shadow-[0_1px_8px_rgba(229,193,88,0.25)]">
            {selectedCategory === 'Tous' || !selectedCategory ? 'TOUS LES PRODUITS' : selectedCategory.toUpperCase()}
          </h2>

          <div className="h-3 w-px bg-white/15" />

          <span className="text-[11px] font-mono text-zinc-400 font-medium tracking-tight">
            {filteredProducts.length} référence{filteredProducts.length > 1 ? 's' : ''}
          </span>
        </div>

        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-[11px] font-mono text-amber-300/90 hover:text-amber-200 hover:underline transition"
          >
            Effacer
          </button>
        )}
      </div>

      {/* 6. GRILLE DE PRODUITS LUXE (2 PAR LIGNE) */}
      {filteredProducts.length === 0 ? (
        <div className="py-14 text-center space-y-3 bg-zinc-950/70 rounded-2xl sm:rounded-3xl border border-dashed border-white/10 px-4 backdrop-blur-xl">
          <p className="text-zinc-400 font-mono text-xs">
            Aucun produit ne correspond à votre sélection dans cette catégorie.
          </p>
          <button
            onClick={() => {
              triggerHaptic('light');
              setSelectedCategory('Tous');
              setSearchQuery('');
            }}
            className="px-4 py-2 rounded-xl bg-amber-400/15 text-amber-200 border border-amber-400/40 font-mono text-xs font-bold hover:bg-amber-400/25 transition cursor-pointer"
          >
            Afficher Tous les Produits
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-3.5 pt-1">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((p, idx) => {
              const isFav = favorites.includes(p.id);

              return (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.15 } }}
                  transition={{ duration: 0.22, delay: Math.min(idx * 0.03, 0.25) }}
                  whileHover={{ scale: 1.015, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    triggerHaptic('medium');
                    onSelectProduct(p);
                  }}
                  className="group relative bg-gradient-to-b from-zinc-900/95 via-zinc-950/95 to-black border border-white/[0.08] hover:border-amber-400/50 rounded-2xl sm:rounded-[20px] overflow-hidden cursor-pointer transition-all duration-300 shadow-[0_8px_24px_rgba(0,0,0,0.5)] hover:shadow-[0_12px_32px_rgba(229,193,88,0.15)] flex flex-col justify-between backdrop-blur-xl h-full"
                >
                  {/* Media Thumbnail Container */}
                  <div className="relative aspect-[4/3.8] sm:aspect-square w-full bg-zinc-950 overflow-hidden border-b border-white/[0.05]">
                    <ProductCardMedia product={p} hoverScale={true} />

                    {/* Unified Badges */}
                    <div className="absolute top-2 left-2 z-10">
                      <span className="h-5 px-2 rounded-md bg-black/85 border border-[#e5c158]/40 text-[#f3e8c8] text-[8px] font-mono uppercase font-black tracking-wider backdrop-blur-md flex items-center shadow-sm">
                        {p.badge || p.category || 'PREMIUM'}
                      </span>
                    </div>

                    {/* Top Right Favorite Heart */}
                    {onToggleFavorite && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHaptic('light');
                          onToggleFavorite(p.id);
                        }}
                        className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/75 border border-white/10 text-white hover:text-red-400 active:scale-90 transition cursor-pointer backdrop-blur-md"
                        title="Favori"
                      >
                        <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
                      </button>
                    )}
                  </div>

                  {/* Product Info & Price Bar */}
                  <div className="p-3 sm:p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#e5c158]/90 truncate">
                        {p.category || 'SECRET FARMZ'}
                      </div>

                      <h4 className="text-xs sm:text-[13px] font-extrabold text-zinc-100 group-hover:text-[#f3e8c8] transition-colors uppercase leading-snug line-clamp-2 min-h-[2rem]">
                        {p.title}
                      </h4>

                      {p.description && (
                        <p className="text-[10px] text-zinc-400 line-clamp-1 font-sans leading-normal">
                          {p.description}
                        </p>
                      )}
                    </div>

                    {/* Price & CTA "VOIR →" */}
                    <div className="pt-2.5 flex items-center justify-between border-t border-white/[0.06] mt-auto">
                      <div>
                        <span className="text-xs sm:text-sm font-black font-mono text-[#e5c158] tracking-tight">
                          {p.price} €
                        </span>
                      </div>

                      <div className="px-2 py-1 rounded-lg bg-white/[0.04] group-hover:bg-[#e5c158]/20 border border-white/10 group-hover:border-[#e5c158]/50 text-[#f3e8c8] text-[9px] sm:text-[10px] font-mono font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-1 shadow-sm">
                        <span>VOIR</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </div>
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
