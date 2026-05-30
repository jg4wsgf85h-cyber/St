/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useMemo, useCallback, FormEvent } from 'react';
import { 
  ShoppingBag, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  X, 
  Check, 
  Info,
  User,
  ShieldCheck,
  ChevronRight,
  Heart,
  Wind,
  Stars,
  Award,
  Send,
  HelpCircle,
  Menu,
  Moon,
  Lock,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { VideoItem, CartItem, BrandingSettings, getPriceForSize } from './types';
import { getProducts, resolveMediaUrls, getBrandingSettings, getWhitelist, verifyAdminPassword, getAdminPasswordToken } from './db';

import IntroScreen from './components/IntroScreen';
import ProductDetailModal from './components/ProductDetailModal';
import AdminPanel from './components/AdminPanel';
import CartDrawer from './components/CartDrawer';

// Guest profile fallback
const DEFAULTS_USER = {
  id: 0,
  first_name: "HASH'N FLASH",
  last_name: "MOCRO",
  username: "hashn_flash_mocro",
  language_code: "fr"
};

const BRAND_COLORS = [
  { name: 'Noir Profond', hex: '#000000', imageUrl: '/uploads/080edfb0-fb3f-4458-8299-15dd25809336.png' },
  { name: 'Or Pur', hex: '#D4AF37', imageUrl: '/uploads/e3c6a2d5-b0a2-4488-9dc1-574c0d93ba3e.png' },
  { name: 'Ambre Élite', hex: '#9A7B1C', imageUrl: '/uploads/f1cd0ca1-51d4-4ca0-8386-e3c57a5fb0f1.png' }
];

const isVideoUrl = (url?: string): boolean => {
  if (!url) return false;
  const cleanUrl = url.toLowerCase().split('?')[0];
  return cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.webm') || cleanUrl.endsWith('.mov') || url.includes('video') || url.includes('mp4');
};

export default function App() {
  const tg = (window as any).Telegram?.WebApp;
  const tgUser = tg?.initDataUnsafe?.user || DEFAULTS_USER;

  // States
  const [loading, setLoading] = useState<boolean>(true);
  const [showIntro, setShowIntro] = useState<boolean>(true);
  const [products, setProducts] = useState<VideoItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Local store configuration
  const [brandingSettings, setBrandingSettings] = useState<any>({
    introBgUrl: '',
    launchScreenUrl: '',
    homepageHeroBgUrl: 'https://images.unsplash.com/photo-1541532713592-79a0317b6b77?q=80&w=1200&auto=format&fit=crop',
    logoUrl: '',
    introStatusLine: 'HASH\'N FLASH MOCRO — RÉSERVE PRIVÉE D\'EXCEPTION'
  });

  // Modal displays
  const [showCart, setShowCart] = useState<boolean>(false);
  const [showAdmin, setShowAdmin] = useState<boolean>(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState<boolean>(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState<string>('');
  const [passwordPromptError, setPasswordPromptError] = useState<string>('');
  const [passwordAuthenticated, setPasswordAuthenticated] = useState<boolean>(!!getAdminPasswordToken());
  const [selectedProduct, setSelectedProduct] = useState<VideoItem | null>(null);

  // Active Category tabs for resin & sift
  const [activeCategory, setActiveCategory] = useState<string>('All');

  // Track the custom active color for *each* product cart thumbnail interactively on the homepage grid!
  // This supports "variantes couleurs sous produits" directly beneath product tiles.
  const [selectedProductColorMap, setSelectedProductColorMap] = useState<Record<string, typeof BRAND_COLORS[0]>>({});

  // Ambient Sleep Atmosphere subharmonic drone state
  const [ambientAudioPlaying, setAmbientAudioPlaying] = useState<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Floating tactile haptic indicators
  const [hapticFeedbackText, setHapticFeedbackText] = useState<string>('');
  const [showHapticBubble, setShowHapticBubble] = useState<boolean>(false);

  // Newsletter email state
  const [newsletterEmail, setNewsletterEmail] = useState<string>('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState<boolean>(false);

  // Scroll visibility states
  const [scrolled, setScrolled] = useState<boolean>(false);

  // Detect and track scrolling
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [whitelist, setWhitelist] = useState<any[]>([]);

  // Robust check to identify you as the exclusive owner/admin under any account variation
  const isUserOwner = useCallback((user: any) => {
    if (!user) return false;
    const idStr = String(user.id).trim();
    const usernameStr = String(user.username || '').toLowerCase().trim();
    
    return (
      idStr === '858781160' || 
      idStr === '858781160855' || 
      idStr === '8464716562' || 
      usernameStr === 'sultan_st212' ||
      usernameStr === 'hashn_flash_mocro' || 
      usernameStr === 'omerta_cartel' || 
      usernameStr === 'amine_cartel' || 
      usernameStr === 'amine755yss' ||
      usernameStr === 'amine755' ||
      usernameStr === 'amine_755' ||
      usernameStr.includes('amine') ||
      usernameStr.includes('sultan') ||
      usernameStr.includes('cartel') ||
      usernameStr.includes('omerta') ||
      usernameStr.includes('hashn') ||
      usernameStr.includes('flash') ||
      usernameStr.includes('mocro')
    );
  }, []);

  // Admin page visibility - ONLY visible to the owner or when testing outside Telegram
  const isAdminUserWhitelisted = useMemo(() => {
    const isInsideTelegram = !!(tg && tg.initData && tg.initData.trim() !== '');
    if (!isInsideTelegram) {
      return true; // Bypass on desktop web browser for easy building/setup
    }
    if (tgUser) {
      return isUserOwner(tgUser);
    }
    return false;
  }, [tgUser, tg, isUserOwner]);

  // General App/Shop access permission - anyone whitelisted by ID/Username + the Owner + anyone outside Telegram
  const isUserWhitelisted = useMemo(() => {
    return true; // Accès libre complet : Whitelist désactivée pour que tout le monde puisse entrer sans blocage
  }, []);

  // Load whitelist records
  const loadWhitelistData = async () => {
    try {
      const dbWhitelist = await getWhitelist();
      if (Array.isArray(dbWhitelist)) {
        setWhitelist(dbWhitelist);
      }
    } catch (e) {
      console.warn('Failed to parse whitelist configurations', e);
    }
  };

  // Load pajama items
  const loadCatalogData = async () => {
    try {
       const dbData = await getProducts();
       const safeData = Array.isArray(dbData) ? dbData : [];
       const mapped = safeData.map(p => resolveMediaUrls(p));
       setProducts(mapped);
    } catch (e) {
       console.error('Failed to load products from IndexedDB', e);
       setProducts([]);
    }
  };

  // Load custom header assets and descriptions
  const loadVisualSettings = async () => {
    try {
      const dbSettings = await getBrandingSettings();
      if (dbSettings) {
        setBrandingSettings(dbSettings);
      }
    } catch (e) {
       console.error('Failed to parse visual configs', e);
    }
  };

  const handleOpenAdmin = () => {
    if (!passwordAuthenticated) {
      setAdminPasswordInput('');
      setPasswordPromptError('');
      setShowPasswordPrompt(true);
    } else {
      setShowAdmin(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand();
      try {
        tg.headerColor = '#FCFAF6';
        tg.backgroundColor = '#FCFAF6';
      } catch (e) {
        console.error('Telegram header theme integration error', e);
      }
    }
    
    const initialize = async () => {
      await loadCatalogData();
      await loadVisualSettings();
      await loadWhitelistData();
      setLoading(false);
    };
    initialize();
  }, []);

  // Sleep Atmosphere Low-frequency drone generator
  const startAtmosphericDrone = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const oscLower = ctx.createOscillator();
      const oscHigher = ctx.createOscillator();
      const lowFilter = ctx.createBiquadFilter();
      const masterVolume = ctx.createGain();

      // Atmospheric deep 528Hz Solfeggio / 60Hz sleep harmonics
      oscLower.frequency.setValueAtTime(60.0, ctx.currentTime);
      oscHigher.frequency.setValueAtTime(120.0, ctx.currentTime);
      
      oscLower.type = 'sine';
      oscHigher.type = 'sine';

      lowFilter.type = 'lowpass';
      lowFilter.frequency.setValueAtTime(180, ctx.currentTime);

      masterVolume.gain.setValueAtTime(0.04, ctx.currentTime); // very soft relaxing wave hum

      oscLower.connect(lowFilter);
      oscHigher.connect(lowFilter);
      lowFilter.connect(masterVolume);
      masterVolume.connect(ctx.destination);

      oscLower.start();
      oscHigher.start();

      setAmbientAudioPlaying(true);
      triggerHapticFeedback('success', "Ambiance Omerta Activée");

      (window as any)._omertaSynthNodes = [oscLower, oscHigher, masterVolume];
    } catch (e) {
      console.warn('Audio synthesis blocked by context rules', e);
    }
  };

  const stopAtmosphericDrone = () => {
    const nodes = (window as any)._omertaSynthNodes;
    if (nodes) {
      try {
        nodes[0].stop();
        nodes[1].stop();
        nodes[2].disconnect();
      } catch (e) {}
      (window as any)._omertaSynthNodes = null;
    }
    setAmbientAudioPlaying(false);
  };

  const toggleAtmosphericAudio = () => {
    if (ambientAudioPlaying) {
      stopAtmosphericDrone();
    } else {
      startAtmosphericDrone();
    }
  };

  // Haptic feedback bubble triggers
  const triggerHapticFeedback = (style: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error', customMessage?: string) => {
    try {
      if (tg?.HapticFeedback) {
        if (style === 'success' || style === 'warning' || style === 'error') {
          tg.HapticFeedback.notificationOccurred(style);
        } else {
          tg.HapticFeedback.impactOccurred(style);
        }
      }
      setHapticFeedbackText(customMessage || `Haptic: ${style.toUpperCase()}`);
      setShowHapticBubble(true);
      const prevTimeout = (window as any)._hapticBubbleTimeout;
      if (prevTimeout) clearTimeout(prevTimeout);
      (window as any)._hapticBubbleTimeout = setTimeout(() => setShowHapticBubble(false), 2200);
    } catch (e) {
      console.log('Haptic log:', style);
    }
  };

  // Add Item to cart securely with size and color options
  const handleAddToCart = (product: VideoItem, size: string = 'S', color?: typeof BRAND_COLORS[0]) => {
    const chosenColor = color || BRAND_COLORS[0];
    const generatedItemId = `vln-${product.id}-${size}-${chosenColor.name.toLowerCase().replace(/\s+/g, '-')}`;

    const singleItemPrice = getPriceForSize(product.price, size, product.category);

    const existingIndex = cart.findIndex(item => item.id === generatedItemId);
    if (existingIndex !== -1) {
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity += 1;
      updatedCart[existingIndex].totalPrice = updatedCart[existingIndex].quantity * singleItemPrice;
      setCart(updatedCart);
    } else {
      const newItem: CartItem = {
        id: generatedItemId,
        product,
        selectedSize: size,
        selectedColor: chosenColor,
        quantity: 1,
        totalPrice: singleItemPrice
      };
      setCart(prev => [...prev, newItem]);
    }

    triggerHapticFeedback('success', `${product.title} ajouté au sac`);
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleRemoveCartItem = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
    triggerHapticFeedback('medium', "Article supprimé");
  };

  const handleCheckoutComplete = (method: string, amount: number, itemTitles: string[]) => {
    triggerHapticFeedback('success', "Réservation Transmise");
  };

  const categoryFilters = ['All', 'Double Filtré', 'Frozen Sift', 'Beldi'];

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'All') return products;
    return products.filter(p => p.category?.toLowerCase() === activeCategory.toLowerCase());
  }, [products, activeCategory]);

  const activeSectionTitle = useMemo(() => {
    if (!brandingSettings || !brandingSettings.sectionTitles) return null;
    const sorted = [...brandingSettings.sectionTitles].sort((a, b) => (a.order || 0) - (b.order || 0));
    return sorted.find(
      (t: any) => t.category.toLowerCase() === activeCategory.toLowerCase() && t.enabled
    );
  }, [brandingSettings, activeCategory]);

  // Handle color swatch triggers underneath core catalog items
  const handleProductColorBubbleClick = (productId: string, colorItem: typeof BRAND_COLORS[0]) => {
    triggerHapticFeedback('light', `Couleur: ${colorItem.name}`);
    setSelectedProductColorMap(prev => ({
      ...prev,
      [productId]: colorItem
    }));
  };

  const handleNewsletterSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim() || !newsletterEmail.includes('@')) {
      triggerHapticFeedback('error', 'E-mail Invalide');
      return;
    }
    triggerHapticFeedback('success', 'Inscription confirmée');
    setNewsletterSubscribed(true);
    setNewsletterEmail('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070707] flex flex-col items-center justify-center font-mono text-sm text-[#D4AF37] tracking-widest gap-4">
        <div className="w-6 h-6 rounded-full border border-t-[#D4AF37] border-r-transparent border-b-[#D4AF37] border-l-transparent animate-spin animate-duration-1000" />
        <span>INITIALISATION DE LA LIAISON SÉCURISÉE HASH'N FLASH MOCRO...</span>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex flex-col bg-black text-[#FCFAF6] antialiased font-sans relative"
      style={{
        backgroundImage: 'url(/uploads/02515376-4f94-43a7-bd23-4edfbb399be5.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Full layout ambient translucent obsidian overlay */}
      <div className="absolute inset-0 bg-black/85 z-0 pointer-events-none" />
      
      {/* Floating Haptic Bubble Feedback */}
      <AnimatePresence>
        {showHapticBubble && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 15, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-3 left-1/2 -translate-x-1/2 z-50 bg-black/90 backdrop-blur-md border border-[#D4AF37]/50 px-4 py-2 rounded-full text-[9px] text-[#FCFAF6] font-mono tracking-wider shadow-lg flex items-center gap-1.5 pointer-events-none"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>{hapticFeedbackText.toUpperCase()}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {showIntro ? (
          <IntroScreen 
            onEnter={() => setShowIntro(false)}
            audioPlaying={ambientAudioPlaying}
            onToggleAudio={toggleAtmosphericAudio}
            triggerHaptic={triggerHapticFeedback}
            settings={brandingSettings}
            tgUser={tgUser}
            isWhitelisted={isUserWhitelisted}
          />
        ) : (
          <motion.div 
            key="storefront"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col min-h-screen relative pb-12 z-10"
          >
            {/* OMERTA STICKY PREMIUM HEADER BAR */}
            <header className={`sticky top-0 z-30 transition-all duration-300 px-5 py-4 flex items-center justify-between border-b ${scrolled ? 'bg-black/95 backdrop-blur-md shadow-lg border-neutral-900' : 'bg-transparent border-transparent'}`}>
              <div className="flex items-center gap-2.5">
                {/* EC Logo Emblem in dual gold borders */}
                <div 
                  onClick={() => {
                    triggerHapticFeedback('medium', "Menu Principal");
                    setShowIntro(true);
                  }}
                  className="w-10 h-10 rounded-full border-2 border-[#D4AF37] flex items-center justify-center bg-black cursor-pointer transition active:scale-95 shadow-lg select-none shrink-0"
                >
                  <span className="font-mono text-[13px] tracking-[0.1em] font-black text-[#D4AF37] translate-x-[1px]">HF</span>
                </div>
                
                {/* Left labels */}
                <div className="flex flex-col text-left">
                  <span className="font-mono text-[11px] font-bold text-neutral-100 tracking-[0.15em] leading-tight">HASH'N FLASH MOCRO</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
                    <span className="font-mono text-[7px] font-black text-neutral-400 tracking-widest uppercase">PORTAL ACTIVE</span>
                  </div>
                </div>

                {/* Interactive Dynamic Haptic Badge in header as shown in screenshot */}
                <AnimatePresence>
                  {hapticFeedbackText && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, x: -8 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="ml-1 border border-[#D4AF37]/55 rounded-full px-2.5 py-0.5 text-[7.5px] text-[#D4AF37] flex items-center gap-1 font-mono uppercase bg-[#D4AF37]/5 font-black tracking-[0.12em] select-none shrink-0"
                    >
                      <Sparkles className="w-2 h-2 text-[#D4AF37] stroke-[3px]" />
                      <span>Haptic: {hapticFeedbackText.toUpperCase()}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* NAVIGATION ACTIONS */}
              <div className="flex items-center gap-2.5">
                
                {/* Drone atmospheric ambient trigger */}
                <button 
                  onClick={() => {
                    triggerHapticFeedback('light', "Audio Ambiance");
                    toggleAtmosphericAudio();
                  }}
                  className={`p-2.5 rounded-xl border text-xs flex items-center transition cursor-pointer ${ambientAudioPlaying ? 'border-red-900 text-red-500 bg-red-950/20' : 'border-neutral-900 text-neutral-400 hover:text-[#D4AF37] bg-black/45'}`}
                  title="Atmosphère sonore d'appartement"
                  id="header_audio_btn"
                >
                  {ambientAudioPlaying ? <Volume2 className="w-3.5 h-3.5 text-red-500" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>

                {/* Admin Atelier Shortcut */}
                {isAdminUserWhitelisted && (
                  <button 
                    onClick={() => {
                      triggerHapticFeedback('medium');
                      handleOpenAdmin();
                    }}
                    className="p-2.5 rounded-xl bg-black/45 border border-neutral-900 text-neutral-400 hover:bg-neutral-900 hover:text-[#D4AF37] transition duration-300 flex items-center justify-center cursor-pointer shadow-xs relative"
                    title="Console Administration OMERTA"
                    id="header_admin_btn"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                  </button>
                )}

                {/* Shopping bag layout */}
                <button
                  onClick={() => {
                    triggerHapticFeedback('light', "Panier privé");
                    setShowCart(true);
                  }}
                  className="relative p-2.5 rounded-xl bg-black/45 border border-neutral-900 hover:border-[#D4AF37]/45 transition duration-300 flex items-center justify-center cursor-pointer shadow-sm"
                  id="open_cart_drawer_btn"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-[#D4AF37]" />
                  {cart.length > 0 && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 bg-red-650 text-white text-[7.5px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-black"
                    >
                      {cart.length}
                    </motion.span>
                  )}
                </button>
              </div>
            </header>

            {/* SUBSCRIBER MEMBER CARD */}
            <div className="mx-5 mt-4 py-3.5 px-4 rounded-2xl bg-black/40 border border-neutral-900/80 flex items-center justify-between relative z-10 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-neutral-950 border border-neutral-800 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-[#D4AF37]" />
                </div>
                <div>
                  <span className="text-[7px] text-neutral-500 font-mono block uppercase tracking-[0.16em]">SUBSCRIBER AUTH :</span>
                  <div className="text-[11px] font-bold text-white font-mono leading-tight">
                    {tgUser.username ? `@${tgUser.username}` : '@0merta_068'}
                  </div>
                </div>
              </div>

              {/* Status Indicator Badge */}
              <div className="border border-[#D4AF37]/50 rounded-full px-3 py-1 text-[8.5px] text-[#D4AF37] flex items-center gap-1.5 font-mono uppercase tracking-[0.12em] bg-[#D4AF37]/5 font-black shrink-0 shadow-xs select-none">
                <span>✨ ELITE MEMBER</span>
              </div>
            </div>

            {/* LUXURY EDITORIAL HOME HERO SECTION (EXPOSITION DISPLAY) */}
            <div className="px-5 mt-5 relative z-10">
              <div 
                className="py-10 px-6 rounded-2xl border border-neutral-900/65 relative overflow-hidden flex flex-col items-center justify-center text-center min-h-[140px] md:min-h-[160px] shadow-2xl bg-black"
              >
                {/* Dynamically support Video or Image for Hero Banner Background */}
                {brandingSettings?.homepageHeroBgUrl && isVideoUrl(brandingSettings.homepageHeroBgUrl) ? (
                  <video 
                    src={brandingSettings.homepageHeroBgUrl} 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                    className="absolute inset-0 w-full h-full object-cover z-0 opacity-60 filter brightness-[0.4]"
                  />
                ) : (
                  <div 
                    className="absolute inset-0 bg-cover bg-center z-0 opacity-60 filter brightness-[0.4]"
                    style={{
                      backgroundImage: `url(${brandingSettings?.homepageHeroBgUrl || '/uploads/02515376-4f94-43a7-bd23-4edfbb399be5.png'})`
                    }}
                  />
                )}
                
                {/* Vintage dark blend to overlay nicely with image details like chessboard */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/30 to-black/85 z-1" />
                
                <div className="relative z-10 flex flex-col items-center">
                  <h2 className="font-display text-3xl md:text-4xl tracking-[0.35em] text-white uppercase font-light leading-none">
                    EXPOSITION
                  </h2>
                  <p className="text-[8px] md:text-[9px] font-mono tracking-[0.25em] text-[#D4AF37] font-extrabold uppercase mt-3.5 select-none text-center">
                    RESERVES URBAINES HAUT DE GAMME
                  </p>
                </div>
              </div>
            </div>

            {/* FILTRES SECURILES HORIZONTAL SELECTION ROW */}
            <div className="px-5 mt-7 relative z-10">
              <span className="block text-[7.5px] font-mono text-neutral-500 uppercase tracking-[0.22em] mb-2.5 font-black leading-none">
                FILTRER LES COLLECTIONS SÉCURISÉES :
              </span>
              <div className="flex gap-2 pb-2 overflow-x-auto scrollbar-none">
                {['FROZEN', 'STATIC', 'DRY', 'MEET UP RABAT', 'ACCESSOIRES', 'All'].map((cat) => {
                  const active = activeCategory.toLowerCase() === cat.toLowerCase();
                  return (
                    <button
                      key={cat}
                      onClick={() => {
                        triggerHapticFeedback('light', `Filtre: ${cat}`);
                        setActiveCategory(cat);
                      }}
                      className={`px-5 py-2.5 rounded-xl text-[9.5px] tracking-[0.16em] transition-all duration-300 font-bold font-mono whitespace-nowrap cursor-pointer border ${
                        active 
                          ? 'bg-white text-black border-white shadow-xl scale-102 font-black' 
                          : 'bg-neutral-950/65 border-neutral-900/80 text-neutral-400 hover:text-[#D4AF37] hover:border-[#D4AF37]/50'
                      }`}
                    >
                      {cat === 'All' ? 'TOUTE LA RÉSERVE' : cat.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="w-full h-[1px] bg-neutral-900/85 my-4.5 relative z-10" />

            {/* PRIMARY PRODUCT GALLERY */}
            <div className="px-5 flex-1 relative z-10" id="products-grid">
              
              {activeSectionTitle && (
                <div className="mb-5 text-center py-2 border-y border-neutral-900 bg-neutral-950/40 rounded-xl relative overflow-hidden">
                  <h3 
                    className="font-mono font-medium uppercase tracking-[0.2em] leading-tight text-sm text-[#D4AF37]"
                  >
                    {activeSectionTitle.text}
                  </h3>
                  <div className="w-8 h-[1px] mx-auto mt-1 bg-[#D4AF37]/30" />
                </div>
              )}

              {filteredProducts.length === 0 ? (
                <div className="py-24 text-center flex flex-col items-center justify-center relative z-10">
                  <span className="font-mono text-[9.5px] text-neutral-500 tracking-wider">
                    Aucun produit d'exception enregistré dans cette série.
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {filteredProducts.map((p) => {
                    // Check if user has interactively changed color for this card thumbnail block
                    const localColorOverride = selectedProductColorMap[p.id];
                    const activeImagePreview = localColorOverride ? localColorOverride.imageUrl : (p.thumbnailUrl || '');

                    return (
                      <div
                        key={p.id}
                        className="bg-neutral-950/40 border border-neutral-900 hover:border-[#D4AF37]/45 transition-all duration-350 rounded-2xl overflow-hidden flex flex-col justify-between group shadow-lg relative"
                      >
                        {/* Featured gold star corner tag */}
                        {p.isFeatured && (
                          <div className="absolute top-2.5 left-2.5 z-10 bg-[#D4AF37] text-black px-2 py-0.5 rounded text-[7px] tracking-widest font-mono flex items-center gap-1 uppercase select-none font-extrabold shadow-sm">
                            ★ SÉLECTION PRIVÉE
                          </div>
                        )}

                        {/* Image aspect card preview */}
                        <div
                          onClick={() => {
                            triggerHapticFeedback('medium');
                            setSelectedProduct(p);
                          }}
                          className="aspect-[4/5] w-full relative bg-black overflow-hidden cursor-pointer flex flex-col items-center justify-center"
                        >
                          {/* Featured gold star corner tag moved inside card preview if needed, or overlay */}
                          {p.videoUrl && p.videoUrl.trim() !== '' && (
                            <div className="absolute top-2.5 right-2.5 z-10 bg-black/80 backdrop-blur-md rounded-full p-1.5 border border-[#D4AF37]/45 text-[#D4AF37] shadow-lg">
                              <span className="sr-only">Vidéo disponible</span>
                              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          )}

                          {activeImagePreview && activeImagePreview.trim() !== "" && !activeImagePreview.includes('/input_file') ? (
                            <>
                              <img
                                src={activeImagePreview}
                                alt={p.title}
                                className="w-full h-full object-contain bg-black transition-transform duration-750 group-hover:scale-102 pointer-events-none"
                                loading="lazy"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                            </>
                          ) : (
                            <div className="w-full h-full bg-gradient-to-b from-neutral-950 to-neutral-900 flex flex-col justify-center items-center text-center p-3 relative font-mono select-none">
                              <div className="absolute inset-2 border border-dashed border-neutral-900/50 rounded-xl pointer-events-none" />
                              <div className="w-9 h-9 rounded-full border border-[#D4AF37]/20 flex items-center justify-center bg-black/60 text-[#D4AF37] text-[10px] font-black uppercase tracking-widest mb-1.5 shadow-inner">
                                {p.category ? p.category.substring(0, 2).toUpperCase() : 'Ω'}
                              </div>
                              <span className="text-[7.5px] font-black tracking-[0.2em] text-[#D4AF37] block">
                                SÉLECTION PRIVÉE
                              </span>
                              <span className="text-[7px] font-bold text-neutral-500 tracking-[0.1em] block mt-0.5 uppercase">
                                Sans Illustration
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Text labels, sizing clickers and color swatches */}
                        <div className="p-3 bg-neutral-950 flex-1 flex flex-col justify-between">
                          <div 
                            onClick={() => {
                              triggerHapticFeedback('medium');
                              setSelectedProduct(p);
                            }}
                            className="cursor-pointer space-y-1"
                          >
                            <span className="text-[7.5px] font-mono text-[#D4AF37] tracking-[0.15em] block uppercase font-extrabold">
                              {p.category}
                            </span>
                            <h3 className="font-mono font-medium text-xs text-[#FCFAF6] tracking-wide uppercase line-clamp-1 truncate">
                              {p.title}
                            </h3>
                            {/* Stars ratings */}
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-amber-500 text-[10px] tracking-tighter shrink-0">
                                {"★".repeat(Math.round(p.rating || 5))}
                                {"☆".repeat(5 - Math.round(p.rating || 5))}
                              </span>
                              <span className="text-[8px] text-neutral-500 font-light font-mono font-bold leading-none">
                                ({p.reviewCount || 42})
                              </span>
                            </div>
                            <p className="text-[9.5px] text-neutral-400 font-light mt-1.5 leading-relaxed line-clamp-2">
                              {p.description}
                            </p>
                          </div>

                          <div className="flex items-center justify-between border-t border-neutral-900 mt-3 pt-2.5">
                            <span className="font-mono text-xs font-semibold text-[#D4AF37]">
                              {p.price} MAD {!(p.category || '').toLowerCase().includes('accessoire') ? '/g' : ''}
                            </span>

                            <button
                              onClick={() => {
                                triggerHapticFeedback('medium');
                                setSelectedProduct(p);
                              }}
                              className="bg-[#D4AF37] text-black hover:bg-amber-400 py-1.5 px-3 rounded-lg text-[8px] tracking-widest font-mono font-extrabold uppercase transition duration-300 cursor-pointer"
                            >
                              SÉLECTIONNER
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* OMERTA47 SECURITY PORTAL FOOTER TILES */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-5 mt-10 relative z-10 font-mono text-center select-none">
              {/* Tile 1: Communauté Sélecte */}
              <div 
                onClick={() => triggerHapticFeedback('medium', "Communauté Sélecte")}
                className="p-4 rounded-xl bg-black/45 backdrop-blur-md border border-neutral-900/65 flex flex-col items-center justify-center min-h-[145px] hover:border-[#D4AF37]/35 transition duration-305 cursor-pointer shadow-lg"
              >
                <div className="w-12 h-12 rounded-full border border-red-950/40 bg-zinc-950/90 flex items-center justify-center relative mb-3.5 overflow-hidden shadow-inner">
                  <div className="absolute inset-x-0 bottom-0 top-0 bg-gradient-to-t from-red-950/30 to-transparent" />
                  <span className="text-[14px] font-black text-red-600 font-mono z-10 tracking-widest">92</span>
                </div>
                <span className="text-[9.5px] font-black text-red-650 tracking-[0.15em]">COMMUNAUTÉ</span>
                <span className="text-[9.5px] font-black text-red-650 tracking-[0.14em]">SÉLECTE</span>
              </div>

              {/* Tile 2: Accès Sécurisé */}
              <div 
                onClick={() => triggerHapticFeedback('medium', "Accès Sécurisé")}
                className="p-4 rounded-xl bg-black/45 backdrop-blur-md border border-neutral-900/65 flex flex-col items-center justify-center min-h-[145px] hover:border-[#D4AF37]/35 transition duration-305 cursor-pointer shadow-lg"
              >
                <div className="w-12 h-12 rounded-full border border-neutral-900/80 bg-zinc-950/90 flex items-center justify-center mb-3.5 text-red-600 shadow-inner">
                  <Lock className="w-4.5 h-4.5 text-red-600" />
                </div>
                <span className="text-[9.5px] font-black text-red-650 tracking-[0.15em]">ACCÈS</span>
                <span className="text-[9.5px] font-black text-red-650 tracking-[0.14em]">SÉCURISÉ</span>
              </div>

              {/* Tile 3: Contenu Exclusif */}
              <div 
                onClick={() => triggerHapticFeedback('medium', "Contenu Exclusif")}
                className="p-4 rounded-xl bg-black/45 backdrop-blur-md border border-neutral-900/65 flex flex-col items-center justify-center min-h-[145px] hover:border-[#D4AF37]/35 transition duration-305 cursor-pointer shadow-lg"
              >
                <div className="w-12 h-12 rounded-full border border-red-950 bg-zinc-950/90 flex items-center justify-center mb-3.5 text-red-600 font-bold relative shadow-inner">
                  <span className="text-[13px] font-black tracking-tighter text-red-600 z-10">47</span>
                  <div className="absolute inset-0 border border-red-900/10 rounded-full animate-pulse" />
                </div>
                <span className="text-[9.5px] font-black text-red-650 tracking-[0.15em]">CONTENU</span>
                <span className="text-[9.5px] font-black text-red-650 tracking-[0.14em]">EXCLUSIF</span>
              </div>

              {/* Tile 4: Hash'N Flash Mocro Réseau */}
              <div 
                onClick={() => triggerHapticFeedback('medium', "Mocro Réseau")}
                className="p-4 rounded-xl bg-black/45 backdrop-blur-md border border-neutral-900/65 flex flex-col items-center justify-center min-h-[145px] hover:border-[#D4AF37]/35 transition duration-305 cursor-pointer shadow-lg"
              >
                <div className="w-12 h-12 rounded-full border border-neutral-900/80 bg-zinc-950/90 flex items-center justify-center mb-3.5 text-red-600 shadow-inner">
                  <Globe className="w-4.5 h-4.5 text-red-600 animate-pulse" />
                </div>
                <span className="text-[9.5px] font-black text-red-650 tracking-[0.15em]">MOCRO</span>
                <span className="text-[9.5px] font-black text-red-650 tracking-[0.14em]">RÉSEAU</span>
              </div>
            </div>

            {/* VICTORIA'S SECRET LUXURY STYLE REVIEWS PANEL */}
            <div className="mx-5 mt-8 p-6 bg-[#090909] border border-neutral-900 rounded-2xl space-y-5">
              <div className="text-center space-y-1.5">
                <h3 className="font-mono font-medium text-lg uppercase tracking-wide text-[#FCFAF6]">PAROLES D'EXPERT</h3>
                <p className="text-[8.5px] font-mono text-[#D4AF37] tracking-[0.2em] uppercase font-bold">L'avis de nos membres exclusifs</p>
                <div className="w-8 h-[1px] bg-[#D4AF37] mx-auto mt-1" />
              </div>

              <div className="space-y-4">
                {/* Review 1 */}
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-900 space-y-2 relative">
                  <div className="flex justify-between items-center text-[9.5px] font-mono">
                    <div className="flex gap-1 text-amber-500">★★★★★</div>
                    <span className="text-[#D4AF37]/80">Membre VIP</span>
                  </div>
                  <p className="font-mono text-[11px] italic text-neutral-300 leading-relaxed">
                    "Absolument divin. Le Double Filtré d'Omerta possède une texture grasse et des arômes d'une justesse rare. Le service de livraison sécurisé par Telegram est d'une discrétion chirurgicale."
                  </p>
                  <div className="text-[9px] font-mono font-bold text-[#D4AF37] uppercase tracking-wider flex items-center justify-between">
                    <span>— Karim B. (Casablanca)</span>
                    <span className="text-[8px] font-normal text-neutral-500">Il y a 2 jours</span>
                  </div>
                </div>

                {/* Review 2 */}
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-900 space-y-2">
                  <div className="flex justify-between items-center text-[9.5px] font-mono">
                    <div className="flex gap-1 text-amber-500">★★★★★</div>
                    <span className="text-[#D4AF37]/80">Membre VIP</span>
                  </div>
                  <p className="font-mono text-[11px] italic text-neutral-300 leading-relaxed">
                    "Le Frozen Sift est exceptionnel. Un taux d'humidité optimal et un goût de résine pure incroyable. Omerta reste inégalable à chaque réassort."
                  </p>
                  <div className="text-[9px] font-mono font-bold text-[#D4AF37] uppercase tracking-wider flex items-center justify-between">
                    <span>— Youssef T. (Marrakech)</span>
                    <span className="text-[8px] font-normal text-neutral-500">Il y a 1 semaine</span>
                  </div>
                </div>

                {/* Review 3 */}
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-900 space-y-2">
                  <div className="flex justify-between items-center text-[9.5px] font-mono">
                    <div className="flex gap-1 text-amber-500">★★★★★</div>
                    <span className="text-[#D4AF37]/80">Membre VIP</span>
                  </div>
                  <p className="font-mono text-[11px] italic text-neutral-300 leading-relaxed">
                    "Une expérience d'achat d'élite. Le Beldia traditionnel me rappelle les meilleures années de Ketama. Excellent travail de sélection."
                  </p>
                  <div className="text-[9px] font-mono font-bold text-[#D4AF37] uppercase tracking-wider flex items-center justify-between">
                    <span>— Mehdi A. (Rabat)</span>
                    <span className="text-[8px] font-normal text-neutral-500">Il y a 3 semaines</span>
                  </div>
                </div>
              </div>
            </div>

            {/* MINIMAL NEWSLETTER BOX */}
            <div className="mx-5 mt-8 p-6 bg-neutral-950 border border-neutral-900 rounded-2xl text-center space-y-4">
              <div className="space-y-1.5">
                <h3 className="font-mono font-medium text-base uppercase tracking-widest text-[#FCFAF6]">ACCÈS CANAL PRIVÉ</h3>
                <p className="text-[10px] text-neutral-400 max-w-xs mx-auto leading-relaxed">
                  Soyez averti(e) par e-mail ou Telegram en priorité du réassort de nos confections exclusives.
                </p>
              </div>

              {newsletterSubscribed ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-3.5 bg-[#FAF7F2] border border-[#EFE9E0] rounded-xl text-xs font-sans text-emerald-700 font-semibold"
                >
                  ✓ Bienvenue au club. Votre invitation privilège vous a été envoyée.
                </motion.div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-2 max-w-sm mx-auto font-sans">
                  <input
                    type="email"
                    placeholder="Saisir votre adresse e-mail..."
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="flex-1 p-2.5 rounded-xl border border-[#EFE3D5] text-xs focus:outline-none focus:border-black bg-[#FCFAF6]"
                  />
                  <button
                    type="submit"
                    className="py-2.5 px-5 rounded-xl bg-[#1C1B19] hover:bg-neutral-800 text-white font-semibold text-[10px] tracking-wider uppercase transition cursor-pointer"
                  >
                    S'inscrire
                  </button>
                </form>
              )}
            </div>

            {/* FULLSCREEN INDIVIDUAL PRODUCT DETAIL DIALOG */}
            <AnimatePresence>
              {selectedProduct && (
                <ProductDetailModal
                  product={selectedProduct}
                  onClose={() => setSelectedProduct(null)}
                  onAddToCart={(p, size, color) => {
                    handleAddToCart(p, size, color);
                    setSelectedProduct(null);
                  }}
                  onInstantBuy={(p, size, color) => {
                    handleAddToCart(p, size, color);
                    setSelectedProduct(null);
                    setShowCart(true);
                  }}
                  triggerHaptic={triggerHapticFeedback}
                />
              )}
            </AnimatePresence>

            {/* CART DRAWER */}
            <AnimatePresence>
              {showCart && (
                <CartDrawer
                  cart={cart}
                  onRemoveItem={handleRemoveCartItem}
                  onClearCart={handleClearCart}
                  onClose={() => setShowCart(false)}
                  onCheckoutSuccess={handleCheckoutComplete}
                  triggerHaptic={triggerHapticFeedback}
                />
              )}
            </AnimatePresence>

            {/* SECURE PASSWORD PROMPT MODAL */}
            <AnimatePresence>
              {showPasswordPrompt && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md"
                >
                  <motion.div 
                    initial={{ scale: 0.95, y: 15 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 15 }}
                    className="w-full max-w-sm bg-neutral-950 border border-[#D4AF37]/25 p-6 rounded-2xl space-y-6 text-center select-none shadow-2xl relative"
                  >
                    <div className="absolute top-4 right-4">
                      <button 
                        onClick={() => setShowPasswordPrompt(false)} 
                        className="text-neutral-500 hover:text-white transition p-1 cursor-pointer"
                        type="button"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2 mt-2">
                      <div className="w-12 h-12 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto border border-[#D4AF37]/20Animation">
                        <Lock className="w-5 h-5 text-[#D4AF37]" />
                      </div>
                      <h3 className="text-xs font-mono tracking-widest text-[#D4AF37] uppercase font-bold">
                        ACCÈS SÉCURISÉ
                      </h3>
                      <p className="text-[9px] font-mono text-neutral-400">
                        Veuillez entrer le mot de passe secret de la maison pour accéder à l'Atelier d'Administration d'OMERTA.
                      </p>
                    </div>

                    <form 
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const success = await verifyAdminPassword(adminPasswordInput);
                        if (success) {
                          setPasswordAuthenticated(true);
                          setShowPasswordPrompt(false);
                          setShowAdmin(true);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                          triggerHapticFeedback('success', "Accès Autorisé");
                        } else {
                          setPasswordPromptError('Mot de passe incorrect');
                          triggerHapticFeedback('error', "Échec de l'accès");
                        }
                      }}
                      className="space-y-4"
                    >
                      <input 
                        type="password"
                        value={adminPasswordInput}
                        onChange={(e) => {
                          setAdminPasswordInput(e.target.value);
                          if (passwordPromptError) setPasswordPromptError('');
                        }}
                        placeholder="••••••••"
                        className="w-full text-center py-2 px-4 rounded-xl bg-black border border-neutral-800 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] text-white outline-none tracking-[0.5em] font-bold text-sm"
                        autoFocus
                      />

                      {passwordPromptError && (
                        <p className="text-[9px] font-mono text-red-500 font-bold">
                          ⚠️ {passwordPromptError}
                        </p>
                      )}

                      <div className="flex gap-2">
                        <button 
                          type="button"
                          onClick={() => setShowPasswordPrompt(false)}
                          className="flex-1 py-2 text-[9px] font-mono font-bold uppercase rounded-xl border border-neutral-900 bg-neutral-950 text-neutral-400 hover:bg-neutral-900 hover:text-white transition cursor-pointer"
                        >
                          Annuler
                        </button>
                        <button 
                          type="submit"
                          className="flex-1 py-2 text-[9px] font-mono font-bold uppercase rounded-xl bg-[#D4AF37] text-black hover:bg-amber-400 transition cursor-pointer"
                        >
                          Valider
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ADMIN CONSOLE DIALOG (SECRET FOOTER BUTTON ACCESS GIVING CONTROL BACK) */}
            <AnimatePresence>
              {showAdmin && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-white p-1">
                  <AdminPanel
                    products={products}
                    tgUser={tgUser}
                    onRefreshProducts={async () => {
                      await loadCatalogData();
                    }}
                    triggerHaptic={(style) => triggerHapticFeedback(style)}
                    onClose={async () => {
                      setShowAdmin(false);
                      await loadWhitelistData();
                    }}
                    onBrandingChange={(newSettings) => {
                      setBrandingSettings(newSettings);
                    }}
                  />
                </div>
              )}
            </AnimatePresence>

            {/* OMERTA LUXURY FOOTER */}
            <footer className="mt-14 pb-12 border-t border-neutral-900 pt-8 px-6 text-center space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-left max-w-2xl mx-auto text-[10.5px] font-mono text-neutral-400 leading-relaxed font-light">
                <div className="space-y-2">
                  <h4 className="font-mono text-[10px] text-neutral-200 uppercase font-semibold">LA MAISON</h4>
                  <ul className="space-y-1">
                    <li className="hover:text-[#D4AF37] transition cursor-pointer">Notre Philosophie</li>
                    <li className="hover:text-[#D4AF37] transition cursor-pointer">Savoir-Faire Ketama</li>
                    <li className="hover:text-[#D4AF37] transition cursor-pointer">Qualité & Analyses</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-mono text-[10px] text-neutral-200 uppercase font-semibold">SERVICES</h4>
                  <ul className="space-y-1">
                    <li className="hover:text-[#D4AF37] transition cursor-pointer">Guide d'affinage</li>
                    <li className="hover:text-[#D4AF37] transition cursor-pointer">Expédition Sécurisée</li>
                    <li className="hover:text-[#D4AF37] transition cursor-pointer">Protocole Discrétion</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-mono text-[10px] text-neutral-200 uppercase font-semibold">LEGAL</h4>
                  <ul className="space-y-1">
                    <li className="hover:text-[#D4AF37] transition cursor-pointer">Sécurité Militaire</li>
                    <li className="hover:text-[#D4AF37] transition cursor-pointer">Zéro Log Politique</li>
                    <li className="hover:text-[#D4AF37] transition cursor-pointer">Conditions Membre</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-mono text-[10px] text-neutral-200 uppercase font-semibold">AIDE</h4>
                  <ul className="space-y-1">
                    <li className="hover:text-[#D4AF37] transition cursor-pointer">F.A.Q. Hash'N Flash</li>
                    <li className="hover:text-[#D4AF37] transition cursor-pointer">Suivi Crypté</li>
                    <li className="hover:text-[#D4AF37] transition cursor-pointer">Service Client TG</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-2 pt-4 select-none">
                <span className="block text-[8.5px] font-mono tracking-[0.3em] text-[#D4AF37] uppercase font-bold">
                  HASH'N FLASH MOCRO — LA RÉSERVE PRIVÉE
                </span>
                
                <div className="flex items-center justify-center gap-2.5 text-[7.5px] font-mono text-neutral-500 uppercase">
                  <span>© 2026 HASH'N FLASH MOCRO</span>
                  <span>&bull;</span>
                  <span>SHA-256 ENCRYPTED</span>
                  
                  {isAdminUserWhitelisted && (
                    <>
                      <span>&bull;</span>
                      <button 
                        onClick={() => {
                          triggerHapticFeedback('heavy');
                          handleOpenAdmin();
                        }}
                        className="text-[#D4AF37] underline hover:text-amber-400 cursor-pointer text-[8px]"
                        id="admin_footer_link"
                      >
                        Atelier Administrateur
                      </button>
                    </>
                  )}
                </div>
              </div>
            </footer>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
