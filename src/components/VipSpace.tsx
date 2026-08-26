/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Sparkles, 
  User, 
  Award, 
  Calendar, 
  ShoppingBag, 
  Coins, 
  TrendingUp, 
  CheckCircle2, 
  Lock, 
  Copy, 
  Check, 
  ChevronRight, 
  QrCode, 
  Flame,
  Smartphone,
  ShieldAlert,
  Edit2
} from 'lucide-react';
import { Order, Reward, VIP_LEVELS, VipLevelConfig } from '../types';
import { getUserProfile, saveUserProfile, getUserOrders, getRewards } from '../db';

interface VipSpaceProps {
  telegramId: string;
  telegramUsername: string;
  onClose: () => void;
  triggerHaptic: (style: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error', customMessage?: string) => void;
  onProfileUpdate?: (profile: any) => void;
}

interface UserProfile {
  id: string;
  telegramId: string;
  telegramUsername: string;
  pseudo: string;
  dateJoined: string;
  points: number;
  level: 'Member' | 'Silver' | 'Gold' | 'Elite' | string;
  totalOrders: number;
  totalSpent: number;
  unlockedRewards: string[];
}

export default function VipSpace({
  telegramId,
  telegramUsername,
  onClose,
  triggerHaptic,
  onProfileUpdate
}: VipSpaceProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [rewardsList, setRewardsList] = useState<Reward[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isEditingPseudo, setIsEditingPseudo] = useState<boolean>(false);
  const [newPseudo, setNewPseudo] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<string>('');
  const [showLevelUpAlert, setShowLevelUpAlert] = useState<boolean>(false);
  const [previousLevel, setPreviousLevel] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState<number>(0);

  // Load user profile, user orders, and administrative rewards on mount
  useEffect(() => {
    let active = true;

    async function fetchData() {
      try {
        setLoading(true);
        setErrorMsg(null);

        // Fetch user data in parallel with catch handlers to fail gracefully per-request
        const [uProfile, uOrders, uRewards] = await Promise.all([
          getUserProfile(telegramId).catch((err) => {
            console.error('[VIP DB fallback] Profile fetch failed:', err);
            return null;
          }),
          getUserOrders(telegramId).catch((err) => {
            console.error('[VIP DB fallback] Orders fetch failed:', err);
            return [];
          }),
          getRewards().catch((err) => {
            console.error('[VIP DB fallback] Rewards fetch failed:', err);
            return [];
          })
        ]);

        if (!active) return;

        // Perfect client-side fallback if profile query yields null or is empty
        let finalProfile = uProfile;
        if (!finalProfile) {
          console.warn('[VIP PORTAL] Server-side profile missing, generating client fallback.');
          const validOrders = (uOrders || []).filter((o: any) => o.status === 'completed');
          const totalOrders = validOrders.length;
          const totalSpent = validOrders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
          const points = Math.round(totalSpent);

          let level = 'Member';
          if (totalOrders >= 30 || points >= 30000) {
            level = 'Elite';
          } else if (totalOrders >= 20 || points >= 20000) {
            level = 'Gold';
          } else if (totalOrders >= 10 || points >= 10000) {
            level = 'Silver';
          }

          finalProfile = {
            id: telegramId,
            telegramId,
            telegramUsername: telegramUsername || 'guest',
            pseudo: telegramUsername ? `@${telegramUsername}` : `LuxMember_${telegramId.substring(0, 5)}`,
            dateJoined: new Date().toISOString().split('T')[0],
            unlockedRewards: [],
            totalOrders,
            totalSpent,
            points,
            level
          };
        }

        setProfile(finalProfile);
        setOrders(uOrders || []);
        setNewPseudo(finalProfile?.pseudo || '');
        setRewardsList(uRewards || []);

        if (finalProfile) {
          onProfileUpdate?.(finalProfile);
        }

        // Check for automatic level-up animation & notification
        if (finalProfile && finalProfile.level) {
          const storedPrevLevel = localStorage.getItem(`north47_prev_level_${telegramId}`);
          if (storedPrevLevel && storedPrevLevel !== finalProfile.level) {
            setPreviousLevel(storedPrevLevel);
            setShowLevelUpAlert(true);
            triggerHaptic('success', `NOUVEAU RANG MAJEUR DÉBLOQUÉ: ${finalProfile.level}!`);
          }
          localStorage.setItem(`north47_prev_level_${telegramId}`, finalProfile.level);
        }

      } catch (err) {
        console.error('Failed to load VIP space details:', err);
        setErrorMsg('Erreur de connexion. Affichage du profil restreint.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchData();

    // High reliability backup timer to make sure loader can NEVER spin forever (max 5.5s wait)
    const backupTimer = setTimeout(() => {
      if (active) {
        setLoading((prev) => {
          if (prev) {
            console.warn('[VIP PORTAL] Client timeout triggered. Ending load spinner.');
            setErrorMsg('Délai d\'interrogation dépassé. Restauration locale... (Veuillez actualiser ou ré-essayer)');
          }
          return false;
        });
      }
    }, 5500);

    return () => {
      active = false;
      clearTimeout(backupTimer);
    };
  }, [telegramId, reloadTick]);

  const handleUpdatePseudo = async () => {
    if (!profile || !newPseudo.trim()) return;
    try {
      triggerHaptic('medium', 'Pseudo Mis à Jour');
      const updated = { ...profile, pseudo: newPseudo.trim(), telegramUsername };
      await saveUserProfile(telegramId, updated);
      setProfile(prev => prev ? { ...prev, pseudo: newPseudo.trim() } : null);
      setIsEditingPseudo(false);
      onProfileUpdate?.({ ...profile, pseudo: newPseudo.trim() });
    } catch (err) {
      console.error('Failed to update pseudo:', err);
      triggerHaptic('error');
    }
  };

  const copyToClipboard = (text: string, codeId: string) => {
    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
        setCopiedCode(codeId);
        triggerHaptic('success', 'Code Copié!');
        setTimeout(() => setCopiedCode(''), 3000);
      }
    } catch (e) {
      // ignore
    }
  };

  // Compute loyalty rank conditions
  const getNextRankInfo = (currentLevel: string) => {
    const currentIndex = VIP_LEVELS.findIndex(cl => cl.name.toLowerCase() === (currentLevel || 'Member').toLowerCase());
    if (currentIndex === -1 || currentIndex >= VIP_LEVELS.length - 1) {
      return null;
    }
    const nextRank = VIP_LEVELS[currentIndex + 1];
    return {
      next: nextRank.name,
      target: nextRank.minOrders,
      current: profile?.totalOrders || 0,
      desc: `${nextRank.minOrders} commandes d'exception`
    };
  };

  const rankInfo = profile ? getNextRankInfo(profile.level) : null;
  const progressPercent = rankInfo 
    ? Math.min(100, Math.round((rankInfo.current / rankInfo.target) * 100))
    : 100;

  // Dynamically mapped rewards from database
  const computedRewards = useMemo(() => {
    if (!profile) return [];
    // filter only active administrative rewards
    const active = rewardsList.filter(r => r.isActive);
    return active.map(reward => ({
      id: reward.id,
      title: reward.title,
      requirement: `Déblocage à ${reward.minOrders} commande${reward.minOrders > 1 ? 's' : ''}`,
      rewardText: reward.description,
      unlocked: (profile.totalOrders || 0) >= reward.minOrders,
      promoCode: reward.promoCode || 'RÉCOMPENSE',
      minOrders: reward.minOrders
    })).sort((a, b) => a.minOrders - b.minOrders);
  }, [profile, rewardsList]);

  const REWARDS = computedRewards;

  const getRankBadgeClass = (lvl: string) => {
    const cfg = VIP_LEVELS.find(cl => cl.name.toLowerCase() === (lvl || 'Member').toLowerCase());
    return cfg ? cfg.badgeClass : 'from-orange-950/40 to-red-950/50 border-amber-700/60 text-amber-500';
  };

  const getRankIcon = (lvl: string) => {
    const cfg = VIP_LEVELS.find(cl => cl.name.toLowerCase() === (lvl || 'Member').toLowerCase());
    return cfg ? cfg.icon : '🥉';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-4 overflow-y-auto"
      onClick={onClose}
    >
      {/* LEVEL UP EXTRAVAGANT ALERT OVERLAY */}
      <AnimatePresence>
        {showLevelUpAlert && profile && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-55 flex flex-col items-center justify-center bg-black/95 px-6 text-center select-none"
            onClick={(e) => { e.stopPropagation(); setShowLevelUpAlert(false); }}
          >
            <div className="absolute inset-0 bg-radial from-amber-500/10 via-transparent to-transparent pointer-events-none" />
            
            <motion.div 
              animate={{ rotate: [0, 360] }}
              transition={{ repeat: Infinity, duration: 15, ease: 'linear' }}
              className="text-7xl mb-6 filter drop-shadow-[0_0_25px_rgba(212,175,55,0.7)]"
            >
              ⚜️
            </motion.div>

            <h3 className="font-display text-4xl text-white tracking-[0.2em] uppercase font-black">
              RANG SUPÉRIEUR !
            </h3>
            
            <p className="text-[#D4AF37] font-mono text-[10px] uppercase tracking-widest mt-2">
              Changement de statut protocolaire accompli
            </p>

            <div className="my-10 p-8 rounded-3xl bg-neutral-900 border border-[#D4AF37]/45 max-w-sm w-full shadow-2xl relative">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#D4AF37] text-black font-extrabold text-[12px] px-5 py-1 rounded-full uppercase tracking-widest">
                {profile.level}
              </div>
              <p className="text-zinc-400 text-xs leading-relaxed font-sans mt-2">
                Votre loyauté active sur DRYTECH vient de vous propulser au rang suprême de <strong className="text-white uppercase">{profile.level}</strong>. De nouveaux privilèges sont désormais gravés sur votre carte d'accès VIP.
              </p>
            </div>

            <button 
              onClick={() => setShowLevelUpAlert(false)}
              className="px-8 py-3 bg-[#D4AF37] text-black font-black font-mono text-[10px] uppercase tracking-wider rounded-xl hover:bg-white transition"
            >
              AFFICHER MA CARTE MÉTAL VIP
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
        className="w-full max-w-lg bg-gradient-to-br from-[#1E1E1E] to-[#121212] text-white rounded-t-3xl md:rounded-3xl border-t md:border border-white/10 overflow-hidden flex flex-col max-h-[96vh] relative shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* DRAG HANDLE FOR MOBILE */}
        <div className="md:hidden w-12 h-1 bg-stone-900 rounded-full mx-auto mt-3 shrink-0" />

        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-4.5 shrink-0 bg-[#121212]">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-[#D4AF37]" />
            <span className="font-mono text-xs font-black tracking-[0.2em] text-neutral-100 uppercase">
              ESPACE MEMBRE VIP — DRYTECH
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition cursor-pointer"
            id="close_vip_space_btn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* WARNING BANNER */}
        {errorMsg && profile && (
          <div className="bg-amber-950/40 border-b border-amber-500/10 px-6 py-2 text-[8px] font-mono text-amber-400 uppercase tracking-widest flex items-center justify-between">
            <span>⚠️ {errorMsg}</span>
            <button 
              onClick={() => setReloadTick(prev => prev + 1)}
              className="underline text-[#D4AF37] hover:text-white"
            >
              Ré-essayer
            </button>
          </div>
        )}

        {/* LOADING STATE */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-[#D4AF37] font-mono text-xs tracking-widest gap-4">
            <div className="w-6 h-6 rounded-full border border-t-[#D4AF37] border-r-transparent border-b-[#D4AF37] border-l-transparent animate-spin" />
            <span>INTERROGATION DES REGISTRES DE SÉCURITÉ...</span>
          </div>
        ) : !profile ? (
          <div className="flex-1 p-12 text-center text-zinc-400 font-sans text-xs flex flex-col items-center justify-center gap-4">
            <ShieldAlert className="w-12 h-12 text-amber-700/60" />
            <div className="space-y-1">
              <p className="font-mono text-zinc-300 uppercase tracking-wider text-xs">Échec de synchronisation</p>
              <p className="text-[10px] text-zinc-500 max-w-xs mx-auto">
                {errorMsg || "Impossible de rétablir les données de l'espace membre. Veuillez vérifier votre connexion ou ré-essayer."}
              </p>
            </div>
            <button
              onClick={() => setReloadTick(prev => prev + 1)}
              className="mt-2 px-5 py-2 bg-zinc-900 border border-white/10 hover:border-[#D4AF37]/50 text-white font-mono text-[9px] uppercase tracking-widest rounded-lg transition"
            >
              🔄 Forcer la re-connexion
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 max-h-[80vh] scrollbar-thin">
            
            {/* PHYSICAL-LIKE VIP METAL CARD */}
            <div className="relative group perspective">
              <div 
                className="w-full aspect-[1.58/1] rounded-2xl relative overflow-hidden p-5 flex flex-col justify-between border border-[#D4AF37]/50 shadow-2xl bg-gradient-to-tr from-[#151515] via-[#2A2A2A] to-[#0D0D0D]"
                style={{
                  boxShadow: '0 15px 35px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.1)'
                }}
              >
                {/* Metallic Overlay & Noise Reflection Shaders */}
                <div className="absolute inset-0 bg-linear-to-tr from-transparent via-[#D4AF37]/5 to-transparent pointer-events-none opacity-45 mix-blend-color-dodge" />
                <div className="absolute -top-20 -left-20 w-40 h-40 bg-zinc-700/5 filter blur-3xl rounded-full" />
                
                {/* Card Top: Branding & Qr */}
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex flex-col text-left">
                    <span className="font-mono text-[7px] tracking-[0.25em] text-zinc-400 font-bold uppercase leading-none">
                      PRIVATE RESERVE
                    </span>
                    <span className="font-display text-lg font-light tracking-[0.22em] text-white uppercase leading-tight mt-1">
                      DRYTECH
                    </span>
                  </div>
                  
                  {/* Digital Signature Chip */}
                  <div className="w-8.5 h-6 rounded-md bg-linear-to-b from-amber-400/90 to-amber-600/90 border border-amber-700/30 shadow-xs relative flex items-center justify-center p-0.5 overflow-hidden">
                    <div className="w-full h-full border border-amber-900/10 rounded-xs grid grid-cols-3 gap-[1px]">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="border-[0.5px] border-amber-900/[0.15]" />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Middle: VIP Tier Status Indicator */}
                <div className="flex items-center gap-2.5 relative z-10 my-1">
                  <span className="text-2xl filter drop-shadow-md select-none">
                    {getRankIcon(profile.level)}
                  </span>
                  <div className="flex flex-col text-left">
                    <span className="font-mono text-[7px] text-zinc-400 uppercase tracking-widest">
                      CHAMBRE DES STATUTS
                    </span>
                    <span className="font-mono text-[13px] font-black tracking-[0.16em] text-[#D4AF37] uppercase">
                      {profile.level} MEMBER
                    </span>
                  </div>
                </div>

                {/* Card Bottom: Member Name and Code details */}
                <div className="flex items-end justify-between relative z-10 font-mono">
                  <div className="flex flex-col text-left">
                    <span className="text-[6px] text-zinc-500 uppercase tracking-widest leading-none">
                      TITULAIRE EXCLUSIF
                    </span>
                    <span className="text-[12px] font-bold text-zinc-200 mt-1 uppercase tracking-wide">
                      {profile.pseudo}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[6px] text-zinc-500 uppercase tracking-widest block leading-none">
                      CODE SÉCURISÉ
                    </span>
                    <span className="text-[10px] font-bold text-zinc-350 tracking-wider">
                      OMR-{(telegramId || '000000').substring(0, 7)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* EDITABLE PSEUDO INTERFACE */}
            <div className="bg-[#181818] border border-white/5 rounded-2xl p-4.5 space-y-3">
              <span className="block text-[7.5px] font-mono text-zinc-400 tracking-[0.18em] uppercase">
                VOTRE PSEUDONIME EXCLUSIF :
              </span>
              <div className="flex items-center gap-2">
                {isEditingPseudo ? (
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      value={newPseudo}
                      onChange={(e) => setNewPseudo(e.target.value)}
                      maxLength={20}
                      className="flex-1 bg-black/50 border border-[#D4AF37]/50 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none"
                    />
                    <button
                      onClick={handleUpdatePseudo}
                      className="px-4 py-2 bg-[#D4AF37] text-black font-extrabold font-mono text-[9px] rounded-xl uppercase tracking-wider"
                    >
                      Enregistrer
                    </button>
                    <button
                      onClick={() => { setIsEditingPseudo(false); setNewPseudo(profile.pseudo); }}
                      className="px-3 py-2 bg-neutral-900 border border-zinc-800 rounded-xl text-[9px] font-mono text-zinc-400"
                    >
                      Annuler
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-between bg-black/30 border border-white/5 rounded-xl px-4 py-2.5">
                    <span className="text-sm font-semibold font-mono text-white">
                      {profile.pseudo}
                    </span>
                    <button
                      onClick={() => { triggerHaptic('light'); setIsEditingPseudo(true); }}
                      className="p-1.5 hover:bg-white/5 text-[#D4AF37] hover:text-white transition rounded-lg"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* FIDELITY PROGRESS METRICS & STATUS PROGRESS */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#181818] border border-white/5 p-3 rounded-2xl text-center">
                <Coins className="w-4 h-4 mx-auto mb-1.5 text-[#D4AF37]" />
                <span className="text-[6.5px] font-mono text-zinc-400 block uppercase tracking-widest">
                  POINTS FIDÉLITÉ
                </span>
                <span className="text-sm font-mono font-black text-white mt-1 block">
                  {profile.points} <span className="text-[8px] text-[#D4AF37]">Points</span>
                </span>
              </div>
              <div className="bg-[#181818] border border-white/5 p-3 rounded-2xl text-center">
                <ShoppingBag className="w-4 h-4 mx-auto mb-1.5 text-zinc-350" />
                <span className="text-[6.5px] font-mono text-zinc-400 block uppercase tracking-widest">
                  COMMANDES
                </span>
                <span className="text-sm font-mono font-black text-white mt-1 block">
                  {profile.totalOrders}
                </span>
              </div>
              <div className="bg-[#181818] border border-white/5 p-3 rounded-2xl text-center">
                <TrendingUp className="w-4 h-4 mx-auto mb-1.5 text-emerald-500" />
                <span className="text-[6.5px] font-mono text-zinc-400 block uppercase tracking-widest">
                  SPENT (TOTAL)
                </span>
                <span className="text-sm font-mono font-black text-white mt-1 block">
                  {profile.totalSpent} <span className="text-[7.5px] text-neutral-400">€</span>
                </span>
              </div>
            </div>

            {/* PROGRESS TO NEXT RANK */}
            {rankInfo && (
              <div className="bg-[#181818] border border-white/5 p-4.5 rounded-2xl space-y-3.5 text-left">
                <div className="flex justify-between items-center text-[7.5px] font-mono uppercase tracking-[0.15em]">
                  <span className="text-zinc-400">
                    Prochain statut : <strong className="text-white">{rankInfo.next}</strong>
                  </span>
                  <span className="text-[#D4AF37] font-black">
                    {rankInfo.current} / {rankInfo.target} Commandes
                  </span>
                </div>
                
                {/* Progress bar tracks */}
                <div className="w-full h-2 bg-black/40 rounded-full border border-white/5 relative overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full bg-linear-to-r from-[#D4AF37] to-yellow-350 rounded-full"
                  />
                </div>
                
                <p className="text-[8.5px] font-mono text-zinc-500 leading-relaxed uppercase">
                  Pour obtenir le statut <strong className="text-zinc-300 font-extrabold">{rankInfo.next}</strong> et ses récompenses automatiques, accomplissez encore <strong className="text-[#D4AF37] font-bold">{rankInfo.target - rankInfo.current}</strong> commande{rankInfo.target - rankInfo.current > 1 ? 's' : ''}.
                </p>
              </div>
            )}

            {/* AUTOMATIC MEMBERSHIP REWARDS */}
            <div className="space-y-3 text-left">
              <span className="block text-[7.5px] font-mono text-zinc-400 tracking-[0.22em] uppercase font-black">
                PROGRAMME DE RÉCOMPENSES SÉCURISÉES :
              </span>
              
              <div className="space-y-3">
                {REWARDS.map((reward) => (
                  <div 
                    key={reward.id}
                    className={`border rounded-2xl p-4 transition duration-300 relative overflow-hidden flex flex-col justify-between gap-3 ${
                      reward.unlocked 
                        ? 'bg-neutral-900/60 border-emerald-900/40 hover:border-emerald-800/60 shadow-md' 
                        : 'bg-black/45 border-white/5 opacity-55'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h4 className="text-[11px] font-extrabold font-mono uppercase tracking-wide flex items-center gap-1.5 text-white">
                          <span>{reward.title}</span>
                          {reward.unlocked && <span className="text-[9px] bg-emerald-900/20 text-emerald-400 px-1.5 py-0.2 rounded-full font-sans">DÉBLOQUÉ</span>}
                        </h4>
                        <p className="text-[8.5px] text-zinc-400 leading-normal font-sans max-w-[85%]">
                          {reward.rewardText}
                        </p>
                      </div>
                      
                      <div className="shrink-0 leading-none">
                        {reward.unlocked ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-zinc-650" />
                        )}
                      </div>
                    </div>

                    {/* Unlocked Reward Promo Code Copy Box */}
                    {reward.unlocked && (
                      <div className="bg-black/50 border border-[#D4AF37]/25 rounded-xl px-3 py-2 flex items-center justify-between">
                        <div className="flex flex-col text-left">
                          <span className="text-[6.5px] font-mono text-zinc-500 uppercase tracking-widest leading-none">CODE PRIVÉ :</span>
                          <span className="text-[11px] text-[#D4AF37] font-mono font-extrabold uppercase mt-1 tracking-wider">{reward.promoCode}</span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(reward.promoCode, reward.id)}
                          className="px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-850 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 text-zinc-350 hover:text-white border border-white/5 transition active:scale-95"
                        >
                          {copiedCode === reward.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>COPIÉ</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>COPIER</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {!reward.unlocked && (
                      <div className="text-[7px] font-mono text-zinc-500 uppercase tracking-wider pl-0.5">
                        {reward.requirement}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* PERSONAL ORDERS HISTORY JOURNAL */}
            <div className="space-y-3.5 text-left pt-2">
              <div className="flex justify-between items-center">
                <span className="block text-[7.5px] font-mono text-zinc-400 tracking-[0.22em] uppercase font-black">
                  JOURNAL DE MES RESERVATIONS :
                </span>
                <span className="text-[8px] text-zinc-500 font-mono">
                  {orders.length} Réservation{orders.length > 1 ? 's' : ''}
                </span>
              </div>

              {orders.length === 0 ? (
                <div className="py-8 bg-black/20 border border-white/5 rounded-2xl text-center">
                  <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
                    Aucun historique enregistré pour l'instant.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {orders.map((order) => {
                    const statusColors = {
                      pending: 'text-amber-500 bg-amber-950/20 border-amber-900/40',
                      completed: 'text-emerald-400 bg-emerald-950/20 border-emerald-900/40',
                      cancelled: 'text-rose-400 bg-rose-950/20 border-rose-900/40'
                    };
                    const statusLabel = {
                      pending: 'EN ATTENTE D\'EXPÉDITION',
                      completed: 'REMISE EXPÉDIÉE',
                      cancelled: 'ANNULÉE'
                    };

                    return (
                      <div 
                        key={order.id}
                        className="bg-[#151515] hover:bg-[#181818] border border-white/5 p-4 rounded-2xl flex flex-col gap-2.5 transition"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col">
                            <span className="font-mono text-[10px] font-extrabold text-neutral-100">
                              {order.id}
                            </span>
                            <span className="text-[7.5px] text-zinc-500 font-mono mt-0.5 uppercase tracking-wide">
                              {new Date(order.date).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          
                          <div className="flex flex-col items-end">
                            <span className="font-mono text-[11px] font-black text-white">
                              {order.totalAmount} €
                            </span>
                            <span className="text-[6.5px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">
                              {order.paymentMethod === 'cod' ? 'Règlement Cache' : 'Crypto / Carte'}
                            </span>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="bg-black/30 rounded-xl p-2.5 grid gap-1.5">
                          {order.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between items-center text-[8.5px] font-mono text-zinc-400 leading-tight">
                              <span className="text-zinc-300 font-bold max-w-[70%] truncate">
                                {it.title} ({it.selectedSize})
                              </span>
                              <span>
                                {it.quantity}x
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Order Status Badge */}
                        <div className="flex justify-between items-center pt-1 border-t border-white/5">
                          <span className="text-[7px] text-zinc-500 font-mono uppercase tracking-widest">EXPÉDITEUR : {order.city}</span>
                          <span className={`px-2.5 py-0.5 rounded text-[7.5px] font-mono font-extrabold border ${statusColors[order.status] || statusColors.pending}`}>
                            {statusLabel[order.status] || order.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SAFETY NOTICE FOOTER */}
            <div className="p-3 border border-zinc-900 bg-zinc-950/20 rounded-2xl opacity-65 flex gap-2.5 items-start text-[8px] font-mono text-zinc-500 leading-relaxed uppercase">
              <QrCode className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
              <p>
                Espace Cryptographique DRYTECH. Les informations d'expédition et les statistiques de fidélité sont stockées de manière pseudonymisée et chiffrée de bout en bout.
              </p>
            </div>

          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
