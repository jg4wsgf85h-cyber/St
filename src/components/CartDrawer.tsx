/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Trash2, 
  ShoppingBag, 
  CheckCircle2, 
  Sparkles, 
  ChevronRight,
  ShieldCheck,
  Building2,
  MapPin,
  Phone,
  User,
  Truck,
  Mail,
  CreditCard,
  Copy,
  Check,
  Send
} from 'lucide-react';
import { CartItem, Order } from '../types';
import { createOrder, validatePromoCode } from '../db';
import { useLanguage } from '../i18n/LanguageContext';

interface CartDrawerProps {
  cart: CartItem[];
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onClose: () => void;
  onCheckoutSuccess: (method: string, amount: number, itemTitles: string[]) => void;
  triggerHaptic: (style: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error', customMessage?: string) => void;
  telegramId?: string;
  telegramUsername?: string;
}

const MOROCCAN_CITIES = [
  'Casablanca',
  'Rabat',
  'Marrakech',
  'Tanger',
  'Fès',
  'Agadir',
  'Oujda',
  'Meknès',
  'Kénitra',
  'Tétouan',
  'El Jadida',
  'Nador',
  'Laâyoune',
  'Paris (Livraison Europe)',
  'Bruxelles (Livraison Europe)',
  'Genève (Livraison Europe)'
];

export default function CartDrawer({
  cart,
  onRemoveItem,
  onClearCart,
  onClose,
  onCheckoutSuccess,
  triggerHaptic,
  telegramId,
  telegramUsername
}: CartDrawerProps) {
  const { t } = useLanguage();
  // Steps: 'list' | 'checkout' | 'success'
  const [step, setStep] = useState<'list' | 'checkout' | 'success'>('list');
  
  // Customer Information fields - Prepopulated
  const [customerName, setCustomerName] = useState<string>('');
  const [emailAddress, setEmailAddress] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('Casablanca');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [zipCode, setZipCode] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'card'>('cod');

  useEffect(() => {
    try {
      const tg = (window as any).Telegram?.WebApp;
      let nameValue = '';
      let emailValue = '';
      if (tg?.initDataUnsafe?.user) {
        const user = tg.initDataUnsafe.user;
        nameValue = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || `Client_${user.id}`;
        emailValue = user.username ? `${user.username}@t.me` : `client_${user.id}@secmail.co`;
      }
      
      if (!nameValue) nameValue = 'Client SHELF TERPS';
      if (!emailValue) emailValue = 'client-shelfterps@secmail.co';
      
      setCustomerName(nameValue);
      setEmailAddress(emailValue);
    } catch (e) {
      setCustomerName('Client SHELF TERPS');
      setEmailAddress('client-shelfterps@secmail.co');
    }
  }, []);

  // Credit Card mock inputs
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardExpiry, setCardExpiry] = useState<string>('');
  const [cardCvv, setCardCvv] = useState<string>('');

  const [validationError, setValidationError] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  const pricingTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [cart]);

  // Promo code states
  const [promoCodeInput, setPromoCodeInput] = useState<string>('');
  const [appliedPromo, setAppliedPromo] = useState<any | null>(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState<boolean>(false);
  const [promoMessage, setPromoMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const discountAmount = useMemo(() => {
    if (!appliedPromo) return 0;
    if (appliedPromo.type === 'percent') {
      return Math.round((pricingTotal * appliedPromo.value) / 100);
    } else {
      return Math.min(appliedPromo.value, pricingTotal);
    }
  }, [appliedPromo, pricingTotal]);

  const finalTotalToPay = useMemo(() => {
    return Math.max(0, pricingTotal - discountAmount);
  }, [pricingTotal, discountAmount]);

  const handleApplyPromoCode = async () => {
    if (!promoCodeInput.trim()) return;
    setIsApplyingPromo(true);
    setPromoMessage(null);
    triggerHaptic('light');

    try {
      const formatted = promoCodeInput.trim().toUpperCase();
      const res = await validatePromoCode(formatted, pricingTotal, telegramId);
      if (res.valid) {
        setAppliedPromo({
          code: res.code || formatted,
          type: res.type,
          value: res.value
        });
        setPromoMessage({ text: `Code promo ${res.code || formatted} appliqué avec succès !`, isError: false });
        triggerHaptic('success');
      } else {
        setAppliedPromo(null);
        setPromoMessage({ text: res.error || 'Code promo invalide', isError: true });
        triggerHaptic('error');
      }
    } catch (e) {
      setAppliedPromo(null);
      setPromoMessage({ text: 'Erreur réseau de validation', isError: true });
      triggerHaptic('error');
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const hasItems = cart.length > 0;

  const validateForm = (): boolean => {
    let name = customerName.trim();
    if (!name) {
      name = 'Client SHELF TERPS';
      setCustomerName(name);
    }
    
    let email = emailAddress.trim();
    if (!email || !email.includes('@')) {
      email = 'client-shelfterps@secmail.co';
      setEmailAddress(email);
    }

    if (!phoneNumber.trim() || phoneNumber.length < 5) {
      setValidationError('Numéro de téléphone requis (min. 5 caractères).');
      return false;
    }
    if (!deliveryAddress.trim()) {
      setValidationError('L\'adresse exacte et le point de contact sont indispensables.');
      return false;
    }
    if (paymentMethod === 'card') {
      if (cardNumber.replace(/\s+/g, '').length < 16) {
        setValidationError('Veuillez saisir les 16 chiffres de votre carte bancaire.');
        return false;
      }
      if (!cardExpiry.includes('/')) {
        setValidationError('Date d\'expiration incorrecte (MM/AA).');
        return false;
      }
      if (cardCvv.length < 3) {
        setValidationError('CVV invalide.');
        return false;
      }
    }
    setValidationError('');
    return true;
  };

  const handleProceedToCheckout = () => {
    triggerHaptic('medium');
    setStep('checkout');
  };

  const submitOrder = async () => {
    if (!validateForm()) {
      triggerHaptic('error');
      return;
    }

    try {
      const generatedId = `N47-${Math.floor(Math.random() * 800000) + 100000}`;
      
      const newOrder: Order = {
        id: generatedId,
        customerName: customerName.trim(),
        email: emailAddress.trim(),
        phoneNumber: phoneNumber.trim(),
        country: selectedCity.includes('Europe') ? 'Europe' : 'Maroc',
        city: selectedCity,
        address: deliveryAddress.trim(),
        zipCode: zipCode.trim() || '10000',
        paymentMethod,
        items: cart.map(item => ({
          productId: item.product.id,
          title: item.product.title,
          price: item.totalPrice,
          category: item.product.category,
          selectedSize: item.selectedSize,
          selectedColor: item.selectedColor.name,
          quantity: item.quantity
        })),
        totalAmount: finalTotalToPay,
        date: new Date().toISOString(),
        status: 'pending',
        appliedPromoCode: appliedPromo ? appliedPromo.code : undefined,
        telegramId,
        telegramUsername
      };

      // Create natively inside Local storage
      await createOrder(newOrder);
      
      setCreatedOrder(newOrder);
      triggerHaptic('success', 'RÉSERVATION ENREGISTRÉE');
      
      onCheckoutSuccess(paymentMethod, finalTotalToPay, cart.map(item => item.product.title));
      onClearCart(); // Empty bag upon confirmation
      setStep('success');
    } catch (e: any) {
      console.error('Order creation failed', e);
      setValidationError(e.message || 'Une erreur de validation est survenue.');
      triggerHaptic('error');
    }
  };

  const copyReceiptToClipboard = async () => {
    if (!createdOrder) return;
    const articlesFormatted = createdOrder.items.map(i => {
      const qtyStr = i.quantity > 1 ? `${i.quantity}x ` : '';
      const sizeStr = i.selectedSize ? ` (${i.selectedSize})` : '';
      return `${qtyStr}${i.title}${sizeStr}`;
    }).join(', ');

    const txt = `🏔️ SHELF TERPS — ${t('orderSuccessTitle')} ${createdOrder.id} 🏔️\n` +
                `Client : ${createdOrder.customerName}\n` +
                `Articles : ${articlesFormatted}\n` +
                `Total : ${createdOrder.totalAmount} €\n` +
                `Livrable à : ${createdOrder.address}, ${createdOrder.city}\n` +
                `Liaison sécurisée SHELF TERPS.`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(txt);
        setCopied(true);
        triggerHaptic('success');
        setTimeout(() => setCopied(false), 3000);
      }
    } catch {
      // ignore
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center md:p-4 animate-fade-in"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 220 }}
        className="w-full max-w-lg bg-gradient-to-br from-[#0a0a0a] to-black text-white md:rounded-3xl border-t md:border border-white/10 overflow-hidden flex flex-col max-h-[92vh] relative shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* DRAG HANDLE FOR MOBILE */}
        <div className="md:hidden w-12 h-1 bg-neutral-900 rounded-full mx-auto mt-3 mb-1 shrink-0" />

        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-white/5 p-5 shrink-0 bg-[#0a0a0a]">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-orange-400" />
            <span className="font-mono text-xs tracking-widest text-orange-400 uppercase font-bold">
              {t('yourCart')} ({cart.length})
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 px-1.5 rounded-lg border border-white/5 text-[#F5F5F5] hover:text-orange-400 bg-white/5 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* INTERACTION AND FORMS SCROLL */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-none bg-gradient-to-b from-[#080808] to-black">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: RESUME LIST */}
            {step === 'list' && (
              <motion.div
                key="list-step"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-5"
              >
                {!hasItems ? (
                  <div className="py-20 text-center space-y-5 border border-dashed border-white/10 rounded-2xl bg-black/40">
                    <ShoppingBag className="w-10 h-10 text-orange-400/30 mx-auto animate-pulse" />
                    <p className="font-mono text-xs italic text-neutral-500 max-w-xs mx-auto leading-relaxed">
                      {t('emptyCartDesc')}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[40vh] overflow-y-auto scrollbar-none pr-1">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-xl bg-black/60 border border-white/5 flex items-center justify-between gap-3 shadow-md hover:border-orange-500/50 duration-200"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          {item.product.thumbnailUrl && item.product.thumbnailUrl.trim() !== '' ? (
                            <img
                              src={item.product.thumbnailUrl || undefined}
                              alt={item.product.title}
                              className="w-12 h-15 rounded-lg object-contain bg-transparent flex-shrink-0 border border-white/5"
                            />
                          ) : null}
                          <div className="min-w-0">
                            <h4 className="font-mono text-xs font-semibold text-neutral-200 truncate uppercase tracking-widest">
                              {item.product.title}
                            </h4>
                            {(item.product.category || '').toLowerCase().includes('accessoire') ? (
                              <span className="text-[10px] font-mono text-neutral-400 block mt-1">
                                Quantité : <b className="text-orange-400 font-bold">
                                  {(() => {
                                    const sizeMatches = item.selectedSize.match(/(\d+)/);
                                    const baseUnits = sizeMatches ? parseInt(sizeMatches[1], 10) : 1;
                                    const totalUnitsNum = baseUnits * item.quantity;
                                    return `${totalUnitsNum} ${totalUnitsNum > 1 ? 'unités' : 'unité'}`;
                                  })()}
                                </b>
                              </span>
                            ) : (
                              <>
                                <span className="text-[10px] font-mono text-neutral-400 block mt-1">
                                  Poids : <b className="text-orange-400 font-bold">{item.selectedSize}</b>
                                </span>
                                <span className="text-[10px] text-neutral-500 font-mono mt-0.5 block">
                                  Quantité : {item.quantity}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-mono text-xs font-medium text-orange-400">
                            {item.totalPrice} €
                          </span>
                          <button
                            onClick={() => {
                              triggerHaptic('medium');
                              onRemoveItem(item.id);
                            }}
                            className="p-2 rounded-lg bg-red-950/30 text-red-400 hover:bg-neutral-900 hover:text-red-300 border border-red-900/40 cursor-pointer transition duration-300"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* COTATION SUMMARY */}
                {hasItems && (
                  <div className="p-4 rounded-xl bg-[#1E1E1E]/60 border border-white/5 space-y-2 font-mono shadow-inner">
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-white/5 text-neutral-350">
                      <span>Expédition :</span>
                      <span className="text-orange-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-orange-400" />
                        <span>Offerte / Discrétion Assurée</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-neutral-400 font-semibold">{t('subtotal')} :</span>
                      <span className="text-orange-400 font-bold text-base">{pricingTotal} €</span>
                    </div>
                  </div>
                )}

                {hasItems && (
                  <button
                    onClick={handleProceedToCheckout}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-black hover:opacity-90 font-extrabold text-[10.5px] tracking-[0.2em] uppercase transition duration-300 shadow-xl cursor-pointer"
                  >
                    {t('checkoutBtn')} ({pricingTotal} €)
                  </button>
                )}
              </motion.div>
            )}

            {/* STEP 2: PREMIUM CHECKOUT FORM */}
            {step === 'checkout' && (
              <motion.div
                key="checkout-step"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <div className="text-center pb-1">
                  <h4 className="font-mono text-xs tracking-widest text-orange-400 uppercase font-bold">{t('checkoutTitle')}</h4>
                  <p className="text-[9px] text-orange-400/80 font-mono uppercase tracking-widest mt-1">SHELF TERPS — Liaison Sécurisée 0-Log</p>
                </div>

                {validationError && (
                  <div className="p-3 rounded-xl bg-red-950/20 border border-red-900 text-red-500 text-[10.5px] font-mono text-center">
                    {validationError}
                  </div>
                )}

                <div className="space-y-3 font-mono">
                  {/* Full Name */}
                  <div className="space-y-1">
                    <label className="text-[9px] text-neutral-400 uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                      <User className="w-3.5 h-3.5 text-orange-400" />
                      <span>{t('nameLabel')} *</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Nom / Alias"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[#1E1E1E]/80 border border-white/10 text-xs text-white placeholder-neutral-450 focus:outline-none focus:border-orange-500/50"
                    />
                  </div>

                  {/* Phone number */}
                  <div className="space-y-1">
                    <label className="text-[9px] text-neutral-400 uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                      <Phone className="w-3.5 h-3.5 text-orange-400" />
                      <span>{t('phoneLabel')} *</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="Ex: 06 12 34 56 78"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[#1E1E1E]/80 border border-white/10 text-xs text-white placeholder-neutral-450 focus:outline-none focus:border-orange-500/50"
                    />
                  </div>

                  {/* Cities Select */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] text-neutral-400 uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                        <MapPin className="w-3.5 h-3.5 text-orange-400" />
                        <span>{t('cityLabel')} *</span>
                      </label>
                      <select
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-black border border-white/10 text-xs cursor-pointer text-white focus:outline-none focus:border-orange-500/50"
                      >
                        {MOROCCAN_CITIES.map((city) => (
                          <option key={city} value={city} className="bg-black text-white">
                            {city}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] text-neutral-400 uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                        <span>{t('zipLabel')}</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: 20000"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-[#1E1E1E]/80 border border-white/10 text-xs text-white placeholder-neutral-450 focus:outline-none focus:border-orange-500/50"
                      />
                    </div>
                  </div>

                  {/* Delivery Address */}
                  <div className="space-y-1">
                    <label className="text-[9px] text-neutral-400 uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                      <Truck className="w-3.5 h-3.5 text-orange-400" />
                      <span>{t('addressLabel')} *</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Point de rendez-vous ou adresse discrète..."
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[#1E1E1E]/80 border border-white/10 text-xs text-white placeholder-neutral-450 focus:outline-none focus:border-orange-500/50"
                    />
                  </div>

                  {/* PAYMENT METHOD SELECTOR */}
                  <div className="space-y-2 pt-1">
                    <span className="block text-[9px] text-neutral-500 uppercase tracking-widest font-semibold">
                      {t('paymentMethodLabel')} :
                    </span>
                    
                    <div className="grid grid-cols-2 gap-2.5">
                      {/* Cash on delivery */}
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          setPaymentMethod('cod');
                        }}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all duration-300 bg-black/80 ${paymentMethod === 'cod' ? 'border-orange-500 bg-orange-500/10 text-orange-400' : 'border-white/5 hover:border-orange-500/50 text-neutral-300'}`}
                      >
                        <h5 className="text-[10px] font-bold uppercase tracking-wider text-white">Espèces (COD)</h5>
                        <p className="text-[7.5px] text-neutral-500 mt-0.5 leading-normal">Paiement anonyme à la livraison</p>
                      </button>

                      {/* Card simulation */}
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          setPaymentMethod('card');
                        }}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all duration-300 bg-black/80 ${paymentMethod === 'card' ? 'border-orange-500 bg-orange-500/10 text-orange-400' : 'border-white/5 hover:border-orange-500/50 text-neutral-300'}`}
                      >
                        <h5 className="text-[10px] font-bold uppercase tracking-wider text-white">Carte Cryptée</h5>
                        <p className="text-[7.5px] text-neutral-500 mt-0.5 leading-normal">Paiement SSL 0-Log</p>
                      </button>
                    </div>
                  </div>

                  {/* Credit Card sandbox form inputs */}
                  {paymentMethod === 'card' && (
                    <div className="p-3.5 rounded-xl bg-black/60 border border-white/5 space-y-3.5 animate-fadeIn">
                      <div className="flex justify-between items-center text-[8px] tracking-widest text-orange-400 font-extrabold uppercase">
                        <span>💳 passerelle de paiement cryptée active</span>
                        <span>ANONYME</span>
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-[8px] uppercase tracking-wider font-extrabold text-orange-400">Numéro de carte</label>
                        <input
                          type="text"
                          placeholder="4532 •••• •••• ••••"
                          maxLength={19}
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="w-full p-2 bg-[#1E1E1E] border border-white/10 rounded-lg text-xs font-mono outline-none text-orange-400 focus:border-orange-500/50"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label className="text-[8px] uppercase tracking-wider font-extrabold text-neutral-400">Expiration (MM/AA)</label>
                          <input
                            type="text"
                            placeholder="12/28"
                            maxLength={5}
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            className="w-full p-2 bg-[#1E1E1E] border border-white/10 rounded-lg text-xs font-mono outline-none text-orange-400 focus:border-orange-500/50"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[8px] uppercase tracking-wider font-extrabold text-neutral-400">CVV (Cryptogramme)</label>
                          <input
                            type="password"
                            placeholder="•••"
                            maxLength={3}
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                            className="w-full p-2 bg-[#1E1E1E] border border-white/10 rounded-lg text-xs font-mono outline-none text-orange-400 focus:border-orange-500/50"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* PROMO CODE BOX */}
                <div className="bg-black/60 border border-white/5 rounded-xl p-3.5 space-y-2.5 font-mono">
                  <span className="block text-[8.5px] uppercase tracking-wider font-extrabold text-orange-400">🎟️ CODE DE RÉDUCTION DISCRET</span>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="CODE PROMO"
                      value={promoCodeInput}
                      onChange={(e) => setPromoCodeInput(e.target.value)}
                      className="flex-1 p-2 bg-black border border-white/10 rounded-lg text-[10px] font-mono outline-none text-orange-400 focus:border-orange-500/50 placeholder-zinc-600 uppercase tracking-widest text-center"
                      disabled={isApplyingPromo}
                    />
                    <button
                      type="button"
                      onClick={handleApplyPromoCode}
                      disabled={isApplyingPromo || !promoCodeInput.trim()}
                      className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-orange-500 text-zinc-300 hover:text-orange-400 font-bold text-[8.5px] uppercase tracking-wider rounded-lg transition-all cursor-pointer disabled:opacity-35"
                    >
                      {isApplyingPromo ? '...' : 'APPLIQUER'}
                    </button>
                  </div>

                  {promoMessage && (
                    <div className={`text-[8px] uppercase font-bold text-center tracking-wider px-2 py-1.5 rounded ${promoMessage.isError ? 'bg-red-950/25 text-red-400 border border-red-500/10' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'}`}>
                      {promoMessage.text}
                    </div>
                  )}
                </div>

                {/* COTATION CARD */}
                <div className="p-3.5 bg-black/60 border border-white/5 rounded-xl space-y-2 text-[10px] font-mono">
                  <div className="flex justify-between items-center text-neutral-400">
                    <span>{t('subtotal')} :</span>
                    <span>{pricingTotal} €</span>
                  </div>
                  {appliedPromo && (
                    <div className="flex justify-between items-center text-emerald-450 font-semibold bg-emerald-950/10 p-1.5 rounded border border-emerald-500/10">
                      <span>🎟️ CODE PROMO ({appliedPromo.code}) :</span>
                      <span>-{discountAmount} €</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-xs font-bold pt-1.5 border-t border-white/5 text-white">
                    <span>{t('total')} :</span>
                    <span className="text-orange-400 text-sm font-black">{finalTotalToPay} €</span>
                  </div>
                </div>

                {/* Touch submission panel */}
                <div className="space-y-2 pt-1 font-mono">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('heavy');
                      submitOrder();
                    }}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-black font-extrabold text-[10.5px] tracking-[0.2em] uppercase transition duration-300 shadow-xl flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    id="submit_secured_order_btn"
                  >
                    <span>✦</span>
                    <span>{t('confirmOrderBtn')}</span>
                    <span>✦</span>
                  </button>
                </div>

                <div className="flex gap-2 font-mono">
                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      setStep('list');
                    }}
                    className="flex-1 py-3 rounded-lg border border-white/5 text-[9.5px] text-neutral-300 hover:text-orange-400 bg-white/5 uppercase text-center cursor-pointer transition"
                  >
                    Retour au panier
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: ORDER SUCCESS DISPLAY */}
            {step === 'success' && createdOrder && (
              <motion.div
                key="success-step"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center p-3 space-y-5 font-mono"
              >
                <div className="w-16 h-16 bg-black border border-orange-500 rounded-full flex items-center justify-center mx-auto text-orange-400 shadow-lg">
                  <CheckCircle2 className="w-8 h-8 text-orange-400" />
                </div>

                <div className="space-y-1">
                  <h4 className="font-mono text-base font-bold text-white uppercase tracking-widest">{t('orderSuccessTitle')} 🏔️</h4>
                  <p className="text-[9px] text-orange-400 uppercase tracking-widest">{t('orderSuccessMsg')}</p>
                </div>

                {/* Refined Receipt Box */}
                <div className="p-5 rounded-2xl bg-black/60 border border-white/5 text-left text-xs leading-relaxed space-y-2.5 relative font-mono shadow-xl">
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <span className="font-bold text-orange-400">{createdOrder.id}</span>
                    <span className="text-[8px] text-neutral-400 uppercase tracking-wider">SHELF TERPS PRIVATE RESERVE</span>
                  </div>

                  <div className="text-neutral-300 text-[10.5px]">{t('nameLabel')} : <span className="text-white font-semibold uppercase">{createdOrder.customerName}</span></div>
                  <div className="text-neutral-300 text-[10.5px]">{t('phoneLabel')} : <span className="text-white">{createdOrder.phoneNumber}</span></div>
                  <div className="text-neutral-300 text-[10.5px]">{t('addressLabel')} : <span className="text-white">{createdOrder.address}, {createdOrder.city}</span></div>
                  <div className="text-neutral-300 text-[10.5px]">{t('paymentMethodLabel')} : <span className="text-orange-400 uppercase font-bold text-[9px]">
                    {createdOrder.paymentMethod === 'cod' ? '💵 Espèces (COD)' : '💳 Transaction chiffrée SSL'}
                  </span></div>

                  <div className="border-t border-white/5 pt-2 space-y-1">
                    <div className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider mb-1">Articles commandés :</div>
                    {createdOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[10.5px] text-neutral-200">
                        <span>
                          • {item.quantity > 1 ? <b className="text-orange-400">{item.quantity}x </b> : ''}
                          {item.title} {item.selectedSize ? <span className="text-orange-400 font-bold">({item.selectedSize})</span> : ''}
                        </span>
                        <span className="font-bold text-white">{item.price} €</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t border-white/5 mt-3 pt-2.5 flex justify-between text-sm">
                    <span className="text-neutral-300 uppercase">{t('total')} :</span>
                    <span className="font-bold text-orange-400">{createdOrder.totalAmount} €</span>
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="p-4 rounded-xl bg-black/50 border border-white/5 space-y-3 shadow-md">
                  <div className="space-y-2 pt-1 font-mono">
                    <button
                      onClick={async () => {
                        triggerHaptic('heavy');
                        const articlesFormatted = createdOrder.items.map(i => {
                          const qtyStr = i.quantity > 1 ? `${i.quantity}x ` : '';
                          const sizeStr = i.selectedSize ? ` (${i.selectedSize})` : '';
                          return `${qtyStr}${i.title}${sizeStr}`;
                        }).join(', ');

                        const txt = `🏔️ SHELF TERPS — ${t('orderSuccessTitle')} ${createdOrder.id} 🏔️\n` +
                                    `Client : ${createdOrder.customerName}\n` +
                                    `Articles : ${articlesFormatted}\n` +
                                    `Total : ${createdOrder.totalAmount} €\n` +
                                    `Livrable à : ${createdOrder.address}, ${createdOrder.city}\n` +
                                    `SHELF TERPS @yoru47.`;
                        
                        try {
                           if (navigator.clipboard) {
                             await navigator.clipboard.writeText(txt);
                           }
                        } catch (err) {}

                        const messageText = encodeURIComponent(txt);
                        const tgUrl = `https://t.me/yoru47?text=${messageText}`;
                        const tg = (window as any).Telegram?.WebApp;
                        if (tg && typeof tg.openTelegramLink === 'function') {
                          tg.openTelegramLink(tgUrl);
                        } else {
                          window.open(tgUrl, '_blank', 'noreferrer,noopener');
                        }
                      }}
                      className="w-full py-3 px-4 rounded-xl bg-[#0088cc] hover:bg-[#0077b3] text-white text-[10.5px] uppercase font-mono font-black tracking-wider transition duration-300 shadow-lg flex items-center justify-center gap-2 border border-[#0088cc] cursor-pointer"
                    >
                      <Send className="w-4 h-4 text-white" />
                      <span>{t('sendTicketTelegram')}</span>
                    </button>

                    <div className="grid grid-cols-2 gap-2 font-mono">
                      <button
                        onClick={copyReceiptToClipboard}
                        className={`py-2 px-3 rounded-lg border text-[9px] uppercase font-bold flex items-center justify-center gap-1.5 transition duration-300 cursor-pointer ${copied ? 'border-emerald-500 bg-emerald-950/20 text-emerald-400' : 'border-white/5 text-neutral-300 hover:text-orange-400 hover:border-orange-500/50 bg-black/60'}`}
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Ticket Copié !' : 'Copier Récap'}</span>
                      </button>

                      <button
                        onClick={() => {
                          triggerHaptic('success');
                          onClose();
                        }}
                        className="py-2 px-3 rounded-lg border border-white/5 bg-black/40 text-neutral-300 hover:text-white text-[9px] uppercase font-bold cursor-pointer transition duration-300"
                      >
                        Fermer
                      </button>
                    </div>
                  </div>
                </div>

              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

