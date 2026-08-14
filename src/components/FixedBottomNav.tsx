import { Home, Compass, MessageSquare, Info, Star, User, ShoppingBag } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface FixedBottomNavProps {
  activeTab: 'home' | 'catalog' | 'categories' | 'contact' | 'info' | 'reviews' | 'favorites' | 'profile';
  setActiveTab: (tab: 'home' | 'catalog' | 'categories' | 'contact' | 'info' | 'reviews' | 'favorites' | 'profile') => void;
  cartCount: number;
  onOpenCart: () => void;
  triggerHaptic: (style: 'light' | 'medium' | 'heavy') => void;
}

export default function FixedBottomNav({
  activeTab,
  setActiveTab,
  cartCount,
  onOpenCart,
  triggerHaptic
}: FixedBottomNavProps) {
  const { t } = useLanguage();

  const tabs = [
    { id: 'home', label: t('navHome'), icon: Home },
    { id: 'catalog', label: t('navCatalog'), icon: Compass },
    { id: 'contact', label: t('navContact'), icon: MessageSquare },
    { id: 'info', label: t('navInfo'), icon: Info },
    { id: 'reviews', label: t('navReviews'), icon: Star },
    { id: 'profile', label: t('navProfile'), icon: User },
  ] as const;


  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-2xl border-t border-orange-500/20 px-1 py-1.5 md:px-6 select-none shadow-[0_-10px_25px_rgba(0,0,0,0.8)]" id="bottom-nav">
      <div className="max-w-xl mx-auto flex items-center justify-around gap-0.5 relative">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                triggerHaptic('light');
                setActiveTab(tab.id);
              }}
              className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all duration-300 relative cursor-pointer px-1 ${
                isActive
                  ? 'text-orange-500 font-extrabold'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {isActive && (
                <div className="absolute -top-1.5 w-5 h-1 rounded-full bg-orange-500 shadow-[0_0_12px_#FF6B00]" />
              )}
              <Icon className={`w-4 h-4 md:w-5 md:h-5 transition-transform duration-300 ${isActive ? 'scale-110 text-orange-500 drop-shadow-[0_0_8px_rgba(255,107,0,0.6)]' : ''}`} />
              <span className="text-[8px] md:text-[9px] font-mono tracking-tighter mt-0.5 uppercase">
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* Floating / Compact Cart Badge Button */}
        <button
          onClick={() => {
            triggerHaptic('medium');
            onOpenCart();
          }}
          className="relative flex flex-col items-center justify-center p-2 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 text-black font-black shadow-[0_0_15px_rgba(255,107,0,0.4)] active:scale-95 transition cursor-pointer ml-1 shrink-0"
          title="Ouvrir le Panier"
        >
          <ShoppingBag className="w-4 h-4 md:w-5 md:h-5 text-black" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white font-mono text-[8px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border border-black shadow">
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}
