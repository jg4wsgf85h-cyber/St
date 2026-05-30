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
import { VideoItem, getPriceForSize } from '../types';

interface ProductDetailModalProps {
  product: VideoItem;
  onClose: () => void;
  onAddToCart: (p: VideoItem, size: string, color: { name: string; hex: string; imageUrl: string }) => void;
  onInstantBuy: (p: VideoItem, size: string, color: { name: string; hex: string; imageUrl: string }) => void;
  triggerHaptic: (style: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error', customMessage?: string) => void;
}

// Default standard colors for Omerta variations, with image URLs cleaned per user request
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
  // Dynamically configure gram weights depending on product category
  const sizeOptions = useMemo(() => {
    const cat = (product.category || '').trim().toLowerCase();
    if (cat.includes('static')) {
      return ['5g', '10g', '20g'];
    } else if (cat.includes('frozen')) {
      return ['25g', '50g', '100g'];
    } else if (cat.includes('dry')) {
      return ['25g', '50g', '100g'];
    } else if (cat.includes('meet up') || cat.includes('rabat') || cat.includes('meet up rabat')) {
      return ['10g'];
    } else if (cat.includes('accessoire') || cat.includes('accessories')) {
      return ['Unique'];
    }
    return ['5g', '10g', '20g'];
  }, [product.category]);

  const [selectedSize, setSelectedSize] = useState<string | null>(null);

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
  
  // Clean default single color to satisfy types silently without user interface decoration
  const selectedColor = useMemo(() => {
    const list = product.colors && product.colors.length > 0 ? product.colors : DEFAULT_COLORS;
    return list[0] || { name: 'Gold', hex: '#D4AF37', imageUrl: '' };
  }, [product]);

  const [activeSlide, setActiveSlide] = useState<number>(0);
  const [mediaActiveTab, setMediaActiveTab] = useState<'photo' | 'video'>(
    product.videoUrl && product.videoUrl.trim() !== '' ? 'video' : 'photo'
  );

  // Compile full list of premium images (omit any null, empty, or dummy inputs)
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
        className="w-full h-[92vh] md:h-auto md:max-h-[92vh] max-w-2xl bg-[#080808] text-[#FCFAF6] md:rounded-3xl overflow-hidden flex flex-col md:grid md:grid-cols-2 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.5)] border border-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CLOSE BUTTON FOR MOBILE - Top right */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-black/80 backdrop-blur-md border border-neutral-800 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition duration-300 shadow-md cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* LEFT COLUMN: VISUAL GALLERY AND IMAGE SLIDESHOW */}
        <div className="relative aspect-[4/5] md:aspect-auto md:h-full bg-black overflow-hidden flex flex-col justify-between">
          
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
                    : 'bg-black/80 text-gray-400 border-neutral-800 hover:text-white hover:border-neutral-700'
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
                    ? 'bg-[#D4AF37] text-black border-[#D4AF37] font-black animate-pulse'
                    : 'bg-black/80 text-gray-400 border-neutral-800 hover:text-white hover:border-[#D4AF37]/50'
                }`}
              >
                🎬 Vidéo active
              </button>
            </div>
          )}

          {/* Media box */}
          <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-black">
            {mediaActiveTab === 'video' && product.videoUrl && product.videoUrl.trim() !== '' ? (
              <video
                src={product.videoUrl}
                className="w-full h-full object-contain bg-black"
                controls
                autoPlay
                muted
                playsInline
                loop
                referrerPolicy="no-referrer"
              />
            ) : slides.length > 0 ? (
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeSlide}
                  src={slides[activeSlide] || undefined}
                  alt={`${product.title} view`}
                  initial={{ opacity: 0, scale: 1.03 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="w-full h-full object-contain bg-black"
                  loading="eager"
                />
              </AnimatePresence>
            ) : (
              <div className="w-full h-full bg-gradient-to-b from-neutral-950 to-[#040404] flex flex-col justify-center items-center text-center p-6 relative font-mono select-none">
                <div className="absolute inset-4 border border-dashed border-neutral-900/50 rounded-2xl pointer-events-none" />
                <div className="w-14 h-14 rounded-full border border-[#D4AF37]/25 flex items-center justify-center bg-black/85 text-[#D4AF37] text-base font-black tracking-widest mb-4 shadow-2xl relative overflow-hidden">
                  <span className="relative z-10">{product.category ? product.category.substring(0, 2).toUpperCase() : 'Ω'}</span>
                  <div className="absolute inset-0 bg-radial from-[#D4AF37]/5 to-transparent animate-pulse" />
                </div>
                <span className="text-[10px] uppercase font-black tracking-[0.25em] text-[#D4AF37] mb-1">
                  SECURE VAULT
                </span>
                <span className="text-[8px] uppercase font-bold text-neutral-500 tracking-[0.12em] block">
                  Excellence sans illustration
                </span>
                <div className="w-12 h-[1px] bg-neutral-900 my-4" />
                <div className="text-[7.5px] text-neutral-600 uppercase tracking-widest">
                  Discrétion SSL active
                </div>
              </div>
            )}
          </div>

          {/* Premium tag overlay */}
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 pointer-events-none">
            <span className="bg-black/90 backdrop-blur-md border border-[#D4AF37]/50 text-[#D4AF37] text-[8px] font-mono font-extrabold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full shadow-md">
              RÉSERVE PRIVÉE HASH'N FLASH MOCRO
            </span>
          </div>

          {/* Nav arrows */}
          {slides.length > 1 && (
            <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 flex justify-between items-center pointer-events-none z-10">
              <button
                onClick={handlePrevSlide}
                className="w-9 h-9 rounded-full bg-black/95 backdrop-blur-sm shadow border border-neutral-800 text-[#D4AF37] pointer-events-auto flex items-center justify-center hover:bg-[#D4AF37] hover:text-black duration-300"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextSlide}
                className="w-9 h-9 rounded-full bg-black/95 backdrop-blur-sm shadow border border-neutral-800 text-[#D4AF37] pointer-events-auto flex items-center justify-center hover:bg-[#D4AF37] hover:text-black duration-300"
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
                  className={`w-1.5 h-1.5 rounded-full duration-300 ${i === activeSlide ? 'bg-[#D4AF37] w-3' : 'bg-neutral-800'}`} 
                />
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: BRAND DETAILS, SELECTIONS AND PRICING */}
        <div className="p-6 md:p-8 flex flex-col justify-between overflow-y-auto h-full scrollbar-none bg-[#080808]">
          <div className="space-y-6">
            
            {/* Category / Collection Tag */}
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="text-[10px] font-mono text-[#D4AF37] tracking-[0.2em] uppercase font-bold">
                {product.category} • HASH'N FLASH MOCRO VAULT
              </span>
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
                  {product.rating || "4.9"} ({product.reviewCount || 42} certifiés)
                </span>
              </div>
              <div className="flex flex-col gap-1 mt-2.5">
                <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block">
                  {!(product.category || '').toLowerCase().includes('accessoire') ? 'PRIX AU GRAMME :' : 'PRIX UNITAIRE :'} {product.price} MAD {!(product.category || '').toLowerCase().includes('accessoire') ? '/g' : ''}
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
                      <span className="font-mono text-2xl font-black text-neutral-400 bg-neutral-900/50 px-3 py-1 rounded border border-neutral-900 shadow-md">
                        {product.price} MAD {!(product.category || '').toLowerCase().includes('accessoire') ? '/g' : ''}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-500 tracking-wider">
                        Sélectionnez un poids
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
                      <span className="font-mono text-2xl font-black text-black bg-[#D4AF37] px-3 py-1 rounded border border-[#D4AF37] shadow-lg shadow-[#D4AF37]/10">
                        {computedPrice} MAD
                      </span>
                      <span className="text-[10px] font-mono text-[#D4AF37] font-bold tracking-wider uppercase">
                        Total pour <b className="text-[#FCFAF6] bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800 font-extrabold font-mono">{selectedSize}</b>
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Micro details pills */}
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="text-[9px] font-mono tracking-wider uppercase border border-neutral-900 text-[#D4AF37] bg-black px-2.5 py-1 rounded">
                Origine Certifiée
              </span>
              <span className="text-[9px] font-mono tracking-wider uppercase border border-neutral-900 text-neutral-400 bg-black px-2.5 py-1 rounded">
                Filtration Glacée
              </span>
              <span className="text-[9px] font-mono tracking-wider uppercase border border-neutral-900 text-neutral-400 bg-black px-2.5 py-1 rounded">
                Zéro Log Data
              </span>
            </div>

            {/* Elegant description */}
            <p className="text-xs pt-1 text-neutral-300 leading-relaxed font-mono font-light">
              {product.description}
            </p>

            <hr className="border-neutral-900" />

            {/* WEIGHT SELECTION SECTION */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px] uppercase font-mono font-bold text-neutral-500 tracking-wider">
                <span>Quantité / Poids :</span>
                <span className="text-gray-400 font-normal">Sachet cacheté d'origine</span>
              </div>

              <div className="flex gap-2">
                {sizeOptions.map((sz) => {
                  const isSelected = selectedSize === sz;
                  return (
                    <button
                      key={sz}
                      onClick={() => {
                        triggerHaptic('medium');
                        setSelectedSize(sz);
                      }}
                      className={`flex-1 py-2 text-xs font-mono font-medium rounded-lg border tracking-wide transition-all duration-300 cursor-pointer ${
                        isSelected 
                          ? 'bg-[#D4AF37] border-[#D4AF37] text-black font-extrabold shadow-md' 
                          : 'bg-black border-neutral-950 text-neutral-400 hover:border-neutral-800 hover:text-[#D4AF37]'
                      }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Luxury trust icons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-lg bg-black border border-neutral-900 flex gap-2 items-center">
                <Award className="w-4 h-4 text-[#D4AF37]" />
                <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider font-medium leading-none">
                  Excellence Validée
                </span>
              </div>
              <div className="p-3 rounded-lg bg-black border border-neutral-900 flex gap-2 items-center">
                <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider font-medium leading-none">
                  Liaison 100% Chiffrée
                </span>
              </div>
            </div>

          </div>

          {/* CTA BAR - Add to cart and Instant Express purchase */}
          <div className="space-y-2.5 mt-8 md:mt-12">
            
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
                  ? 'border-[#D4AF37]/50 bg-black text-[#D4AF37] hover:bg-[#D4AF37]/5 shadow-md shadow-[#D4AF37]/5' 
                  : 'border-neutral-900 bg-neutral-950 text-neutral-500 opacity-60'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{selectedSize ? 'AJOUTER AUX PRODUITS' : 'CHOISIR UNE QUANTITÉ'}</span>
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
                  ? 'bg-[#D4AF37] text-black hover:bg-amber-400' 
                  : 'bg-neutral-900 text-neutral-600 cursor-not-allowed'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>{selectedSize ? 'TRANSMETTRE LA COMMANDE RV' : 'SÉLECTIONNER UN POIDS'}</span>
            </button>

            <p className="text-[8px] text-center text-neutral-500 tracking-wider font-mono uppercase">
              🔒 Remise sécurisée par émissaire privé sur Casablanca et partout au Maroc
            </p>
          </div>

        </div>
      </motion.div>
    </motion.div>
  );
}
