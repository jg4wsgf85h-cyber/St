/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface VideoItem {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: 'Double Filtré' | 'Frozen Sift' | 'Beldi' | 'Sift Glacé' | string;
  displayZone?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  imageUrl?: string;
  isPremium: boolean;
  isFeatured?: boolean;
  rating?: number;
  reviewCount?: number;
  author: string;
  views: number;
  duration?: string;
  pricePerGram?: number;
  additionalPhotos?: string[];
  colors?: { name: string; hex: string; imageUrl: string }[];
  badge?: string;
  status?: string;
  stock?: number;
  wholesalePrice?: number;
}

export interface CartItem {
  id: string;
  product: VideoItem;
  selectedSize: string;
  selectedColor: { name: string; hex: string; imageUrl: string };
  quantity: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  customerName: string;
  email: string;
  phoneNumber: string;
  country: string;
  city: string;
  address: string;
  zipCode: string;
  paymentMethod: 'card' | 'apple_pay' | 'paypal' | 'cod';
  items: {
    productId: string;
    title: string;
    price: number;
    category: string;
    selectedSize: string;
    selectedColor: string;
    quantity: number;
  }[];
  totalAmount: number;
  date: string;
  status: 'pending' | 'completed' | 'cancelled';
  appliedPromoCode?: string;
  telegramId?: string;
  telegramUsername?: string;
}

export interface SectionTitle {
  id: string;
  text: string;
  category: string;
  size: 'S' | 'M' | 'L' | 'XL';
  color: string;
  enabled: boolean;
  order: number;
}

export interface MarqueeItem {
  id: string;
  text: string;
  active: boolean;
  order: number;
}

export interface MarqueeConfig {
  enabled: boolean;
  speed: 'slow' | 'medium' | 'fast';
  items: MarqueeItem[];
}

export const DEFAULT_MARQUEE_CONFIG: MarqueeConfig = {
  enabled: true,
  speed: 'medium',
  items: [
    { id: 'm1', text: '✨ Bienvenue dans 🍪🌾 BISCOTTI BOYS FARMZ 🌾🍪', active: true, order: 1 },
    { id: 'm2', text: '🚀 Livraison Express 24h/48h Discrète & Sécurisée', active: true, order: 2 },
    { id: 'm3', text: '🔒 Accès Privé Vérifié • Réserve Exclusive', active: true, order: 3 },
    { id: 'm4', text: '💎 Produits 100% Authentiques & Qualité Supérieure', active: true, order: 4 },
    { id: 'm5', text: '👑 Espace VIP : Offres Réservées & Récompenses Cumulées', active: true, order: 5 },
  ],
};

export interface BrandingSettings {
  appDisabled?: boolean;
  introBgUrl: string;
  mainBgUrl?: string;
  launchScreenUrl: string;
  homepageHeroBgUrl: string;
  logoUrl: string;
  bgLogoUrl?: string;
  introVideoUrl?: string;
  introStatusLine: string;
  sectionTitles?: SectionTitle[];
  marqueeConfig?: MarqueeConfig;
  customAppUrl?: string;
  adminPassword?: string;
  instagramUrl?: string;
  instagramUrl2?: string;
  telegramChannelUrl?: string;
  telegramSupportUrl?: string;
  signalUrl?: string;
  whatsappUrl?: string;
  promoMessageText?: string;
  promoButtonText?: string;
  promoButtonText2?: string;
  promoImageUrl?: string;
}

export interface WhitelistItem {
  id: string;
  value: string;
  type: 'ID' | 'Username';
  notes?: string;
}

export interface PendingApproval {
  id: string;
  telegramId: string;
  username: string;
  firstName?: string;
  lastName?: string;
  date: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export function getSizeOptionsForCategory(category?: string): string[] {
  const cat = (category || '').trim().toLowerCase();
  if (cat.includes('accessoire') || cat.includes('accessories')) {
    return ['1 unité', '2 unités', '3 unités', '5 unités', '10 unités'];
  }
  if (cat.includes('static') || cat.includes('wppf') || cat.includes('wpff')) {
    return ['5g', '10g', '25g', '50g', '100g'];
  }
  return ['10g', '25g', '50g', '100g'];
}

export function getDefaultSizeForProduct(product: VideoItem): string {
  const options = getSizeOptionsForCategory(product.category);
  return options[0] || '10g';
}

export function getPriceForSize(basePricePerGram: number, size: string, category?: string): number {
  const cat = (category || '').trim().toLowerCase();
  
  if (cat.includes('accessoire') || cat.includes('accessories')) {
    const matches = size.match(/(\d+)/);
    if (matches) {
      const units = parseInt(matches[1], 10);
      return basePricePerGram * units;
    }
    return basePricePerGram;
  }
  
  const matches = size.match(/(\d+(?:\.\d+)?)/);
  if (matches) {
    let grams = parseFloat(matches[1]);
    if (size.toLowerCase().includes('kg')) {
      grams = grams * 1000;
    }
    return basePricePerGram * grams;
  }
  return basePricePerGram;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  minOrders: number;
  isActive: boolean;
  promoCode?: string;
}

export interface PromoCode {
  id: string;
  code: string;
  type: 'fixed' | 'percent';
  value: number;
  maxUses?: number;
  timesUsed?: number;
  expiredAt?: string; // YYYY-MM-DD
  isActive: boolean;
}

export interface VipLevelConfig {
  name: string;
  minOrders: number;
  points: number;
  icon: string;
  badgeClass: string;
}

export const VIP_LEVELS: VipLevelConfig[] = [
  { name: 'Member', minOrders: 0, points: 0, icon: '🥉', badgeClass: 'from-orange-950/40 to-red-950/50 border-amber-700/60 text-amber-500' },
  { name: 'Silver', minOrders: 10, points: 10000, icon: '🥈', badgeClass: 'from-zinc-800/40 to-zinc-950/50 border-zinc-400 text-zinc-300' },
  { name: 'Gold', minOrders: 20, points: 20000, icon: '🥇', badgeClass: 'from-amber-950/40 to-yellow-950/50 border-amber-500 text-amber-200' },
  { name: 'Elite', minOrders: 30, points: 30000, icon: '💎', badgeClass: 'from-purple-900/40 to-indigo-950/50 border-purple-500 text-purple-200' }
];

export interface ReviewItem {
  id: string;
  telegramId: string;
  telegramUsername: string;
  authorName: string;
  rating: number;
  comment: string;
  date: string;
  vipLevel?: string;
  verifiedPurchase: boolean;
  productCategory?: string;
}

export interface UserProfile {
  id: string;
  telegramId: string;
  telegramUsername: string;
  pseudo: string;
  dateJoined: string;
  totalOrders: number;
  totalSpent: number;
  points: number;
  level: string;
  unlockedRewards?: string[];
}
