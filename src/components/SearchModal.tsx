import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Plus, Sparkles, Check } from 'lucide-react';
import { VideoItem } from '../types';
import ProductCardMedia from './ProductCardMedia';
import { useLanguage } from '../i18n/LanguageContext';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: VideoItem[];
  onSelectProduct: (product: VideoItem) => void;
  onQuickAddToCart?: (product: VideoItem) => void;
  triggerHaptic: (style: 'light' | 'medium' | 'heavy') => void;
}

export default function SearchModal({
  isOpen,
  onClose,
  products,
  onSelectProduct,
  onQuickAddToCart,
  triggerHaptic
}: SearchModalProps) {
  const { t } = useLanguage();
  const [query, setQuery] = useState<string>('');
  const [addedId, setAddedId] = useState<string | null>(null);

  const filtered = products.filter((p) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      (p.title || '').toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q)
    );
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 select-none">
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="absolute inset-0 bg-black/70 backdrop-blur-xl"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-xl bg-neutral-950/90 border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] p-5 space-y-4 z-10 backdrop-blur-2xl"
          >
            {/* Search Input Bar */}
            <div className="relative flex items-center">
              <Search className="w-5 h-5 text-amber-400 absolute left-4 pointer-events-none" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un produit, une fleur, un extrait..."
                className="w-full pl-12 pr-12 py-3.5 bg-black/60 border border-white/10 rounded-2xl text-sm text-white placeholder-neutral-500 font-mono focus:outline-none focus:border-amber-500/60 transition shadow-inner"
              />
              <button
                onClick={() => {
                  triggerHaptic('light');
                  if (query) {
                    setQuery('');
                  } else {
                    onClose();
                  }
                }}
                className="absolute right-3.5 p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Results Title */}
            <div className="flex items-center justify-between text-xs font-mono text-neutral-400 border-b border-white/10 pb-2">
              <span className="flex items-center gap-1.5 uppercase font-bold text-amber-400">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Résultats ({filtered.length})</span>
              </span>
              <span className="text-[10px] text-neutral-500 uppercase">BISCOTTI BOYS FARMZ RESERVE</span>
            </div>

            {/* Results List */}
            <div className="max-h-[60vh] overflow-y-auto space-y-2.5 pr-1 no-scrollbar">
              {filtered.length === 0 ? (
                <div className="p-8 text-center text-xs font-mono text-neutral-400 space-y-2">
                  <p>Aucun produit ne correspond à votre recherche.</p>
                </div>
              ) : (
                filtered.map((p) => (
                  <motion.div
                    key={p.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      triggerHaptic('medium');
                      onSelectProduct(p);
                      onClose();
                    }}
                    className="p-3 rounded-2xl bg-black/40 border border-white/5 hover:border-amber-500/40 transition duration-200 flex items-center justify-between gap-3 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-neutral-900 overflow-hidden relative border border-white/10 shrink-0">
                        <ProductCardMedia product={p} hoverScale={false} />
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-white group-hover:text-amber-400 transition uppercase">
                          {p.title}
                        </h4>
                        <span className="text-[10px] font-mono text-neutral-400 block">
                          {p.category || 'RESERVE'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-mono font-black text-amber-400">
                        {p.price} €
                      </span>

                      {onQuickAddToCart && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerHaptic('medium');
                            onQuickAddToCart(p);
                            setAddedId(p.id);
                            setTimeout(() => setAddedId(null), 1800);
                          }}
                          className={`p-2 rounded-xl border transition cursor-pointer ${
                            addedId === p.id
                              ? 'bg-emerald-500 text-black border-emerald-400'
                              : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-400 hover:text-black'
                          }`}
                        >
                          {addedId === p.id ? (
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          ) : (
                            <Plus className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
