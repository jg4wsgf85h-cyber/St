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

export interface BrandingSettings {
  introBgUrl: string;
  launchScreenUrl: string;
  homepageHeroBgUrl: string;
  logoUrl: string;
  introStatusLine: string;
  sectionTitles?: SectionTitle[];
  adminPassword?: string;
}

export interface WhitelistItem {
  id: string;
  value: string;
  type: 'ID' | 'Username';
  notes?: string;
}

export function getPriceForSize(basePricePerGram: number, size: string, category?: string): number {
  const cat = (category || '').trim().toLowerCase();
  
  if (cat.includes('accessoire') || cat.includes('accessories')) {
    return basePricePerGram;
  }
  
  const matches = size.match(/(\d+(?:\.\d+)?)/);
  if (matches) {
    const grams = parseFloat(matches[1]);
    return basePricePerGram * grams;
  }
  return basePricePerGram;
}
