import React, { useState, useMemo, MouseEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Plus,
  Check,
  CheckCircle2,
  ChevronRight,
  Layers,
  ShoppingBag,
  Zap,
  Snowflake,
  Gem,
  Flame,
  Award
} from 'lucide-react';
import { VideoItem, BrandingSettings } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import ProductCardMedia from './ProductCardMedia';

interface HomeViewProps {
  branding: BrandingSettings | null;
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

function getCategoryDisplay(rawCategory?: string): { emoji: string; label: string } {
  if (!rawCategory) return { emoji: '🏷️', label: 'EXCLUSIF' };
  const cat = rawCategory.trim().toUpperCase();
  if (cat.includes('STATIC')) return { emoji: '🧤', label: 'STATIC' };
  if (cat.includes('FROZEN') || cat.includes('FRESH')) return { emoji: '🧊', label: 'FROZEN SIFT' };
  if (cat.includes('WPFF') || cat.includes('WPPF')) return { emoji: '💎', label: 'WPFF' };
  if (cat.includes('DRY')) return { emoji: '🍯', label: 'DRY SIFT' };
  if (cat.includes('BELD')) return { emoji: '🇲🇦', label: 'BELDIA' };
  if (cat.includes('ACCESSOIRE') || cat.includes('ACC')) return { emoji: '🎒', label: 'ACCESSOIRES' };
  if (cat.includes('MEET') || cat.includes('RABAT')) return { emoji: '📍', label: rawCategory.toUpperCase() };
  if (cat.includes('FILTR')) return { emoji: '🔬', label: rawCategory.toUpperCase() };
  return { emoji: '🏷️', label: rawCategory.toUpperCase() };
}

export default function HomeView({
  branding,
  products,
  selectedCategory,
  setSelectedCategory,
  favorites = [],
  onToggleFavorite,
  onSelectProduct,
  onQuickAddToCart,
  onNavigateTab,
  triggerHaptic,
  showToast
}: HomeViewProps) {
  const { t } = useLanguage();
  const [activeCollection, setActiveCollection] = useState<string>('All');
  const [addedToast, setAddedToast] = useState<{ visible: boolean; title: string }>({ visible: false, title: '' });

  const collections = [
    {
      id: 'All',
      title: '🌐 CATALOGUE GLOBAL',
      emoji: '🌐',
      icon: ShoppingBag,
      gradient: 'from-amber-500/20 via-yellow-500/15 to-transparent',
      borderColor: 'border-amber-500/40',
      activeGlow: 'shadow-[0_0_30px_rgba(245,158,11,0.35)] border-amber-400',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      description: 'Découvrez l’ensemble des références disponibles.'
    },
    {
      id: 'Dry Sift',
      title: 'DRY SIFT 🫙',
      emoji: '🫙',
      icon: Layers,
      gradient: 'from-amber-600/20 via-yellow-600/15 to-transparent',
      borderColor: 'border-amber-600/40',
      activeGlow: 'shadow-[0_0_30px_rgba(217,119,6,0.3)] border-amber-500',
      badgeBg: 'bg-amber-600/20 text-amber-300 border-amber-600/40',
      description: 'Extraction à sec traditionnelle et arômes purs.'
    },
    {
      id: 'Beldia',
      title: 'BELDIA 🇲🇦',
      emoji: '🇲🇦',
      icon: Award,
      gradient: 'from-emerald-500/20 via-green-500/15 to-transparent',
      borderColor: 'border-emerald-500/40',
      activeGlow: 'shadow-[0_0_30px_rgba(16,185,129,0.3)] border-emerald-400',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      description: 'Sélection Beldia authentique, terroir d’exception.'
    },
    {
      id: 'Static',
      title: 'STATIC 🧤',
      emoji: '🧤',
      icon: Gem,
      gradient: 'from-amber-500/20 via-yellow-500/15 to-transparent',
      borderColor: 'border-amber-500/40',
      activeGlow: 'shadow-[0_0_30px_rgba(245,158,11,0.3)] border-amber-400',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      description: 'Sifting électrostatique d’élite, clarté cristalline.'
    },
    {
      id: 'Frozen',
      title: 'FROZEN SIFT 🧊',
      emoji: '🧊',
      icon: Snowflake,
      gradient: 'from-blue-500/20 via-cyan-500/15 to-transparent',
      borderColor: 'border-cyan-500/40',
      activeGlow: 'shadow-[0_0_30px_rgba(6,182,212,0.3)] border-cyan-400',
      badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      description: 'Extractions vivantes et terpènes purs à basse température.'
    },
    {
      id: 'WPFF',
      title: 'WPFF 🧈',
      emoji: '🧈',
      icon: Flame,
      gradient: 'from-orange-500/20 via-amber-600/15 to-transparent',
      borderColor: 'border-orange-500/40',
      activeGlow: 'shadow-[0_0_30px_rgba(249,115,22,0.3)] border-orange-400',
      badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
      description: 'Whole Plant Fresh Frozen d’exception.'
    }
  ];

  const handleQuickAdd = (p: VideoItem, e: MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('medium');
    if (onQuickAddToCart) {
      onQuickAddToCart(p);
    }
    if (showToast) {
      showToast(`"${p.title}" ${t('productAddedToast')}`, 'success');
    }
    setAddedToast({ visible: true, title: p.title });
    setTimeout(() => {
      setAddedToast({ visible: false, title: '' });
    }, 2400);
  };

  // Filter products by selected collection
  const collectionProducts = useMemo(() => {
    if (!products) return [];
    return products.filter((p) => {
      const cat = (p.category || '').toLowerCase();
      const colId = activeCollection.toLowerCase();
      if (colId === 'all') return true;
      if (colId === 'dry sift' || colId.includes('dry')) return cat.includes('dry') || cat.includes('sift');
      if (colId === 'beldia' || colId.includes('beld')) return cat.includes('beld');
      if (colId === 'frozen') return cat.includes('frozen') || cat.includes('fresh');
      if (colId === 'static') return cat.includes('static');
      if (colId === 'wpff' || colId === 'wppf') return cat.includes('wpff') || cat.includes('wppf');
      return true;
    });
  }, [products, activeCollection]);

  return (
    <div className="space-y-8 pb-20 pt-1 px-3 sm:px-4 max-w-2xl mx-auto" id="home-view">
      
      {/* QUICK ADD TO CART TOAST */}
      <AnimatePresence>
        {addedToast.visible && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-2xl bg-black/90 border border-amber-500/60 text-white font-mono text-xs font-bold shadow-[0_10px_35px_rgba(245,158,11,0.35)] flex items-center gap-3 backdrop-blur-xl pointer-events-none"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-orange-400 text-black flex items-center justify-center font-black shadow-md">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold text-xs uppercase tracking-wide">Ajouté au panier</span>
              <span className="text-[10px] text-amber-400 font-mono truncate max-w-[160px]">
                {addedToast.title}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. IMMERSIVE HERO BANNER */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden bg-transparent py-4 text-center"
      >
        <div className="relative z-10 py-2">
          <h1 className="text-3xl sm:text-5xl font-black font-sans tracking-tight text-white leading-tight uppercase drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)]">
            <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500 bg-clip-text text-transparent">
              Biscotti Boys Farm 🍇
            </span>
          </h1>
        </div>
      </motion.div>

      {/* 2. COLLECTIONS CARDS (STATIC, FROZEN SIFT, WPFF) */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3.5">
          {collections.map((col) => {
            const isSelected = activeCollection === col.id;
            const count = products.filter((p) => {
              const cat = (p.category || '').toLowerCase();
              if (col.id === 'All') return true;
              if (col.id === 'Dry Sift') return cat.includes('dry') || cat.includes('sift');
              if (col.id === 'Beldia') return cat.includes('beld');
              if (col.id === 'Frozen') return cat.includes('frozen') || cat.includes('fresh');
              if (col.id === 'Static') return cat.includes('static');
              if (col.id === 'WPFF' || col.id === 'WPPF') return cat.includes('wpff') || cat.includes('wppf');
              return false;
            }).length;

            return (
              <motion.div
                key={col.id}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  triggerHaptic('medium');
                  setActiveCollection(col.id);
                }}
                className={`relative overflow-hidden rounded-3xl p-5 border transition-all duration-300 cursor-pointer bg-black/40 backdrop-blur-xl ${
                  isSelected
                    ? `${col.gradient} ${col.activeGlow}`
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-center text-2xl shadow-inner">
                      {col.emoji}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h3 className="font-mono text-base font-black tracking-wider text-white uppercase">
                          {col.title}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${col.badgeBg}`}>
                          {count} produit{count > 1 ? 's' : ''}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 font-sans leading-tight">
                        {col.description}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-amber-400 text-black border-amber-300 shadow-md'
                        : 'bg-black/40 border-white/10 text-neutral-500'
                    }`}
                  >
                    <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 3. PRODUCT GRID FOR SELECTED COLLECTION */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-mono font-extrabold tracking-widest text-amber-400 uppercase flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {activeCollection === 'All'
                ? `🌐 CATALOGUE GLOBAL (${collectionProducts.length})`
                : `COLLECTION ${activeCollection.toUpperCase()} (${collectionProducts.length})`}
            </span>
          </h3>
          <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>AVAILABLE</span>
          </span>
        </div>

        {collectionProducts.length === 0 ? (
          <div className="p-8 rounded-3xl bg-black/40 backdrop-blur-xl border border-dashed border-white/10 text-center space-y-2">
            <p className="text-xs font-mono text-neutral-400">
              Aucun produit disponible dans cette collection actuellement.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
            <AnimatePresence mode="popLayout">
              {collectionProducts.map((p, idx) => (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                  transition={{ duration: 0.25, delay: idx * 0.04 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    triggerHaptic('medium');
                    onSelectProduct(p);
                  }}
                  className="group relative bg-black/40 backdrop-blur-xl border border-white/10 hover:border-amber-500/50 rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 shadow-xl flex flex-col justify-between"
                >
                  {/* Large High-Res Image Container */}
                  <div className="relative aspect-square w-full bg-black/60 overflow-hidden">
                    <ProductCardMedia product={p} hoverScale={true} />

                    {/* "Available" Glow Badge */}
                    <div className="absolute top-2.5 left-2.5 z-10">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-mono font-black text-[8px] uppercase tracking-wider backdrop-blur-md shadow-md flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        AVAILABLE
                      </span>
                    </div>
                  </div>

                  {/* Clean Content Area */}
                  <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                    <div className="space-y-1">
                      {/* Category Badge - visible in TOUS LES PRODUITS / Catalogue Global view */}
                      {activeCollection === 'All' && (
                        <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-mono font-black text-amber-400 uppercase tracking-wider">
                          <span>{getCategoryDisplay(p.category).emoji}</span>
                          <span className="truncate">{getCategoryDisplay(p.category).label}</span>
                        </div>
                      )}

                      <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-400 transition truncate uppercase">
                        {p.title}
                      </h4>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-white/5">
                      <div>
                        <span className="text-[11px] sm:text-xs font-black font-mono text-amber-400">
                          {(p.category || '').toLowerCase().includes('accessoire') ? `${p.price} €` : `${p.price} €`}
                        </span>
                      </div>

                      {/* Discrete "+" Button */}
                      <button
                        onClick={(e) => handleQuickAdd(p, e)}
                        className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-400 hover:text-black transition cursor-pointer active:scale-90 shadow-sm"
                        title="Ajouter au panier"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

    </div>
  );
}
