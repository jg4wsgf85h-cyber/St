import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, 
  Layers, 
  ShoppingBag, 
  Crown, 
  User, 
  X, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface SideMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onNavigateTab: (tab: 'home' | 'categories' | 'profile') => void;
  onOpenCart: () => void;
  onOpenVip: () => void;
  cartCount: number;
  triggerHaptic: (style: 'light' | 'medium' | 'heavy') => void;
  logoUrl?: string;
}

export default function SideMenuDrawer({
  isOpen,
  onClose,
  activeTab,
  onNavigateTab,
  onOpenCart,
  onOpenVip,
  cartCount,
  triggerHaptic,
  logoUrl
}: SideMenuDrawerProps) {
  const { t } = useLanguage();

  const menuItems = [
    {
      id: 'home',
      label: 'Discover',
      icon: Compass,
      badge: null,
      action: () => {
        onNavigateTab('home');
        onClose();
      }
    },
    {
      id: 'categories',
      label: 'Collections',
      icon: Layers,
      badge: '3',
      action: () => {
        onNavigateTab('categories');
        onClose();
      }
    },
    {
      id: 'cart',
      label: 'Cart',
      icon: ShoppingBag,
      badge: cartCount > 0 ? String(cartCount) : null,
      action: () => {
        onOpenCart();
        onClose();
      }
    },
    {
      id: 'vip',
      label: 'VIP',
      icon: Crown,
      badge: 'PRO',
      action: () => {
        onOpenVip();
        onClose();
      }
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      badge: null,
      action: () => {
        onNavigateTab('profile');
        onClose();
      }
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex select-none pointer-events-auto">
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Drawer Menu Container */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative w-[280px] max-w-[80vw] h-full bg-neutral-950/85 backdrop-blur-2xl border-r border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col justify-between p-6 z-10"
          >
            {/* Top Header inside Drawer */}
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div className="flex items-center gap-3">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Logo"
                      className="w-10 h-10 rounded-2xl border border-amber-500/40 object-cover shadow-[0_0_15px_rgba(245,158,11,0.3)] bg-black"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/20 via-black to-orange-500/20 flex items-center justify-center font-mono font-black text-amber-400 text-sm shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                      DT
                    </div>
                  )}
                  <div>
                    <h3 className="font-mono text-sm font-black tracking-widest text-white uppercase flex items-center gap-1">
                      DRYTECH
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    </h3>
                    <span className="text-[8px] font-mono tracking-widest text-amber-400/80 uppercase font-bold block">
                      RÉSERVE PRIVÉE • LUXE
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    triggerHaptic('light');
                    onClose();
                  }}
                  className="p-2 rounded-xl bg-white/5 border border-white/10 text-neutral-400 hover:text-white transition active:scale-90"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Menu Navigation List */}
              <nav className="space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <motion.button
                      key={item.id}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        triggerHaptic('medium');
                        item.action();
                      }}
                      className={`w-full p-3.5 rounded-2xl border transition duration-200 flex items-center justify-between text-xs font-mono font-bold tracking-wider uppercase cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-transparent border-amber-500/50 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                          : 'bg-white/5 hover:bg-white/10 border-white/5 text-neutral-300 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-xl border ${
                            isActive
                              ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                              : 'bg-black/40 border-white/10 text-neutral-400'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span>{item.label}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.badge && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-black font-mono ${
                              item.id === 'vip'
                                ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-black shadow-sm'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                        <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
                      </div>
                    </motion.button>
                  );
                })}
              </nav>
            </div>

            {/* Bottom Footer inside Drawer */}
            <div className="pt-6 border-t border-white/10 text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[9px] font-mono text-emerald-400 font-bold uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>DRYTECH — VERIFIED</span>
              </div>
              <p className="text-[8px] font-mono text-neutral-500 uppercase tracking-widest">
                0-LOG SECURE LIAISON
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
