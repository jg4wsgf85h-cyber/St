import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Award, Calendar, ShoppingBag, Globe, ShieldCheck, ChevronRight, Lock, KeyRound, ExternalLink, RefreshCw } from 'lucide-react';
import { UserProfile, Order, VIP_LEVELS } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

interface ProfileViewProps {
  tgUser: any;
  userProfile: UserProfile | null;
  userOrders: Order[];
  triggerHaptic: (style: 'light' | 'medium' | 'heavy') => void;
  showToast: (msg: string) => void;
  onRefreshOrders?: () => void;
}

export default function ProfileView({
  tgUser,
  userProfile,
  userOrders,
  triggerHaptic,
  showToast,
  onRefreshOrders
}: ProfileViewProps) {
  const { language, setLanguage, t } = useLanguage();
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);

  // User Stats
  const firstName = tgUser?.first_name || userProfile?.pseudo || 'Membre BISCOTTI BOYS FARMZ';
  const username = tgUser?.username ? `@${tgUser.username}` : '@non_specifie';
  const telegramId = tgUser?.id ? String(tgUser.id) : (userProfile?.telegramId || '77812901');
  const dateJoined = userProfile?.dateJoined || '2026-07-28';
  const totalOrders = userProfile?.totalOrders || userOrders.filter((o) => o.status === 'completed').length;
  const points = userProfile?.points || 0;
  const vipLevelName = userProfile?.level || 'Member';

  // Configured VIP levels
  const currentLevelConfig = VIP_LEVELS.find((l) => l.name === vipLevelName) || VIP_LEVELS[0];

  // Language options
  const languages = [
    { code: 'DE', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'FR', label: 'Français', flag: '🇫🇷' },
    { code: 'EN', label: 'English', flag: '🇬🇧' },
    { code: 'ES', label: 'Español', flag: '🇪🇸' },
  ] as const;

  return (
    <div className="space-y-6 pb-24 pt-2 px-4 max-w-2xl mx-auto" id="profile-view">
      {/* 1. HEADER PROFILE CARD */}
      <div className="p-6 rounded-3xl bg-gradient-to-b from-neutral-900 via-black to-black border border-orange-500/30 shadow-[0_0_25px_rgba(255,107,0,0.15)] relative overflow-hidden space-y-4">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 border-2 border-orange-500 shadow-[0_0_15px_rgba(255,107,0,0.4)] flex items-center justify-center text-black font-black text-xl uppercase">
              {firstName.substring(0, 2)}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-black rounded-full p-0.5 border border-orange-500">
              <span className="text-xs">{currentLevelConfig.icon}</span>
            </div>
          </div>

          <div className="space-y-1 flex-1">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-white truncate max-w-[180px]">
                {firstName}
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full bg-gradient-to-r ${currentLevelConfig.badgeClass} text-[10px] font-mono font-extrabold uppercase border`}>
                VIP {vipLevelName}
              </span>
            </div>
            <p className="text-xs font-mono text-orange-400">
              {username}
            </p>
            <p className="text-[10px] font-mono text-neutral-500">
              {t('telegramIdLabel')} : <span className="text-neutral-300 font-bold">{telegramId}</span>
            </p>
          </div>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-2 border-t border-white/10 text-center font-mono">
          <div className="p-2.5 rounded-2xl bg-neutral-900/80 border border-white/5 space-y-0.5">
            <Calendar className="w-3.5 h-3.5 text-neutral-400 mx-auto" />
            <span className="text-[9px] text-neutral-500 uppercase block">{t('registrationDate')}</span>
            <span className="text-xs font-bold text-white">{dateJoined}</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-neutral-900/80 border border-white/5 space-y-0.5">
            <ShoppingBag className="w-3.5 h-3.5 text-orange-400 mx-auto" />
            <span className="text-[9px] text-neutral-500 uppercase block">{t('ordersCount')}</span>
            <span className="text-xs font-extrabold text-white">{totalOrders} {t('deliveredOrders')}</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-neutral-900/80 border border-white/5 space-y-0.5">
            <Award className="w-3.5 h-3.5 text-amber-400 mx-auto" />
            <span className="text-[9px] text-neutral-500 uppercase block">{t('vipLevelLabel')}</span>
            <span className="text-xs font-extrabold text-amber-300">{vipLevelName}</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-neutral-900/80 border border-white/5 space-y-0.5">
            <span className="text-xs">⚡</span>
            <span className="text-[9px] text-neutral-500 uppercase block">{t('loyaltyPoints')}</span>
            <span className="text-xs font-extrabold text-orange-400">{points} PTS</span>
          </div>
        </div>
      </div>

      {/* 2. CHOIX DE LANGUE (LANGUAGE SELECTOR) */}
      <div className="p-4 rounded-3xl bg-neutral-900/60 border border-white/10 space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-mono font-extrabold uppercase tracking-wider text-orange-400">
          <Globe className="w-4 h-4 text-orange-500" />
          <span>{t('chooseLanguage')}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {languages.map((lang) => {
            const isActive = language === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => {
                  triggerHaptic('light');
                  setLanguage(lang.code);
                  showToast(`${t('languageChangedToast')} ${lang.label}`);
                }}
                className={`py-2 px-3 rounded-2xl font-mono text-xs font-extrabold flex items-center justify-center gap-2 transition cursor-pointer border ${
                  isActive
                    ? 'bg-orange-500 text-black border-orange-400 shadow-[0_0_10px_rgba(255,107,0,0.3)]'
                    : 'bg-neutral-800 text-neutral-400 border-white/5 hover:text-white'
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. HISTORIQUE DES COMMANDES (ORDER HISTORY) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono font-extrabold tracking-widest text-orange-400 uppercase flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-orange-500" />
            <span>{t('orderHistory')}</span>
          </h3>

          {onRefreshOrders && (
            <button
              onClick={() => {
                triggerHaptic('light');
                onRefreshOrders();
              }}
              className="text-[10px] font-mono text-neutral-400 hover:text-white flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>{t('refreshOrders')}</span>
            </button>
          )}
        </div>

        {userOrders.length === 0 ? (
          <div className="p-6 rounded-2xl bg-neutral-900/30 border border-white/5 text-center space-y-2">
            <p className="text-xs font-mono text-neutral-400">
              {t('noOrdersYet')}
            </p>
            <p className="text-[10px] font-sans text-neutral-500">
              {t('noOrdersDesc')}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {userOrders.map((ord) => {
              const isCompleted = ord.status === 'completed';
              const isCancelled = ord.status === 'cancelled';

              return (
                <div
                  key={ord.id}
                  onClick={() => setSelectedOrderDetails(ord)}
                  className="p-4 rounded-2xl bg-neutral-900/60 border border-white/10 hover:border-orange-500/40 transition cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-white block">
                        N° {ord.id}
                      </span>
                      <span className="text-[9.5px] font-mono text-neutral-500">
                        {ord.date ? new Date(ord.date).toLocaleDateString('fr-FR') : 'Récemment'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-extrabold text-orange-400 block">
                        {ord.totalAmount} €
                      </span>
                      <span
                        className={`text-[8.5px] font-mono font-black uppercase px-2 py-0.5 rounded-full border ${
                          isCompleted
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : isCancelled
                            ? 'bg-red-500/10 text-red-400 border-red-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                        }`}
                      >
                        {isCompleted ? `${t('statusCompleted')} 🟢` : isCancelled ? `${t('statusCancelled')} 🔴` : `${t('statusPending')} 🟡`}
                      </span>
                    </div>
                  </div>

                  <div className="text-[10px] font-mono text-neutral-400 border-t border-white/5 pt-1.5 flex items-center justify-between">
                    <span>{ord.items?.length || 1} {t('itemsCount')} • {ord.city || 'Express'}</span>
                    <span className="text-orange-400 font-bold flex items-center gap-1">
                      {t('viewDetails')} <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ORDER DETAILS MODAL */}
      <AnimatePresence>
        {selectedOrderDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-neutral-900 border border-orange-500/40 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <span className="text-xs font-mono text-orange-400 block font-bold">{t('orderDetailsModal')}</span>
                  <h3 className="text-sm font-extrabold text-white">N° {selectedOrderDetails.id}</h3>
                </div>
                <button
                  onClick={() => setSelectedOrderDetails(null)}
                  className="text-neutral-400 hover:text-white font-mono text-xs"
                >
                  {t('close')}
                </button>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="p-3 rounded-2xl bg-black/60 border border-white/5 space-y-1">
                  <span className="text-neutral-400 block uppercase text-[9px]">{t('itemsCount')}</span>
                  {(selectedOrderDetails.items || []).map((item, idx) => (
                    <div key={idx} className="flex justify-between text-white py-0.5">
                      <span>{item.quantity > 1 ? `${item.quantity}x ` : ''}{item.title} ({item.selectedSize})</span>
                      <span className="text-orange-400 font-bold">{item.price} €</span>
                    </div>
                  ))}
                </div>

                <div className="p-3 rounded-2xl bg-black/60 border border-white/5 space-y-1">
                  <div className="flex justify-between text-neutral-400">
                    <span>Destinataire :</span>
                    <span className="text-white font-bold">{selectedOrderDetails.customerName}</span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Téléphone :</span>
                    <span className="text-white">{selectedOrderDetails.phoneNumber}</span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Ville / Adresse :</span>
                    <span className="text-white">{selectedOrderDetails.city}, {selectedOrderDetails.address}</span>
                  </div>
                  <div className="flex justify-between text-neutral-400 pt-1 border-t border-white/5">
                    <span>{t('totalToPay')} :</span>
                    <span className="text-orange-400 font-extrabold text-sm">{selectedOrderDetails.totalAmount} €</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="w-full py-3 rounded-2xl bg-orange-500 text-black font-extrabold text-xs uppercase"
              >
                {t('close')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

