/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useMemo, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  User, 
  Plus, 
  Search, 
  Sparkles, 
  ShieldAlert, 
  Volume2, 
  VolumeX, 
  Info, 
  X, 
  ChevronRight, 
  Eye, 
  Lock,
  Unlock,
  MessageSquare,
  Headphones,
  ShieldCheck,
  Crown,
  Compass,
  Star,
  Truck,
  Power,
  PowerOff,
  Menu
} from 'lucide-react';

import { getProducts, DEFAULT_PRODUCTS, getBrandingSettings, verifyAccess, verifyAdminPassword, getAdminPasswordToken, getReviews, getUserProfile, getMyOrders } from './db';
import { VideoItem, CartItem, BrandingSettings, getPriceForSize, getDefaultSizeForProduct, ReviewItem, UserProfile, Order } from './types';

import { useLanguage } from './i18n/LanguageContext';

// Component imports
import IntroScreen from './components/IntroScreen';
import VipSpace from './components/VipSpace';
import CartDrawer from './components/CartDrawer';
import ProductDetailModal from './components/ProductDetailModal';
import AdminPanel from './components/AdminPanel';
import ProductBadge from './components/ProductBadge';
import HomeView from './components/HomeView';
import CatalogView from './components/CatalogView';
import CategoriesView from './components/CategoriesView';
import ReviewsView from './components/ReviewsView';
import FavoritesView from './components/FavoritesView';
import ProfileView from './components/ProfileView';
import ContactView from './components/ContactView';
import InfoView from './components/InfoView';
import BackgroundDecor from './components/BackgroundDecor';
import MarqueeBar from './components/MarqueeBar';
import SideMenuDrawer from './components/SideMenuDrawer';
import SearchModal from './components/SearchModal';

export default function App() {
  const { t } = useLanguage();
  const [hasEntered, setHasEntered] = useState<boolean>(false);
  const [audioPlaying, setAudioPlaying] = useState<boolean>(false);
  const [isWhitelisted, setIsWhitelisted] = useState<boolean>(true);

  const [branding, setBranding] = useState<BrandingSettings | null>(() => {
    try {
      const cached = localStorage.getItem('north47_cached_settings');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [products, setProducts] = useState<VideoItem[]>(() => {
    try {
      const cached = localStorage.getItem('north47_cached_products_v3');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return DEFAULT_PRODUCTS;
    } catch {
      return DEFAULT_PRODUCTS;
    }
  });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(() => {
    try {
      const cached = localStorage.getItem('north47_cached_products_v3');
      return !cached;
    } catch {
      return true;
    }
  });

  // Navigation & New Mobile Pages state
  const [activeTab, setActiveTab] = useState<'home' | 'catalog' | 'categories' | 'contact' | 'info' | 'reviews' | 'favorites' | 'profile'>('home');
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('hl_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userOrders, setUserOrders] = useState<Order[]>([]);

  // Selection & UI Modals state
  const [selectedProduct, setSelectedProduct] = useState<VideoItem | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isVipOpen, setIsVipOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // Administrative passcode unlock state
  const [showAdminPasscodeModal, setShowAdminPasscodeModal] = useState<boolean>(false);
  const [adminPasscode, setAdminPasscode] = useState<string>('');
  const [passcodeError, setPasscodeError] = useState<boolean>(false);

  // Filtration & search state
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const toggleFavorite = (productId: string) => {
    setFavorites((prev) => {
      const exists = prev.includes(productId);
      const updated = exists ? prev.filter((id) => id !== productId) : [...prev, productId];
      try {
        localStorage.setItem('hl_favorites', JSON.stringify(updated));
      } catch (e) {
        console.warn('LocalStorage error saving favorites', e);
      }
      return updated;
    });
  };

  // Audio elements
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Retrieve Telegram user payload safely
  const tgUser = useMemo(() => {
    const tg = (window as any).Telegram?.WebApp;
    return tg?.initDataUnsafe?.user || null;
  }, []);

  const isInsideTelegram = useMemo(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg) return false;
    if (tg.initData && tg.initData.trim() !== '') return true;
    if (tg.platform && tg.platform !== 'unknown') return true;
    return false;
  }, []);

  // Secret logo tap counter for discreet admin access
  const [logoTapCount, setLogoTapCount] = useState<number>(0);
  const logoTapTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleOpenAdminConsole = async () => {
    setHasEntered(true);
    const token = getAdminPasswordToken();
    if (token) {
      const ok = await verifyAdminPassword(token);
      if (ok) {
        setIsAdminOpen(true);
        return;
      }
    }
    setShowAdminPasscodeModal(true);
  };

  const handleSecretLogoClick = () => {
    setActiveTab('home');
    const newCount = logoTapCount + 1;
    setLogoTapCount(newCount);
    if (logoTapTimerRef.current) clearTimeout(logoTapTimerRef.current);
    if (newCount >= 5) {
      setLogoTapCount(0);
      triggerHaptic('heavy');
      handleOpenAdminConsole();
    } else {
      logoTapTimerRef.current = setTimeout(() => {
        setLogoTapCount(0);
      }, 3000);
    }
  };

  // Show a pristine golden banner notification
  const showToast = (msg: string) => {
    setToastMsg(msg);
  };

  useEffect(() => {
    if (toastMsg) {
      const t = setTimeout(() => setToastMsg(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toastMsg]);

  // Handle Telegram Haptic feedback
  const triggerHaptic = (style: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error', customMessage?: string) => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg && tg.HapticFeedback) {
      try {
        if (['success', 'warning', 'error'].includes(style)) {
          tg.HapticFeedback.notificationOccurred(style as 'success' | 'warning' | 'error');
        } else {
          tg.HapticFeedback.impactOccurred(style as 'light' | 'medium' | 'heavy');
        }
      } catch (e) {
        console.warn('Haptic trigger offline', e);
      }
    } else {
      console.log(`[HAPTIC SIMULATED] Style: ${style}, Msg: ${customMessage || ''}`);
    }
  };

  // Initialize background soundtrack
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.loop = true;
    audioRef.current.volume = 0.25;

    // Load initial cart state
    try {
      const savedCart = localStorage.getItem('omerta_cart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (e) {
      console.warn('Cart retrieval exception:', e);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Main data fetch & authorization check
  const loadData = async (silent = false) => {
    try {
      if (!silent && products.length === 0) {
        setLoading(true);
      }
      const [settings, prods, revs] = await Promise.all([
        getBrandingSettings(),
        getProducts(),
        getReviews()
      ]);
      setBranding(settings);
      if (Array.isArray(prods)) {
        setProducts(prods);
      }
      setReviews(revs || []);

      // Pre-warm top product image thumbnails for instant rendering
      if (prods && prods.length > 0) {
        prods.slice(0, 10).forEach((p) => {
          if (p.thumbnailUrl) {
            const img = new Image();
            img.src = p.thumbnailUrl;
          }
        });
      }

      const tg = (window as any).Telegram?.WebApp;
      if (tg) {
        try {
          tg.ready();
          tg.headerColor = '#000000';
          tg.backgroundColor = '#000000';
          tg.expand();
        } catch (err) {
          console.warn('Telegram theme configuration offline', err);
        }
      }

      // Fetch user profile and order history if telegram ID is present
      const tgUser = tg?.initDataUnsafe?.user;
      const userId = tgUser?.id ? String(tgUser.id).trim() : '';
      const username = tgUser?.username ? String(tgUser.username).trim() : '';
      const firstName = tgUser?.first_name ? String(tgUser.first_name).trim() : '';
      const lastName = tgUser?.last_name ? String(tgUser.last_name).trim() : '';
      const device = typeof navigator !== 'undefined' ? (navigator.userAgent.includes('Mobile') ? 'Telegram Mobile' : 'Telegram WebApp') : 'Appareil Web';
      const initData = tg?.initData || '';

      if (userId || username) {
        // Automatically register connection log with Telegram nickname & details for admin panel
        verifyAccess(userId, username, device, initData, firstName, lastName).catch((e) => {
          console.warn('Verify access sync issue:', e);
        });

        try {
          const lookupKey = userId || username;
          const [prof, ords] = await Promise.all([
            getUserProfile(lookupKey),
            getMyOrders(lookupKey)
          ]);
          setUserProfile(prof);
          setUserOrders(ords || []);
        } catch (e) {
          console.warn('User profile sync exception', e);
        }
      }

      // Security Access & Whitelist Verification: Open access for all users
      setIsWhitelisted(true);
    } catch (err) {
      console.error('Core configuration sync failed:', err);
      showToast('Serveur de réserve indisponible. Re-connexion...');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadData(true);
      }
    };

    const interval = setInterval(() => {
      loadData(true);
    }, 6000);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (audioPlaying) {
      audioRef.current.pause();
      setAudioPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setAudioPlaying(true))
        .catch(err => {
          console.warn('Audio play blocked by browser sandbox policies:', err);
          showToast('Activez l\'audio en touchant l\'écran.');
        });
    }
  };

  const handleEnter = () => {
    setHasEntered(true);
    // Auto-trigger ambience audio if toggle state was enabled
    if (audioPlaying && audioRef.current) {
      audioRef.current.play().catch(() => setAudioPlaying(false));
    } else {
      // Prompt high audio fidelity play on first interaction
      audioRef.current?.play()
        .then(() => setAudioPlaying(true))
        .catch(() => setAudioPlaying(false));
    }
  };

  // Add to cart with price calculation
  const handleAddToCart = (product: VideoItem, size: string, color: { name: string; hex: string; imageUrl: string }) => {
    triggerHaptic('light', 'Ajouté au panier');
    const price = getPriceForSize(product.price, size, product.category);

    const cartItem: CartItem = {
      id: `${product.id}-${size}-${color.name}`,
      product,
      selectedSize: size,
      selectedColor: color,
      quantity: 1,
      totalPrice: price
    };

    setCart(prev => {
      const idx = prev.findIndex(item => item.id === cartItem.id);
      let updated;
      if (idx >= 0) {
        updated = prev.map((item, i) => {
          if (i === idx) {
            const newQty = item.quantity + 1;
            return {
              ...item,
              quantity: newQty,
              totalPrice: getPriceForSize(item.product.price, item.selectedSize, item.product.category) * newQty
            };
          }
          return item;
        });
      } else {
        updated = [...prev, cartItem];
      }
      localStorage.setItem('omerta_cart', JSON.stringify(updated));
      return updated;
    });

    setSelectedProduct(null);
    showToast(`"${product.title}" (${size}) réservé au panier.`);
  };

  // Quick Add from Home / Catalog card
  const handleQuickAddToCart = (product: VideoItem) => {
    triggerHaptic('medium');
    const defaultSize = getDefaultSizeForProduct(product);
    const defaultColor = { name: 'Edition Réserve', hex: '#D4AF37', imageUrl: product.thumbnailUrl };
    const price = getPriceForSize(product.price, defaultSize, product.category);

    const cartItem: CartItem = {
      id: `${product.id}-${defaultSize}-${defaultColor.name}`,
      product,
      selectedSize: defaultSize,
      selectedColor: defaultColor,
      quantity: 1,
      totalPrice: price
    };

    setCart(prev => {
      const idx = prev.findIndex(item => item.id === cartItem.id);
      let updated;
      if (idx >= 0) {
        updated = prev.map((item, i) => {
          if (i === idx) {
            const newQty = item.quantity + 1;
            return {
              ...item,
              quantity: newQty,
              totalPrice: getPriceForSize(item.product.price, item.selectedSize, item.product.category) * newQty
            };
          }
          return item;
        });
      } else {
        updated = [...prev, cartItem];
      }
      localStorage.setItem('omerta_cart', JSON.stringify(updated));
      return updated;
    });
  };

  // Instant buy: clear or add and open cart directly
  const handleInstantBuy = (product: VideoItem, size: string, color: { name: string; hex: string; imageUrl: string }) => {
    triggerHaptic('medium', 'Instant Buy');
    const price = getPriceForSize(product.price, size, product.category);

    const cartItem: CartItem = {
      id: `${product.id}-${size}-${color.name}`,
      product,
      selectedSize: size,
      selectedColor: color,
      quantity: 1,
      totalPrice: price
    };

    setCart(() => {
      const updated = [cartItem];
      localStorage.setItem('omerta_cart', JSON.stringify(updated));
      return updated;
    });

    setSelectedProduct(null);
    setIsCartOpen(true);
  };

  const handleRemoveCartItem = (itemId: string) => {
    triggerHaptic('light');
    setCart(prev => {
      const updated = prev.filter(item => item.id !== itemId);
      localStorage.setItem('omerta_cart', JSON.stringify(updated));
      return updated;
    });
  };

  const handleClearCart = () => {
    triggerHaptic('medium');
    setCart([]);
    localStorage.removeItem('omerta_cart');
  };

  const handleCheckoutSuccess = (method: string, amount: number, itemTitles: string[]) => {
    triggerHaptic('success', 'Commande Validée');
    setCart([]);
    localStorage.removeItem('omerta_cart');
    showToast('Réservation transmise ! @yoru47 prend en charge votre commande.');
  };

  const handleAdminUnlockSubmit = async (e: FormEvent) => {
    e.preventDefault();
    triggerHaptic('heavy');
    const success = await verifyAdminPassword(adminPasscode);
    if (success) {
      setPasscodeError(false);
      setShowAdminPasscodeModal(false);
      setIsAdminOpen(true);
      setAdminPasscode('');
    } else {
      setPasscodeError(true);
      triggerHaptic('error', 'Mot de passe incorrect');
    }
  };

  // Extract dynamic categories from actual product lists
  const categories = useMemo(() => {
    const list = new Set<string>();
    list.add('All');
    products.forEach(p => {
      if (p.category) list.add(p.category);
    });
    return Array.from(list);
  }, [products]);

  // Master product filter
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const productCat = (p.category || '').toLowerCase().trim();
      const selCat = (selectedCategory || 'Tous').toLowerCase().trim();

      let matchCat = false;
      if (selCat === 'tous' || selCat === 'all' || !selCat) {
        matchCat = true;
      } else if (selCat.includes('beld')) {
        matchCat = productCat.includes('beld');
      } else if (selCat.includes('dry') || selCat.includes('sift')) {
        matchCat = productCat.includes('dry') || productCat.includes('sift');
      } else if (selCat.includes('frozen')) {
        matchCat = productCat.includes('frozen');
      } else if (selCat.includes('static')) {
        matchCat = productCat.includes('static');
      } else if (selCat.includes('wpff') || selCat.includes('wppf')) {
        matchCat = productCat.includes('wpff') || productCat.includes('wppf');
      } else if (selCat.includes('accessoire') || selCat.includes('acc')) {
        matchCat = productCat.includes('accessoire') || productCat.includes('acc');
      } else {
        matchCat = productCat.includes(selCat) || selCat.includes(productCat);
      }

      const matchSearch = !searchQuery.trim() || 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Is user the owner of the platform
  const isOwner = useMemo(() => {
    if (!tgUser) return false;
    const uStr = String(tgUser.username || '').toLowerCase();
    const idStr = String(tgUser.id);
    return uStr === 'sultan_st212' || uStr === 'yoru47' || uStr === 'samy_ghost' || uStr === 'amine755yss' || uStr === 'amine_cartel' || idStr === '858781160';
  }, [tgUser]);

  // Total cart items count
  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-black flex flex-col items-center justify-center p-6" id="loading-screen">
        <div className="w-16 h-16 rounded-full border border-dashed border-[#D4AF37]/35 flex items-center justify-center animate-spin relative">
          <div className="w-12 h-12 rounded-full border border-dashed border-[#D4AF37]/20 flex items-center justify-center animate-spin [animation-direction:reverse]" />
        </div>
        <h2 className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#D4AF37] mt-8 animate-pulse">
          Biscotti Boys Farm — SYNCHRONISATION SECURE
        </h2>
      </div>
    );
  }

  // Display pitch black offline screen if application is turned off
  const isAppOff = branding?.appDisabled === true;

  if (isAppOff && !isAdminOpen && !showAdminPasscodeModal) {
    return (
      <div className="min-h-screen w-full bg-black text-white flex flex-col items-center justify-center p-6 text-center select-none relative font-sans">
        <div className="max-w-md w-full space-y-6">
          <div className="w-20 h-20 rounded-full bg-red-950/40 border border-red-500/30 flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(239,68,68,0.25)]">
            <Power className="w-10 h-10 text-red-500 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h1 className="font-mono text-2xl font-black uppercase tracking-[0.2em] text-red-500">
              APPLICATION ÉTEINTE
            </h1>
            <p className="text-xs text-neutral-400 font-mono tracking-widest uppercase">
              Biscotti Boys Farm — RÉSERVE HORS LIGNE
            </p>
          </div>

          <div className="bg-neutral-950/90 border border-neutral-900 rounded-2xl p-5 space-y-3 shadow-2xl">
            <p className="text-xs text-neutral-300 font-sans leading-relaxed">
              L'application a été éteinte par la direction. Aucun accès n'est disponible actuellement.
            </p>
            <div className="pt-2 flex items-center justify-center gap-2 text-[10px] font-mono text-red-400 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>Statut : FERMÉ (HORS LIGNE)</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Display welcome gate / age verification gate if not entered
  if (!hasEntered) {
    return (
      <IntroScreen
        onEnter={handleEnter}
        audioPlaying={audioPlaying}
        onToggleAudio={toggleAudio}
        triggerHaptic={triggerHaptic}
        settings={branding}
        tgUser={tgUser}
        isWhitelisted={isWhitelisted}
        onOpenAdmin={undefined}
        onRecheckAccess={() => loadData(true)}
      />
    );
  }

  return (
    <div className="min-h-screen w-full bg-black text-[#FCFAF6] font-sans flex flex-col antialiased relative selection:bg-[#D4AF37]/20 selection:text-[#D4AF37]" id="app-root">
      
      {/* NORTH47 Majestic Animated Mountain Background & Fog/Particle Decor */}
      <BackgroundDecor 
        bgUrl={branding?.mainBgUrl || branding?.introBgUrl} 
        videoUrl={branding?.introVideoUrl} 
      />

      {/* 1. STICKY COMPACT LUXURY GLASS HEADER */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-2xl border-b border-white/10 px-3 py-2 md:px-6 select-none shadow-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          
          {/* Left: Hamburger Menu Button ☰ */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                triggerHaptic('medium');
                setIsSideMenuOpen(true);
              }}
              className="p-2 rounded-2xl bg-white/5 border border-white/10 text-neutral-200 hover:text-amber-400 hover:bg-white/10 transition cursor-pointer active:scale-90"
              title="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Logo / Brand Title (5 secret taps unlock discreet admin prompt) */}
            <div 
              className="flex items-center gap-2 cursor-pointer group"
              onClick={() => {
                triggerHaptic('light');
                handleSecretLogoClick();
              }}
            >
              {branding?.logoUrl ? (
                <img src={branding.logoUrl} alt="Logo" className="w-9 h-9 md:w-10 md:h-10 rounded-2xl border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.3)] object-cover bg-black group-hover:scale-105 transition duration-300" />
              ) : (
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-2xl border border-amber-500/40 flex items-center justify-center bg-gradient-to-br from-amber-500/20 via-black to-orange-500/20 text-amber-400 font-mono font-black text-xs md:text-sm shadow-[0_0_12px_rgba(245,158,11,0.3)]">
                  BB
                </div>
              )}
              <div className="hidden sm:block">
                <h1 className="font-mono text-xs md:text-sm tracking-[0.2em] font-black uppercase text-white flex items-center gap-1 group-hover:text-amber-400 transition">
                  Biscotti Boys Farm
                  <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
                </h1>
                <span className="text-[7px] md:text-[8px] text-amber-400/80 font-mono uppercase tracking-[0.2em] block -mt-0.5 font-bold">
                  {t('privateReserve')}
                </span>
              </div>
            </div>
          </div>

          {/* Right Action Icons Bar */}
          <div className="flex items-center gap-1.5 md:gap-2">

            {/* Search Trigger */}
            <button
              onClick={() => {
                triggerHaptic('light');
                setIsSearchOpen(true);
              }}
              className="p-2 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition cursor-pointer"
              title="Rechercher"
            >
              <Search className="w-4 h-4" />
            </button>
            
            {/* VIP Espace trigger */}
            <button
              onClick={() => {
                triggerHaptic('medium');
                setIsVipOpen(true);
              }}
              className="p-2 rounded-2xl border border-amber-400/50 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition cursor-pointer flex items-center gap-1"
              title={t('vipSpace')}
            >
              <Crown className="w-4 h-4" />
            </button>

            {/* Shopping Cart trigger */}
            <button
              onClick={() => {
                triggerHaptic('medium');
                setIsCartOpen(true);
              }}
              className="p-2 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-white transition relative cursor-pointer"
              title={t('cart')}
            >
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-amber-400 text-black font-black font-mono text-[8px] flex items-center justify-center shadow-lg border border-black"
                >
                  {cartCount}
                </motion.span>
              )}
            </button>

            {/* Profile trigger */}
            <button
              onClick={() => {
                triggerHaptic('light');
                setActiveTab('profile');
              }}
              className={`p-2 rounded-2xl border transition cursor-pointer ${
                activeTab === 'profile'
                  ? 'border-amber-400 bg-amber-500/20 text-amber-400'
                  : 'border-white/10 bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white'
              }`}
              title="Profil"
            >
              <User className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* 2. GLOWING SCROLLING LED MARQUEE BAR */}
      <MarqueeBar config={branding?.marqueeConfig} />

      {/* 2. MAIN SCROLL CONTAINER */}
      <main className="flex-1 relative z-10 p-2 md:p-6 space-y-6 select-none">
        {activeTab === 'home' && (
          <HomeView
            branding={branding}
            tgUser={tgUser}
            products={products}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            onSelectProduct={setSelectedProduct}
            onQuickAddToCart={handleQuickAddToCart}
            onNavigateTab={setActiveTab}
            triggerHaptic={triggerHaptic}
            showToast={showToast}
          />
        )}

        {activeTab === 'catalog' && (
          <CatalogView
            products={products}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            onSelectProduct={setSelectedProduct}
            triggerHaptic={triggerHaptic}
          />
        )}

        {activeTab === 'categories' && (
          <CategoriesView
            products={products}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
              setActiveTab('catalog');
            }}
            triggerHaptic={triggerHaptic}
          />
        )}

        {activeTab === 'contact' && (
          <ContactView
            branding={branding}
            triggerHaptic={triggerHaptic}
            showToast={showToast}
          />
        )}

        {activeTab === 'info' && (
          <InfoView
            triggerHaptic={triggerHaptic}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'reviews' && (
          <ReviewsView
            reviews={reviews}
            userOrders={userOrders}
            tgUser={tgUser}
            onRefreshReviews={() => loadData(true)}
            triggerHaptic={triggerHaptic}
            showToast={showToast}
          />
        )}

        {activeTab === 'favorites' && (
          <FavoritesView
            products={products}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            onSelectProduct={setSelectedProduct}
            onNavigateTab={setActiveTab}
            triggerHaptic={triggerHaptic}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            tgUser={tgUser}
            userProfile={userProfile}
            userOrders={userOrders}
            triggerHaptic={triggerHaptic}
            showToast={showToast}
            onRefreshOrders={() => loadData(true)}
          />
        )}
      </main>

      {/* SIDE MENU DRAWER */}
      <SideMenuDrawer
        isOpen={isSideMenuOpen}
        onClose={() => setIsSideMenuOpen(false)}
        activeTab={activeTab}
        onNavigateTab={(tab) => setActiveTab(tab)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenVip={() => setIsVipOpen(true)}
        cartCount={cartCount}
        triggerHaptic={triggerHaptic}
        logoUrl={branding?.logoUrl}
      />

      {/* SEARCH MODAL */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        products={products}
        onSelectProduct={(p) => setSelectedProduct(p)}
        onQuickAddToCart={handleQuickAddToCart}
        triggerHaptic={triggerHaptic}
      />

      {/* ======================================================= */}
      {/* 6. MODALS OVERLAYS CONTROLLER (AnimatePresence) */}
      {/* ======================================================= */}

      {/* MODAL: CART DRAWER */}
      <AnimatePresence>
        {isCartOpen && (
          <CartDrawer
            cart={cart}
            onRemoveItem={handleRemoveCartItem}
            onClearCart={handleClearCart}
            onClose={() => setIsCartOpen(false)}
            onCheckoutSuccess={handleCheckoutSuccess}
            triggerHaptic={triggerHaptic}
            telegramId={tgUser?.id ? String(tgUser.id) : undefined}
            telegramUsername={tgUser?.username || undefined}
          />
        )}
      </AnimatePresence>

      {/* MODAL: PRODUCT DETAIL & SELECTIONS */}
      <AnimatePresence>
        {selectedProduct && (
          <ProductDetailModal
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
            onAddToCart={handleAddToCart}
            onInstantBuy={handleInstantBuy}
            triggerHaptic={triggerHaptic}
          />
        )}
      </AnimatePresence>

      {/* MODAL: VIP SPACE / MEMBER PROFILE */}
      <AnimatePresence>
        {isVipOpen && (
          <VipSpace
            telegramId={tgUser?.id ? String(tgUser.id) : '858781160'}
            telegramUsername={tgUser?.username || 'Guest'}
            onClose={() => setIsVipOpen(false)}
            triggerHaptic={triggerHaptic}
          />
        )}
      </AnimatePresence>

      {/* MODAL: ADMIN ACCESS PANEL */}
      <AnimatePresence>
        {isAdminOpen && (
          <AdminPanel
            products={products}
            tgUser={tgUser}
            onRefreshProducts={() => loadData(true)}
            triggerHaptic={(style) => triggerHaptic(style)}
            onClose={() => setIsAdminOpen(false)}
            onBrandingChange={(newSettings) => setBranding(newSettings)}
          />
        )}
      </AnimatePresence>

      {/* MODAL: ADMIN PASSCODE PROMPT */}
      <AnimatePresence>
        {showAdminPasscodeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#080808] p-6 shadow-2xl space-y-4 text-center relative"
            >
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setShowAdminPasscodeModal(false);
                  setAdminPasscode('');
                  setPasscodeError(false);
                }}
                className="absolute top-4 right-4 p-1.5 rounded-full border border-white/5 bg-black text-stone-400 hover:text-[#FCFAF6] duration-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              <div className="w-12 h-12 rounded-full border border-[#D4AF37]/30 bg-black/40 text-[#D4AF37] flex items-center justify-center mx-auto">
                <Lock className="w-5 h-5 animate-pulse" />
              </div>

              <div className="space-y-1">
                <h4 className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#D4AF37]">
                  VÉRIFICATION DE SÉCURITÉ
                </h4>
                <p className="text-[9px] text-neutral-400 uppercase leading-normal">
                  Veuillez introduire la clé d'accès administrateur de la réserve.
                </p>
              </div>

              <form onSubmit={handleAdminUnlockSubmit} className="space-y-3">
                <input
                  type="password"
                  placeholder="CODE D'ACCÈS VIP"
                  value={adminPasscode}
                  onChange={(e) => {
                    setAdminPasscode(e.target.value);
                    if (passcodeError) setPasscodeError(false);
                  }}
                  className={`w-full px-4 py-3 rounded-xl border text-center font-mono text-sm tracking-widest text-[#D4AF37] focus:outline-none duration-200 ${
                    passcodeError 
                      ? 'border-red-500 bg-red-500/5' 
                      : 'border-white/5 bg-black/40 focus:border-[#D4AF37]/30'
                  }`}
                  autoFocus
                />
                {passcodeError && (
                  <p className="text-[8px] text-red-500 font-mono uppercase tracking-widest">
                    ⚠️ Clé incorrecte — tentative loggée.
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl border border-[#D4AF37] bg-gradient-to-r from-[#AA8B2C] to-[#D4AF37] text-black font-extrabold text-[9.5px] tracking-[0.2em] uppercase duration-200 shadow-lg cursor-pointer"
                >
                  DEVERROUILLER
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLOAT OVERLAY: PRISTINE MINIMALIST TOASTS */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full border border-[#D4AF37]/35 bg-black/95 backdrop-blur-md shadow-2xl text-[9px] font-mono tracking-widest uppercase text-[#D4AF37] font-black flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] animate-pulse" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
