/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ShoppingBag, 
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Award,
  ShieldCheck,
  Check
} from 'lucide-react';
import { VideoItem, getPriceForSize, getSizeOptionsForCategory } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

interface ProductDetailModalProps {
  product: VideoItem;
  onClose: () => void;
  onAddToCart: (p: VideoItem, size: string, color: { name: string; hex: string; imageUrl: string }) => void;
  onInstantBuy: (p: VideoItem, size: string, color: { name: string; hex: string; imageUrl: string }) => void;
  triggerHaptic: (style: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error', customMessage?: string) => void;
}

// Default standard colors
const DEFAULT_COLORS = [
  { name: 'Noir Profond', hex: '#000000', imageUrl: '' },
  { name: 'Or Pur', hex: '#D4AF37', imageUrl: '' },
  { name: 'Ambre Élite', hex: '#9A7B1C', imageUrl: '' }
];

export default function ProductDetailModal({
  product,
  onClose,
  onAddToCart,
  onInstantBuy,
  triggerHaptic
}: ProductDetailModalProps) {
  const { t } = useLanguage();

  // Dynamically configure gram weights depending on product category
  const sizeOptions = useMemo(() => {
    return getSizeOptionsForCategory(product.category);
  }, [product.category]);

  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const isOutOfStock = useMemo(() => {
    return product.status === 'out_of_stock' || 
           product.stock === 0 || 
           product.badge === 'OUT_OF_STOCK' || 
           product.badge === 'OUT' || 
           product.badge === 'OUT OF STOCK';
  }, [product]);

  // Auto-reset selectedSize when product changes so there is NO initial pre-selection
  useEffect(() => {
    setSelectedSize(null);
  }, [product.id]);

  // Pricing calculation based on selectedSize
  const computedPrice = useMemo(() => {
    if (!selectedSize) {
      return product.price;
    }
    return getPriceForSize(product.price, selectedSize, product.category);
  }, [product.price, selectedSize, product.category]);
  
  // Clean default single color to satisfy types
  const selectedColor = useMemo(() => {
    const list = product.colors && product.colors.length > 0 ? product.colors : DEFAULT_COLORS;
    return list[0] || { name: 'Gold', hex: '#D4AF37', imageUrl: '' };
  }, [product]);

  const [activeSlide, setActiveSlide] = useState<number>(0);
  const [imageError, setImageError] = useState<boolean>(false);
  const [mediaActiveTab, setMediaActiveTab] = useState<'photo' | 'video'>(
    product.videoUrl && product.videoUrl.trim() !== '' ? 'video' : 'photo'
  );

  // Reset image error state when navigating slides or active tab or product change
  useEffect(() => {
    setImageError(false);
  }, [activeSlide, product.id, mediaActiveTab]);

  // Compile full list of images
  const slides = useMemo(() => {
    const list: string[] = [];
    
    // 1. Core thumbnail
    if (product.thumbnailUrl && product.thumbnailUrl.trim() !== '' && !product.thumbnailUrl.includes('/input_file')) {
      list.push(product.thumbnailUrl);
    }
    
    // 2. Selected color swatch image
    if (selectedColor && selectedColor.imageUrl && selectedColor.imageUrl.trim() !== '' && !list.includes(selectedColor.imageUrl)) {
      list.push(selectedColor.imageUrl);
    }

    // 3. User sub-uploaded images
    if (product.additionalPhotos && product.additionalPhotos.length > 0) {
      product.additionalPhotos.forEach(urlStr => {
        if (urlStr && urlStr.trim() !== '' && !list.includes(urlStr)) {
          list.push(urlStr);
        }
      });
    }
    
    return list;
  }, [product, selectedColor]);

  const handleNextSlide = () => {
    triggerHaptic('light');
    setActiveSlide(prev => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const handlePrevSlide = () => {
    triggerHaptic('light');
    setActiveSlide(prev => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/75 backdrop-blur-md overflow-hidden p-0 md:p-4 animate-fade-in"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 220 }}
        className="w-full h-[92vh] md:h-auto md:max-h-[92vh] max-w-2xl bg-gradient-to-br from-[#0a0a0a] to-black text-white md:rounded-3xl overflow-hidden flex flex-col md:grid md:grid-cols-2 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.5)] border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CLOSE BUTTON FOR MOBILE - Top right */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-black/80 backdrop-blur-md border border-neutral-800 text-orange-400 hover:bg-orange-500 hover:text-black transition duration-300 shadow-md cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* LEFT COLUMN: VISUAL GALLERY AND IMAGE SLIDESHOW */}
        <div className="relative aspect-[4/5] md:aspect-auto md:h-full bg-gradient-to-b from-[#0a0a0a]/50 to-black/40 overflow-hidden flex flex-col justify-between">
          
          {/* Photos vs Video Tab selection panel */}
          {product.videoUrl && product.videoUrl.trim() !== '' && (
            <div className="absolute top-[4.5rem] left-4 z-30 flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic('light');
                  setMediaActiveTab('photo');
                }}
                className={`px-3 py-1.5 rounded-full text-[9px] font-mono font-extrabold tracking-widest uppercase border transition duration-300 shadow-md cursor-pointer ${
                  mediaActiveTab === 'photo'
                    ? 'bg-white text-black border-white'
                    : 'bg-black/80 text-gray-400 border-white/5 hover:text-white hover:border-white/15'
                }`}
              >
                📷 Photos ({slides.length})
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic('light');
                  setMediaActiveTab('video');
                }}
                className={`px-3 py-1.5 rounded-full text-[9px] font-mono font-extrabold tracking-widest uppercase border transition duration-300 shadow-md cursor-pointer ${
                  mediaActiveTab === 'video'
                    ? 'bg-orange-400 text-black border-orange-400 font-black animate-pulse'
                    : 'bg-black/80 text-gray-400 border-white/5 hover:text-white hover:border-orange-400/55'
                }`}
              >
                🎬 Vidéo
              </button>
            </div>
          )}

          {/* Media box */}
          <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-b from-[#0a0a0a]/30 to-black/20">
            {mediaActiveTab === 'video' && product.videoUrl && product.videoUrl.trim() !== '' ? (
              <video
                src={product.videoUrl}
                className="w-full h-full object-contain bg-transparent"
                controls
                autoPlay
                muted
                playsInline
                loop
                referrerPolicy="no-referrer"
              />
            ) : slides.length > 0 && !imageError ? (
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeSlide}
                  src={slides[activeSlide] || undefined}
                  alt={`${product.title} view`}
                  initial={{ opacity: 0, scale: 1.03 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="w-full h-full object-contain bg-transparent"
                  loading="eager"
                  onError={() => {
                    setImageError(true);
                  }}
                />
              </AnimatePresence>
            ) : (
              <div className="w-full h-full bg-gradient-to-b from-neutral-950 to-[#040404] flex flex-col justify-center items-center text-center p-6 relative font-mono select-none">
                <div className="absolute inset-4 border border-dashed border-orange-900/10 rounded-2xl pointer-events-none" />
                <div className="w-14 h-14 rounded-full border border-orange-900/30 flex items-center justify-center bg-black/85 text-orange-400 text-base font-black tracking-widest mb-4 shadow-2xl relative overflow-hidden">
                  <span className="relative z-10">N/A</span>
                </div>
                <span className="text-[10px] uppercase font-black tracking-[0.25em] text-orange-400 mb-1">
                  DRYTECH
                </span>
                <span className="text-[8px] uppercase font-bold text-neutral-400 tracking-[0.12em] block">
                  Média indisponible
                </span>
              </div>
            )}
          </div>

          {/* Premium tag overlay */}
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 pointer-events-none">
            <span className="bg-black/90 backdrop-blur-md border border-orange-500/50 text-orange-400 text-[8px] font-mono font-extrabold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full shadow-md">
              DRYTECH — PRIVATE RESERVE
            </span>
          </div>

          {/* Nav arrows */}
          {slides.length > 1 && (
            <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 flex justify-between items-center pointer-events-none z-10">
              <button
                onClick={handlePrevSlide}
                className="w-9 h-9 rounded-full bg-black/95 backdrop-blur-sm shadow border border-neutral-800 text-orange-400 pointer-events-auto flex items-center justify-center hover:bg-orange-500 hover:text-black duration-300"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextSlide}
                className="w-9 h-9 rounded-full bg-black/95 backdrop-blur-sm shadow border border-neutral-800 text-orange-400 pointer-events-auto flex items-center justify-center hover:bg-orange-500 hover:text-black duration-300"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Bottom slides count dots */}
          {slides.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-black/85 backdrop-blur-md shadow-md border border-neutral-900 px-2.5 py-1 rounded-full flex gap-1.5 items-center">
              {slides.map((_, i) => (
                <span 
                  key={i} 
                  className={`w-1.5 h-1.5 rounded-full duration-300 ${i === activeSlide ? 'bg-orange-400 w-3' : 'bg-neutral-800'}`} 
                />
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: BRAND DETAILS, SELECTIONS AND PRICING */}
        <div className="p-6 md:p-8 flex flex-col justify-between overflow-y-auto h-full scrollbar-none bg-gradient-to-b from-[#080808] to-black">
          <div className="space-y-6">
            
            {/* Category / Collection Tag */}
            <div className="flex items-center justify-between gap-1.5 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-[10px] font-mono text-orange-400 tracking-[0.2em] uppercase font-bold">
                  {product.category} • DRYTECH
                </span>
              </div>
              {isOutOfStock && (
                <div className="bg-red-950/40 border border-red-500/35 text-red-500 font-mono font-bold text-[8.5px] px-2.5 py-1 rounded-full uppercase tracking-wider animate-pulse flex items-center gap-1.5 font-extrabold shadow-[0_0_8px_rgba(239,68,68,0.15)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
                  {t('outOfStock')}
                </div>
              )}
            </div>

            {/* Product Title inside dialog */}
            <div>
              <h1 className="font-mono text-2xl md:text-3xl font-medium text-[#FCFAF6] uppercase tracking-wide">
                {product.title}
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex text-amber-500 text-xs shrink-0 tracking-tighter">
                  {"★".repeat(Math.round(product.rating || 5))}
                  {"☆".repeat(5 - Math.round(product.rating || 5))}
                </div>
                <span className="text-[10px] text-neutral-400 font-light font-mono font-bold">
                  {product.rating || "4.9"} ({product.reviewCount || 42})
                </span>
              </div>
              <div className="flex flex-col gap-1 mt-2.5">
                <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block">
                  {!(product.category || '').toLowerCase().includes('accessoire') ? 'PRIX AU GRAMME :' : 'PRIX UNITAIRE :'} {(product.category || '').toLowerCase().includes('accessoire') ? `${product.price} €` : `${product.price} €/g`}
                </span>
                <AnimatePresence mode="wait">
                  {!selectedSize ? (
                    <motion.div 
                      key="no-selection"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      className="flex items-baseline gap-2.5 mt-0.5"
                    >
                      <span className="font-mono text-2xl font-black text-neutral-300 bg-black/60 px-3 py-1 rounded border border-white/5 shadow-md">
                        {(product.category || '').toLowerCase().includes('accessoire') ? `${product.price} €` : `${product.price} €/g`}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-500 tracking-wider">
                        {t('chooseSize')}
                      </span>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="with-selection"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      className="flex items-baseline gap-2.5 mt-0.5"
                    >
                      <span className="font-mono text-2xl font-black text-black bg-orange-400 px-3 py-1 rounded border border-orange-400 shadow-lg">
                        {computedPrice} €
                      </span>
                      <span className="text-[10px] font-mono text-orange-400 font-bold tracking-wider uppercase">
                        Total pour <b className="text-white bg-black px-1.5 py-0.5 rounded border border-white/5 font-extrabold font-mono">{selectedSize}</b>
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Micro details pills */}
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="text-[9px] font-mono tracking-wider uppercase border border-white/5 text-orange-400 bg-black/60 px-2.5 py-1 rounded">
                Origine Certifiée
              </span>
              <span className="text-[9px] font-mono tracking-wider uppercase border border-white/5 text-neutral-300 bg-black/60 px-2.5 py-1 rounded">
                Produit Premium
              </span>
              <span className="text-[9px] font-mono tracking-wider uppercase border border-white/5 text-neutral-300 bg-black/60 px-2.5 py-1 rounded">
                Livraison Discrète
              </span>
            </div>

            {/* Description */}
            <p className="text-xs pt-1 text-neutral-300 leading-relaxed font-mono font-light">
              {product.description}
            </p>

            <hr className="border-neutral-900" />

            {/* WEIGHT SELECTION SECTION */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px] uppercase font-mono font-bold text-neutral-500 tracking-wider">
                <span>{(product.category || '').toLowerCase().includes('accessoire') ? 'Quantité / Unités :' : 'Quantité / Poids :'}</span>
                <span className="text-gray-400 font-normal">Sachet d'origine</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {sizeOptions.map((sz) => {
                  const isSelected = selectedSize === sz;
                  return (
                    <button
                      key={sz}
                      disabled={isOutOfStock}
                      onClick={() => {
                        if (isOutOfStock) return;
                        triggerHaptic('medium');
                        setSelectedSize(sz);
                      }}
                      className={`flex-1 py-2 text-xs font-mono font-medium rounded-lg border tracking-wide transition-all duration-300 ${
                        isOutOfStock
                          ? 'bg-black/10 border-white/5 text-neutral-600 cursor-not-allowed opacity-55'
                          : isSelected 
                            ? 'bg-orange-400 border-orange-400 text-black font-extrabold shadow-md cursor-pointer' 
                            : 'bg-black/60 border-white/5 text-neutral-300 hover:border-orange-500/50 hover:text-orange-400 cursor-pointer'
                      }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Trust icons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-black/50 border border-white/5 flex gap-2 items-center backdrop-blur-md">
                <Award className="w-4 h-4 text-orange-400" />
                <span className="text-[9px] font-mono text-neutral-300 uppercase tracking-wider font-medium leading-none">
                  Excellence Validée
                </span>
              </div>
              <div className="p-3 rounded-xl bg-black/50 border border-white/5 flex gap-2 items-center backdrop-blur-md">
                <ShieldCheck className="w-4 h-4 text-orange-400" />
                <span className="text-[9px] font-mono text-neutral-300 uppercase tracking-wider font-medium leading-none">
                  Service Client 24/7
                </span>
              </div>
            </div>

          </div>

          {/* CTA BAR */}
          <div className="space-y-2.5 mt-8 md:mt-12">
            {isOutOfStock ? (
              <>
                <button
                  disabled
                  className="w-full py-4 rounded-xl border border-neutral-800 bg-black/45 text-neutral-500 cursor-not-allowed flex items-center justify-center gap-2 font-semibold text-xs tracking-[0.2em] uppercase transition-all duration-300 opacity-80"
                >
                  <ShoppingBag className="w-4 h-4 text-neutral-600" />
                  <span>{t('outOfStock')}</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    if (!selectedSize) {
                      triggerHaptic('warning');
                      return;
                    }
                    triggerHaptic('success');
                    onAddToCart(product, selectedSize, selectedColor);
                  }}
                  className={`w-full py-4 rounded-xl border font-semibold text-xs tracking-[0.2em] uppercase duration-300 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99] ${
                    selectedSize 
                      ? 'border-orange-500/50 bg-black/60 text-orange-400 hover:bg-orange-500/10 shadow-md' 
                      : 'border-white/5 bg-black/30 text-neutral-500 opacity-60'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{selectedSize ? t('addToCart') : t('chooseSize')}</span>
                </button>

                <button
                  onClick={() => {
                    if (!selectedSize) {
                      triggerHaptic('warning');
                      return;
                    }
                    triggerHaptic('heavy');
                    onInstantBuy(product, selectedSize, selectedColor);
                  }}
                  className={`w-full py-4 rounded-xl font-extrabold text-xs tracking-[0.2em] uppercase duration-300 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99] shadow-lg ${
                    selectedSize 
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-black hover:opacity-90' 
                      : 'bg-black/40 text-neutral-600 cursor-not-allowed border border-white/5'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{selectedSize ? t('checkoutBtn') : t('chooseSize')}</span>
                </button>
              </>
            )}

            <p className="text-[8px] text-center text-neutral-500 tracking-wider font-mono uppercase">
              🔒 Livraison rapide et discrète
            </p>
          </div>

        </div>
      </motion.div>
    </motion.div>
  );
}

