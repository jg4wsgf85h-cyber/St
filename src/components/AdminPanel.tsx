/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, useMemo, ChangeEvent, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Database, 
  Trash2, 
  Edit3, 
  Upload, 
  Plus, 
  X, 
  Sparkles, 
  CheckCircle2, 
  Eye, 
  EyeOff,
  ArrowUp,
  ArrowDown,
  Video, 
  AlertTriangle, 
  Lock,
  Compass,
  FileSpreadsheet,
  Check,
  Ban,
  Phone,
  MapPin,
  ClipboardList,
  UserCheck,
  Megaphone,
  Send,
  ChevronUp,
  ChevronDown,
  User
} from 'lucide-react';
import { VideoItem, Order, BrandingSettings, SectionTitle, WhitelistItem, Reward, PromoCode, PendingApproval, MarqueeItem, DEFAULT_MARQUEE_CONFIG } from '../types';
import { addProduct, deleteProduct, getOrders, updateOrderStatus, deleteOrder, getBrandingSettings, updateBrandingSettings, uploadFileRaw, getWhitelist, addWhitelistItem, deleteWhitelistItem, setAdminPasswordToken, clearAdminPasswordToken, getConnectionLogs, deleteConnectionLog, triggerTelegramBroadcast, getTelegramBroadcastStatus, resetTelegramBroadcastStatus, undoLastTelegramBroadcast, editLastTelegramBroadcast, deleteTelegramMessageManual, editTelegramMessageManual, getAllUsersProfile, getRewards, saveReward, deleteReward, getPromoCodes, savePromoCode, deletePromoCode, getPendingApprovals, approvePendingRequest, rejectPendingRequest } from '../db';

const isVideoUrl = (url?: string): boolean => {
  if (!url) return false;
  const cleanUrl = url.toLowerCase().split('?')[0];
  return cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.webm') || cleanUrl.endsWith('.mov') || url.includes('video') || url.includes('mp4');
};

function getBadgeTypeAndValue(badge?: string): { type: string; promo: string } {
  if (!badge || badge === 'NONE' || badge === '') return { type: 'NONE', promo: '' };
  if (badge === 'IN_STOCK' || badge === 'IN STOCK') return { type: 'IN_STOCK', promo: '' };
  if (badge === 'LAST') return { type: 'LAST', promo: '' };
  if (badge === 'OUT' || badge === 'OUT_OF_STOCK' || badge === 'OUT OF STOCK') return { type: 'OUT_OF_STOCK', promo: '' };
  return { type: 'PROMO', promo: badge };
}

interface AdminPanelProps {
  products: VideoItem[];
  tgUser: any;
  onRefreshProducts: () => Promise<void>;
  triggerHaptic: (style: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => void;
  onClose: () => void;
  onBrandingChange?: (settings: BrandingSettings) => void;
}

export default function AdminPanel({
  products,
  tgUser,
  onRefreshProducts,
  triggerHaptic,
  onClose,
  onBrandingChange
}: AdminPanelProps) {
  // Real Telegram WebApp detection to completely block access inside the Mini App
  const tg = (window as any).Telegram?.WebApp;
  const isInsideTelegram = !!(tg && (tg.initData?.trim() || (tg.platform && tg.platform !== 'unknown')));

  // Whitelist state variables
  const [whitelist, setWhitelist] = useState<WhitelistItem[]>([]);
  const [loadingWhitelist, setLoadingWhitelist] = useState<boolean>(false);
  const [newWhitelistVal, setNewWhitelistVal] = useState<string>('');
  const [newWhitelistType, setNewWhitelistType] = useState<'ID' | 'Username'>('ID');
  const [newWhitelistRole, setNewWhitelistRole] = useState<'MEMBER' | 'ADMIN' | 'OWNER'>('MEMBER');

  // Connection Logs state variables
  const [connectionLogs, setConnectionLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(false);

  // Pending Approvals state variables
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [loadingPending, setLoadingPending] = useState<boolean>(false);

  // Master Passcode & Owner security logic restored
  const isUserOwner = (user: any) => {
    if (!user) return false;
    const idStr = String(user.id).trim();
    const usernameStr = String(user.username || '').toLowerCase().trim();
    
    return usernameStr === 'sultan_st212' || usernameStr === 'yoru47' || usernameStr === 'samy_ghost' || usernameStr === 'amine755yss' || usernameStr === 'amine_cartel' || idStr === '858781160';
  };

  const isWhitelisted = useMemo(() => {
    return true;
  }, []);

  // Tab state: 'products' | 'orders' | 'settings' | 'whitelist' | 'broadcast' | 'vip' | 'rewards' | 'promos'
  const [activeTab, setActiveTab ] = useState<'products' | 'orders' | 'settings' | 'whitelist' | 'broadcast' | 'vip' | 'rewards' | 'promos'>('products');

  // Manageable Loyalty Rewards lists
  const [rewardsList, setRewardsList] = useState<Reward[]>([]);
  const [loadingRewards, setLoadingRewards] = useState<boolean>(false);
  const [editingReward, setEditingReward] = useState<Partial<Reward> | null>(null);

  const fetchRewardsData = async () => {
    setLoadingRewards(true);
    try {
      const list = await getRewards();
      setRewardsList(list);
    } catch (e) {
      console.error('Error loading rewards', e);
    } finally {
      setLoadingRewards(false);
    }
  };

  const handleSaveReward = async (r: Reward) => {
    try {
      await saveReward(r);
      await fetchRewardsData();
      setEditingReward(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteReward = async (id: string) => {
    try {
      await deleteReward(id);
      await fetchRewardsData();
    } catch (e) {
      console.error(e);
    }
  };

  // Manageable Promo Codes lists
  const [promosList, setPromosList] = useState<PromoCode[]>([]);
  const [loadingPromos, setLoadingPromos] = useState<boolean>(false);
  const [editingPromo, setEditingPromo] = useState<Partial<PromoCode> | null>(null);

  const fetchPromosData = async () => {
    setLoadingPromos(true);
    try {
      const list = await getPromoCodes();
      setPromosList(list);
    } catch (e) {
      console.error('Error loading promo codes', e);
    } finally {
      setLoadingPromos(false);
    }
  };

  const handleSavePromo = async (p: PromoCode) => {
    try {
      await savePromoCode(p);
      await fetchPromosData();
      setEditingPromo(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePromo = async (id: string) => {
    try {
      await deletePromoCode(id);
      await fetchPromosData();
    } catch (e) {
      console.error(e);
    }
  };

  // VIP Accounts admin monitor
  const [vipUsers, setVipUsers] = useState<any[]>([]);
  const [loadingVip, setLoadingVip] = useState<boolean>(false);

  const fetchVipUsers = async () => {
    setLoadingVip(true);
    try {
      const list = await getAllUsersProfile();
      setVipUsers(list);
    } catch (e) {
      console.error('Error loading VIP accounts', e);
    } finally {
      setLoadingVip(false);
    }
  };

  // Telegram Promo Broadcast state
  const [broadcastStats, setBroadcastStats] = useState<{
    totalUsers: number;
    sentCount: number;
    pendingCount: number;
    sentList: string[];
  } | null>(null);
  const [loadingBroadcast, setLoadingBroadcast] = useState<boolean>(false);
  const [broadcasting, setBroadcasting] = useState<boolean>(false);
  const [broadcastResult, setBroadcastResult] = useState<any>(null);

  const fetchBroadcastStatus = async () => {
    setLoadingBroadcast(true);
    try {
      const stats = await getTelegramBroadcastStatus();
      setBroadcastStats(stats);
    } catch (e) {
      console.error('Error fetching broadcast status', e);
    } finally {
      setLoadingBroadcast(false);
    }
  };

  const [broadcastForceAll, setBroadcastForceAll] = useState<boolean>(true);

  const handleStartBroadcast = async () => {
    triggerHaptic('heavy');
    setBroadcasting(true);
    setBroadcastResult(null);
    try {
      const result = await triggerTelegramBroadcast({ forceAll: broadcastForceAll });
      setBroadcastResult(result);
      triggerHaptic('success');
      // Refresh status
      await fetchBroadcastStatus();
    } catch (e: any) {
      console.error('Error starting broadcast', e);
      setBroadcastResult({ error: e.message || 'La diffusion a échoué...' });
      triggerHaptic('error');
    } finally {
      setBroadcasting(false);
    }
  };

  const handleResetBroadcastTracking = async () => {
    triggerHaptic('heavy');
    setLoadingBroadcast(true);
    try {
      await resetTelegramBroadcastStatus();
      triggerHaptic('success');
      setSuccessMsg('Historique des envois réinitialisé avec succès !');
      setTimeout(() => setSuccessMsg(''), 3000);
      await fetchBroadcastStatus();
    } catch (e: any) {
      console.error('Error resetting broadcast tracking', e);
      setErrorMsg('Échec de la réinitialisation...');
      setTimeout(() => setErrorMsg(''), 3000);
    } finally {
      setLoadingBroadcast(false);
    }
  };

  const [undoingBroadcast, setUndoingBroadcast] = useState<boolean>(false);
  const [undoResult, setUndoResult] = useState<any>(null);
  const [confirmUndoBroadcastState, setConfirmUndoBroadcastState] = useState<'idle' | 'confirm'>('idle');

  const handleUndoLastBroadcast = async () => {
    if (confirmUndoBroadcastState === 'idle') {
      setConfirmUndoBroadcastState('confirm');
      triggerHaptic('warning');
      setTimeout(() => {
        setConfirmUndoBroadcastState(prev => prev === 'confirm' ? 'idle' : prev);
      }, 5050);
      return;
    }

    setConfirmUndoBroadcastState('idle');
    triggerHaptic('heavy');
    setUndoingBroadcast(true);
    setUndoResult(null);
    try {
      const result = await undoLastTelegramBroadcast();
      setUndoResult(result);
      triggerHaptic('success');
      setSuccessMsg(`Succès : ${result.deletedCount} message(s) supprimé(s).`);
      setTimeout(() => setSuccessMsg(''), 5000);
      await fetchBroadcastStatus();
    } catch (e: any) {
      console.error('Error undoing last broadcast', e);
      setUndoResult({ error: e.message || 'La suppression du broadcast a échoué...' });
      triggerHaptic('error');
      setErrorMsg(e.message || 'Erreur lors de la suppression du broadcast.');
      setTimeout(() => setErrorMsg(''), 5000);
    } finally {
      setUndoingBroadcast(false);
    }
  };

  const [editingBroadcast, setEditingBroadcast] = useState<boolean>(false);
  const [editResult, setEditResult] = useState<any>(null);
  const [confirmEditBroadcastState, setConfirmEditBroadcastState] = useState<'idle' | 'confirm'>('idle');

  const [manualChatId, setManualChatId] = useState<string>(() => localStorage.getItem('hl_manual_chat_id') || '');
  const [manualMessageId, setManualMessageId] = useState<string>(() => localStorage.getItem('hl_manual_msg_id') || '');
  const [manualText, setManualText] = useState<string>(() => localStorage.getItem('hl_manual_text') || '');
  const [manualUrl, setManualUrl] = useState<string>(() => localStorage.getItem('hl_manual_url') || '');
  const [manualBtnLabel, setManualBtnLabel] = useState<string>(() => localStorage.getItem('hl_manual_btn') || 'INSTAGRAM 📱');
  const [manualUrl2, setManualUrl2] = useState<string>(() => localStorage.getItem('hl_manual_url2') || '');
  const [manualBtnLabel2, setManualBtnLabel2] = useState<string>(() => localStorage.getItem('hl_manual_btn2') || '');
  const [manualHasPhoto, setManualHasPhoto] = useState<boolean>(() => localStorage.getItem('hl_manual_photo') === 'false' ? false : true);
  const [manualLoading, setManualLoading] = useState<boolean>(false);
  const [manualResultMsg, setManualResultMsg] = useState<{ success: boolean; msg: string; log?: any } | null>(null);

  const handleEditLastBroadcast = async () => {
    if (confirmEditBroadcastState === 'idle') {
      setConfirmEditBroadcastState('confirm');
      triggerHaptic('warning');
      setTimeout(() => {
        setConfirmEditBroadcastState(prev => prev === 'confirm' ? 'idle' : prev);
      }, 5050);
      return;
    }

    setConfirmEditBroadcastState('idle');
    triggerHaptic('heavy');
    setEditingBroadcast(true);
    setEditResult(null);
    try {
      const result = await editLastTelegramBroadcast();
      setEditResult(result);
      triggerHaptic('success');
      setSuccessMsg(`Succès : ${result.editedCount} message(s) modifié(s).`);
      setTimeout(() => setSuccessMsg(''), 5000);
      await fetchBroadcastStatus();
    } catch (e: any) {
      console.error('Error editing last broadcast:', e);
      setEditResult({ error: e.message || 'La mise à jour du broadcast a échoué...' });
      triggerHaptic('error');
      setErrorMsg(e.message || 'Erreur lors de la modification du broadcast.');
      setTimeout(() => setErrorMsg(''), 5000);
    } finally {
      setEditingBroadcast(false);
    }
  };

  const [confirmDeleteState, setConfirmDeleteState] = useState<'idle' | 'confirm'>('idle');
  const [confirmEditState, setConfirmEditState] = useState<'idle' | 'confirm'>('idle');
  const [confirmDeleteRewardId, setConfirmDeleteRewardId] = useState<string | null>(null);
  const [confirmDeletePromoId, setConfirmDeletePromoId] = useState<string | null>(null);

  const handleManualDeleteMessage = async () => {
    console.log("[DEBUG] [DELETE] Button clicked. Chat ID:", manualChatId, "| Message ID:", manualMessageId);
    if (!manualChatId.trim() || !manualMessageId.trim()) {
      console.warn("[DEBUG] [DELETE] Missing chatId or messageId, showing warning...");
      setManualResultMsg({
        success: false,
        msg: "❌ Veuillez renseigner le Chat ID et le Message ID."
      });
      triggerHaptic('error');
      return;
    }

    if (confirmDeleteState === 'idle') {
      console.log("[DEBUG] [DELETE] Confirm state set to 'confirm' - requiring second click to approve.");
      setConfirmDeleteState('confirm');
      triggerHaptic('warning');
      
      // Auto-reset back to idle after 5 seconds if not clicked
      setTimeout(() => {
        setConfirmDeleteState(prev => {
          if (prev === 'confirm') {
            console.log("[DEBUG] [DELETE] Confirm window timeout. Resetting to idle.");
            return 'idle';
          }
          return prev;
        });
      }, 5000);
      return;
    }

    // If already in 'confirm' state, proceed with actual call!
    setConfirmDeleteState('idle'); // reset state
    console.log("[DEBUG] [DELETE] Confirmed! Proceeding with deletion.");
    setManualLoading(true);
    setManualResultMsg(null);
    try {
      console.log("[DEBUG] [DELETE] Initializing API request to /api/telegram-message-delete-manual...");
      const result = await deleteTelegramMessageManual(manualChatId, manualMessageId);
      console.log("[DEBUG] [DELETE] API Response:", result);
      
      if (result.success) {
        console.log("[DEBUG] [DELETE] Telegram API returned SUCCESS");
        setManualResultMsg({ 
          success: true, 
          msg: result.message || "Message supprimé avec succès !", 
          log: result.log 
        });
        triggerHaptic('success');
      } else {
        console.warn("[DEBUG] [DELETE] Telegram API returned FAILURE status", result);
        setManualResultMsg({ 
          success: false, 
          msg: result.error || "La suppression du message a échoué sur Telegram.", 
          log: result.log 
        });
        triggerHaptic('error');
      }
    } catch (e: any) {
      console.error("[DEBUG] [DELETE] Network or Backend Error during deletion:", e);
      setManualResultMsg({ 
        success: false, 
        msg: e.message || "Erreur de suppression.", 
        log: { chatId: manualChatId, messageId: manualMessageId, error: e.message } 
      });
      triggerHaptic('error');
    } finally {
      console.log("[DEBUG] [DELETE] Request finalized, setting loading to false.");
      setManualLoading(false);
    }
  };

  const handleManualEditMessage = async () => {
    console.log("[DEBUG] [EDIT] Button clicked. Chat ID:", manualChatId, "| Message ID:", manualMessageId);
    if (!manualChatId.trim() || !manualMessageId.trim() || !manualText.trim() || !manualUrl.trim()) {
      console.warn("[DEBUG] [EDIT] Missing fields, showing warning...");
      setManualResultMsg({
        success: false,
        msg: "❌ Veuillez renseigner le Chat ID, le Message ID, le nouveau texte et le nouveau lien."
      });
      triggerHaptic('error');
      return;
    }

    if (confirmEditState === 'idle') {
      console.log("[DEBUG] [EDIT] Confirm state set to 'confirm' - requiring second click to approve.");
      setConfirmEditState('confirm');
      triggerHaptic('warning');
      
      // Auto-reset back to idle after 5 seconds if not clicked
      setTimeout(() => {
        setConfirmEditState(prev => {
          if (prev === 'confirm') {
            console.log("[DEBUG] [EDIT] Confirm window timeout. Resetting to idle.");
            return 'idle';
          }
          return prev;
        });
      }, 5000);
      return;
    }

    // If already in 'confirm' state, proceed with actual call!
    setConfirmEditState('idle'); // reset state
    console.log("[DEBUG] [EDIT] Confirmed! Proceeding with modification.");
    setManualLoading(true);
    setManualResultMsg(null);
    try {
      console.log("[DEBUG] [EDIT] Initializing API request to /api/telegram-message-edit-manual...");
      const result = await editTelegramMessageManual(manualChatId, manualMessageId, manualText, manualUrl, manualBtnLabel, manualHasPhoto, manualUrl2, manualBtnLabel2);
      console.log("[DEBUG] [EDIT] API Response:", result);
      
      if (result.success) {
        console.log("[DEBUG] [EDIT] Telegram API returned SUCCESS");
        setManualResultMsg({ 
          success: true, 
          msg: result.message || "Message modifié avec succès !", 
          log: result.log 
        });
        triggerHaptic('success');
      } else {
        console.warn("[DEBUG] [EDIT] Telegram API returned FAILURE status", result);
        setManualResultMsg({ 
          success: false, 
          msg: result.error || "La modification du message a échoué sur Telegram.", 
          log: result.log 
        });
        triggerHaptic('error');
      }
    } catch (e: any) {
      console.error("[DEBUG] [EDIT] Network or Backend Error during edit:", e);
      setManualResultMsg({ 
        success: false, 
        msg: e.message || "Erreur de modification.", 
        log: { chatId: manualChatId, messageId: manualMessageId, error: e.message } 
      });
      triggerHaptic('error');
    } finally {
      console.log("[DEBUG] [EDIT] Request finalized, setting loading to false.");
      setManualLoading(false);
    }
  };

  const [newWhitelistNotes, setNewWhitelistNotes] = useState<string>('');

  // Customer Orders register state
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(false);

  // Branding Customization settings
  const [settings, setBrandingSettings] = useState<BrandingSettings>({
    introBgUrl: '',
    launchScreenUrl: '',
    homepageHeroBgUrl: '',
    logoUrl: '',
    introStatusLine: '👽⛰️ALIENS FARMS OFFICIEL⛰️👽 — PRIVATE RESERVE'
  });

  // States for adding product (Morocco MAD strictly)
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');
  const [newPrice, setNewPrice] = useState<number>(350);
  const [newWholesalePrice, setNewWholesalePrice] = useState<number>(0);
  const [newCategory, setNewCategory] = useState<string>('WPFF');
  const [newDisplayZone, setNewDisplayZone] = useState<string>(''); // Optional storefront placement (e.g. MEET UP RABAT)
  const [newAuthor, setNewAuthor] = useState<string>('👽⛰️ALIENS FARMS OFFICIEL⛰️👽');
  const [isFeatured, setIsFeatured] = useState<boolean>(true);
  const [newBadgeType, setNewBadgeType] = useState<string>('NONE');
  const [newBadgePromo, setNewBadgePromo] = useState<string>('-10%');
  
  // Native files and media preview states with upload loading states to prevent base64 leaks
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string>('');
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string>('');
  const [extraPhotosUrls, setExtraPhotosUrls] = useState<string[]>([]);
  
  const [mainVideoUploading, setMainVideoUploading] = useState<boolean>(false);
  const [mainPhotoUploading, setMainPhotoUploading] = useState<boolean>(false);
  const [extraPhotosUploading, setExtraPhotosUploading] = useState<boolean>(false);

  const [editVideoUploading, setEditVideoUploading] = useState<boolean>(false);
  const [editPhotoUploading, setEditPhotoUploading] = useState<boolean>(false);
  const [editExtraPhotosUploading, setEditExtraPhotosUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  interface UploadStatusState {
    isActive: boolean;
    filename: string;
    step: 'upload' | 'verify' | 'store' | 'done' | 'error';
    percent: number;
    logs: string[];
    error?: string;
    httpStatus?: number;
    httpResponse?: string;
    message?: string;
  }
  const [uploadStatus, setUploadStatus] = useState<UploadStatusState>({
    isActive: false,
    filename: '',
    step: 'done',
    percent: 0,
    logs: []
  });

  const performDetailedUpload = async (file: File) => {
    setUploadStatus({
      isActive: true,
      filename: file.name,
      step: 'upload',
      percent: 0,
      logs: [`[INITIALISATION] Démarrage du téléversement de "${file.name}" (${(file.size / (1024 * 1024)).toFixed(2)} Mo)...`]
    });
    
    try {
      const publicUrl = await uploadFileRaw(file, (index, total, step, extra) => {
        let simpleProg = `${Math.round((index / total) * 100)}%`;
        if (step === 'verify') simpleProg = 'Vérification...';
        if (step === 'store') simpleProg = 'Stockage...';
        if (step === 'done') simpleProg = 'OK';
        setUploadProgress(simpleProg);

        setUploadStatus(prev => {
          let mergedLogs = prev.logs;
          if (extra?.logs && extra.logs.length > 0) {
            // Keep existing log lines but merge any new unique ones efficiently
            const currSet = new Set(prev.logs);
            extra.logs.forEach(l => {
              if (!currSet.has(l)) {
                mergedLogs = [...mergedLogs, l];
              }
            });
          }
          return {
            ...prev,
            step: step || prev.step,
            percent: Math.round((index / total) * 100),
            logs: mergedLogs,
            error: extra?.error || prev.error,
            httpStatus: extra?.httpStatus || prev.httpStatus,
            httpResponse: extra?.httpResponse || prev.httpResponse,
            message: extra?.message || prev.message
          };
        });
      });

      // Synchronously force terminal done state upon successful URL resolution to ensure UI never stalls
      setUploadStatus(prev => ({
        ...prev,
        step: 'done',
        percent: 100,
        logs: [...prev.logs, `[RECONSTITUÉ] Succès! Fichier traité, URL publique générée: ${publicUrl}`]
      }));

      // Automatically close the pipeline modal after 1.5 seconds on success
      setTimeout(() => {
        setUploadStatus(prev => {
          if (prev.step === 'done') {
            return { ...prev, isActive: false };
          }
          return prev;
        });
      }, 1500);

      return publicUrl;
    } catch (err: any) {
      console.error('Detailed upload failed:', err);
      setUploadStatus(prev => {
        const errMsg = err.message || String(err);
        const errLog = `[ERREUR INDÉSIRABLE] ${errMsg}`;
        const hasLog = prev.logs.includes(errLog);
        return {
          ...prev,
          step: 'error',
          error: errMsg,
          logs: hasLog ? prev.logs : [...prev.logs, errLog]
        };
      });
      throw err;
    }
  };

  // Editing products states
  const [editingProduct, setEditingProduct] = useState<VideoItem | null>(null);

  // General form feedback actions
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [uploadingIntro, setUploadingIntro] = useState<boolean>(false);
  const [uploadingLaunch, setUploadingLaunch] = useState<boolean>(false);
  const [uploadingHero, setUploadingHero] = useState<boolean>(false);
  const [uploadingLogo, setUploadingLogo] = useState<boolean>(false);
  const [uploadingBgLogo, setUploadingBgLogo] = useState<boolean>(false);
  const [uploadingPromoImg, setUploadingPromoImg] = useState<boolean>(false);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [confirmingOrderDeleteId, setConfirmingOrderDeleteId] = useState<string | null>(null);

  // Helper state logic for custom section titles
  const sectionTitles = settings.sectionTitles || [];

  const handleAddSectionTitle = () => {
    const nextOrder = sectionTitles.length > 0 
      ? Math.max(...sectionTitles.map(t => t.order || 0)) + 1 
      : 1;
    const newTitle: SectionTitle = {
      id: Date.now().toString(),
      text: 'NOUVELLE COLLECTION',
      category: 'All',
      size: 'L',
      color: '#FFFFFF',
      enabled: true,
      order: nextOrder
    };
    setBrandingSettings({
      ...settings,
      sectionTitles: [...sectionTitles, newTitle]
    });
  };

  const handleUpdateSectionTitle = (id: string, updatedFields: Partial<SectionTitle>) => {
    const updated = sectionTitles.map(t => t.id === id ? { ...t, ...updatedFields } : t);
    setBrandingSettings({
      ...settings,
      sectionTitles: updated
    });
  };

  const handleRemoveSectionTitle = (id: string) => {
    const updated = sectionTitles.filter(t => t.id !== id);
    setBrandingSettings({
      ...settings,
      sectionTitles: updated
    });
  };

  const handleMoveSectionTitle = (index: number, direction: 'up' | 'down') => {
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= sectionTitles.length) return;
    
    const copy = [...sectionTitles];
    const temp = copy[index];
    copy[index] = copy[nextIndex];
    copy[nextIndex] = temp;
    
    const updated = copy.map((t, idx) => ({ ...t, order: idx + 1 }));
    setBrandingSettings({
      ...settings,
      sectionTitles: updated
    });
  };

  const videoInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const extraPhotosInputRef = useRef<HTMLInputElement>(null);

  const editVideoInputRef = useRef<HTMLInputElement>(null);
  const editPhotoInputRef = useRef<HTMLInputElement>(null);
  const editExtraPhotosInputRef = useRef<HTMLInputElement>(null);

  const handleEditVideoSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 80 * 1024 * 1024) {
        setErrorMsg('Vidéo trop volumineuse. Limite 80 Mo');
        setTimeout(() => setErrorMsg(''), 4000);
        return;
      }
      setEditVideoUploading(true);
      setUploadProgress('0%');
      triggerHaptic('medium');
      try {
        const publicUrl = await performDetailedUpload(file);
        if (editingProduct) {
          setEditingProduct({ ...editingProduct, videoUrl: publicUrl });
        }
        triggerHaptic('success');
      } catch (err: any) {
        console.error('Edit video raw upload failing:', err);
        setErrorMsg('Échec de téléversement de la vidéo.');
        setTimeout(() => setErrorMsg(''), 4500);
      } finally {
        setEditVideoUploading(false);
        setUploadProgress('');
      }
    }
  };

  const handleEditPhotoSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditPhotoUploading(true);
      setUploadProgress('0%');
      triggerHaptic('light');
      try {
        const publicUrl = await performDetailedUpload(file);
        if (editingProduct) {
          setEditingProduct({ ...editingProduct, thumbnailUrl: publicUrl });
        }
        triggerHaptic('success');
      } catch (err: any) {
        console.error('Edit cover photo raw upload failing:', err);
        setErrorMsg('Échec de téléversement de la couverture.');
        setTimeout(() => setErrorMsg(''), 4500);
      } finally {
        setEditPhotoUploading(false);
        setUploadProgress('');
      }
    }
  };

  const handleEditExtraPhotosSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setEditExtraPhotosUploading(true);
      setUploadProgress('0%');
      triggerHaptic('light');
      try {
        const uploadedUrls: string[] = [];
        const fileList = Array.from(files) as File[];
        for (let idx = 0; idx < fileList.length; idx++) {
          const file = fileList[idx];
          const publicUrl = await performDetailedUpload(file);
          uploadedUrls.push(publicUrl);
        }
        if (editingProduct) {
          const existing = editingProduct.additionalPhotos || [];
          setEditingProduct({ 
            ...editingProduct, 
            additionalPhotos: [...existing, ...uploadedUrls] 
          });
        }
        triggerHaptic('success');
      } catch (err: any) {
        console.error('Edit additional photo raw upload failing:', err);
        setErrorMsg('Échec de la galerie additionnelle.');
        setTimeout(() => setErrorMsg(''), 4500);
      } finally {
        setEditExtraPhotosUploading(false);
        setUploadProgress('');
      }
    }
  };

  // Load orders from database Journal
  const loadOrdersJournal = async () => {
    setLoadingOrders(true);
    try {
      const records = await getOrders();
      setOrders(records);
    } catch (e) {
      console.error('Error loading orders journal', e);
    } finally {
      setLoadingOrders(false);
    }
  };

  const loadBrandingSettings = async () => {
    try {
      const cfg = await getBrandingSettings();
      if (cfg) setBrandingSettings(cfg);
    } catch (e) {
      console.error('Error fetching branding', e);
    }
  };

  const loadWhitelistData = async () => {
    setLoadingWhitelist(true);
    try {
      const [records, logs, pending, users] = await Promise.all([
        getWhitelist().catch(() => []),
        getConnectionLogs().catch(() => []),
        getPendingApprovals().catch(() => []),
        getAllUsersProfile().catch(() => [])
      ]);
      setWhitelist(records || []);
      if (Array.isArray(logs)) setConnectionLogs(logs);
      if (Array.isArray(pending)) setPendingApprovals(pending);
      if (Array.isArray(users)) setVipUsers(users);
    } catch (e) {
      console.error('Error loading whitelist data', e);
    } finally {
      setLoadingWhitelist(false);
    }
  };

  const loadConnectionLogsData = async () => {
    setLoadingLogs(true);
    try {
      const logs = await getConnectionLogs();
      if (Array.isArray(logs)) {
        setConnectionLogs(logs);
      }
    } catch (e) {
      console.error('Error loading connection logs', e);
    } finally {
      setLoadingLogs(false);
    }
  };

  const loadPendingApprovalsData = async () => {
    setLoadingPending(true);
    try {
      const records = await getPendingApprovals();
      if (Array.isArray(records)) {
        setPendingApprovals(records);
      }
    } catch (e) {
      console.error('Error loading pending approvals data', e);
    } finally {
      setLoadingPending(false);
    }
  };

  const handleApprovePending = async (item: PendingApproval, notes?: string) => {
    triggerHaptic('medium');
    try {
      await approvePendingRequest(item.id, item.telegramId, item.username, notes);
      // Remove from pending list
      setPendingApprovals((prev) => prev.filter((p) => p.id !== item.id));
      // Reload whitelist list so it reflects the new user
      await loadWhitelistData();
      triggerHaptic('success');
    } catch (err) {
      console.error('Error approving user:', err);
    }
  };

  const handleRejectPending = async (item: PendingApproval) => {
    triggerHaptic('medium');
    if (!window.confirm(`Êtes-vous sûr de vouloir rejeter la demande de @${item.username || item.telegramId} ?`)) {
      return;
    }
    try {
      await rejectPendingRequest(item.id, item.telegramId);
      // Remove from pending list
      setPendingApprovals((prev) => prev.filter((p) => p.id !== item.id));
      triggerHaptic('success');
    } catch (err) {
      console.error('Error rejecting user:', err);
    }
  };

  const handleDeleteConnectionLog = async (id: string) => {
    triggerHaptic('medium');
    try {
      await deleteConnectionLog(id);
      setConnectionLogs((prev) => prev.filter((log) => log.id !== id));
      triggerHaptic('success');
    } catch (e) {
      console.error('Error deleting connection log line:', e);
      triggerHaptic('error');
    }
  };

  const handleAddWhitelist = async (e: FormEvent) => {
    e.preventDefault();
    const val = newWhitelistVal.trim();
    if (!val) return;
    setIsSubmitting(true);
    try {
      await addWhitelistItem({
        value: val,
        type: newWhitelistType,
        notes: newWhitelistNotes.trim(),
        role: newWhitelistRole
      } as any);
      setNewWhitelistVal('');
      setNewWhitelistNotes('');
      setNewWhitelistRole('MEMBER');
      setSuccessMsg('MEMBRE AJOUTÉ AVEC SUCCÈS');
      setTimeout(() => setSuccessMsg(''), 4000);
      triggerHaptic('success');
      await loadWhitelistData();
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors de l'ajout");
      setTimeout(() => setErrorMsg(''), 4000);
      triggerHaptic('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteWhitelist = async (id: string) => {
    triggerHaptic('medium');
    try {
      await deleteWhitelistItem(id);
      setSuccessMsg('MEMBRE SUPPRIMÉ AVEC SUCCÈS');
      setTimeout(() => setSuccessMsg(''), 4000);
      triggerHaptic('success');
      await loadWhitelistData();
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors de la suppression");
      setTimeout(() => setErrorMsg(''), 4000);
      triggerHaptic('error');
    }
  };

  useEffect(() => {
    if (isWhitelisted) {
      loadOrdersJournal();
      loadBrandingSettings();
      loadWhitelistData();
      loadConnectionLogsData();
      loadPendingApprovalsData();
    }
  }, [isWhitelisted]);

  // Video Gallery file selection
  const handleVideoSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 80 * 1024 * 1024) {
        setErrorMsg('Vidéo trop volumineuse. Limite 80 Mo');
        setTimeout(() => setErrorMsg(''), 4000);
        return;
      }
      setMainVideoUploading(true);
      setUploadProgress('0%');
      triggerHaptic('medium');
      try {
        const publicUrl = await performDetailedUpload(file);
        setVideoPreviewUrl(publicUrl);
        triggerHaptic('success');
      } catch (err: any) {
        console.error('Video select raw upload failed:', err);
        setErrorMsg('Échec de chargement de la vidéo.');
        setTimeout(() => setErrorMsg(''), 4500);
      } finally {
        setMainVideoUploading(false);
        setUploadProgress('');
      }
    }
  };

  // Cover image file selection
  const handlePhotoSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMainPhotoUploading(true);
      setUploadProgress('0%');
      triggerHaptic('light');
      try {
        const publicUrl = await performDetailedUpload(file);
        setPhotoPreviewUrl(publicUrl);
        triggerHaptic('success');
      } catch (err: any) {
        console.error('Photo select raw upload failed:', err);
        setErrorMsg('Échec de chargement de l\'image de couverture.');
        setTimeout(() => setErrorMsg(''), 4500);
      } finally {
        setMainPhotoUploading(false);
        setUploadProgress('');
      }
    }
  };

  const handleExtraPhotosSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setExtraPhotosUploading(true);
      setUploadProgress('0%');
      triggerHaptic('light');
      try {
        const uploadedUrls: string[] = [];
        const fileList = Array.from(files) as File[];
        for (let idx = 0; idx < fileList.length; idx++) {
          const file = fileList[idx];
          const publicUrl = await performDetailedUpload(file);
          uploadedUrls.push(publicUrl);
        }
        setExtraPhotosUrls(prev => [...prev, ...uploadedUrls]);
        triggerHaptic('success');
      } catch (err: any) {
        console.error('Gallery select raw upload failed:', err);
        setErrorMsg('Échec de la galerie multi-photos.');
        setTimeout(() => setErrorMsg(''), 4500);
      } finally {
        setExtraPhotosUploading(false);
        setUploadProgress('');
      }
    }
  };

  // Submit product creation to local storage
  const handleCreateProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) {
      setErrorMsg('Désignation et description requises.');
      setTimeout(() => setErrorMsg(''), 4000);
      return;
    }

    if (mainVideoUploading || mainPhotoUploading || extraPhotosUploading) {
      setErrorMsg('Veuillez patienter, des fichiers sont en cours de téléversement...');
      setTimeout(() => setErrorMsg(''), 4000);
      return;
    }

    setIsSubmitting(true);
    triggerHaptic('heavy');

    try {
      const uId = `omerta-custom-${Date.now()}`;
      const freshProd: VideoItem = {
        id: uId,
        title: newTitle.toUpperCase(),
        description: newDesc,
        price: Number(newPrice),
        pricePerGram: Number(newPrice),
        currency: 'EUR',
        category: newCategory,
        displayZone: newDisplayZone || undefined,
        isPremium: true,
        isFeatured: isFeatured,
        author: newAuthor.toUpperCase() || 'OMERTA 47',
        views: Math.floor(Math.random() * 1200) + 250,
        duration: '0:15',
        videoUrl: videoPreviewUrl || '',
        thumbnailUrl: photoPreviewUrl || '/input_file_2.png',
        additionalPhotos: extraPhotosUrls,
        badge: newBadgeType === 'NONE' ? undefined : (newBadgeType === 'PROMO' ? newBadgePromo : newBadgeType),
        wholesalePrice: Number(newWholesalePrice) || undefined
      };

      // Call addProduct directly as clear JSON payload (no blobs anymore, no base64 parsing!)
      await addProduct(freshProd);

      triggerHaptic('success');
      setSuccessMsg(`"${newTitle}" a été créé avec succès et tarifé à ${newPrice} €.`);
      setErrorMsg('');
      
      // Reset variables
      setNewTitle('');
      setNewDesc('');
      setNewPrice(350);
      setNewWholesalePrice(0);
      setNewDisplayZone('');
      setVideoPreviewUrl('');
      setPhotoPreviewUrl('');
      setExtraPhotosUrls([]);
      setNewBadgeType('NONE');
      setNewBadgePromo('-10%');

      await onRefreshProducts();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error('Core product creation save failing', err);
      setErrorMsg(err.message || 'Échec de la sauvegarde...');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = (p: VideoItem) => {
    triggerHaptic('light');
    setEditingProduct({ ...p });
    const form = document.getElementById('edit-form-anchor');
    if (form) form.scrollIntoView({ behavior: 'smooth' });
  };

  const handleUpdateProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setIsSubmitting(true);
    triggerHaptic('heavy');

    try {
      await addProduct(editingProduct);
      triggerHaptic('success');
      setSuccessMsg(`"${editingProduct.title}" mis à jour.`);
      setEditingProduct(null);
      await onRefreshProducts();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erreur lors de la mise à jour...');
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeDeleteProduct = async (id: string, label: string) => {
    try {
      await deleteProduct(id);
      triggerHaptic('success');
      setSuccessMsg(`"${label}" a été supprimé.`);
      setConfirmingDeleteId(null);
      await onRefreshProducts();
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err) {
      console.error(err);
      setErrorMsg('Erreur lors du retrait.');
    }
  };

  // Order state alteration handlers
  const handleModifyOrderStatus = async (orderId: string, status: 'pending' | 'completed' | 'cancelled') => {
    triggerHaptic('medium');
    try {
      await updateOrderStatus(orderId, status);
      await loadOrdersJournal();
      setSuccessMsg('Mise à jour du statut de la commande enregistrée !');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
      setErrorMsg('Impossible de modifier le statut de la commande.');
    }
  };

  const handlePurgeOrder = async (orderId: string) => {
    triggerHaptic('warning');
    try {
      await deleteOrder(orderId);
      await loadOrdersJournal();
      setConfirmingOrderDeleteId(null);
      setSuccessMsg('Commande purgée des archives.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
      setErrorMsg('Erreur de purge.');
    }
  };

  // Security Lockout / Whitelist Verification Prompt (No admin tools visible to non-whitelisted accounts)
  if (!isWhitelisted) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/95 backdrop-blur-md p-4 flex items-center justify-center">
        <div className="w-full max-w-md mx-4 p-8 rounded-2xl bg-[#090909] border border-red-900/40 text-center space-y-5 shadow-2xl relative select-none">
          <div className="absolute top-3 left-4 bg-black px-2.5 py-0.5 rounded text-[7px] tracking-widest text-[#D4AF37] border border-white/5 font-mono">
            SECURE PORTAL
          </div>
          <Lock className="w-10 h-10 text-[#D4AF37] mx-auto animate-pulse mt-3" />
          <div className="space-y-1">
            <h3 className="font-display font-medium text-xs tracking-[0.2em] text-[#F5EFEB] uppercase leading-none">
              ACCÈS RÉSERVÉ ET RESTREINT
            </h3>
            <p className="text-[8px] text-gray-500 font-mono uppercase tracking-widest mt-1">
              Vérification de Whitelist Automatique
            </p>
          </div>

          <div className="p-4 rounded-xl bg-black border border-zinc-900 text-left space-y-2 font-mono text-[9px] text-gray-400">
            <div>
              <span className="text-[#D4AF37] font-bold">STATUT ACCÈS :</span> NON AUTORISÉ
            </div>
            <div>
              <span className="text-white font-bold">VOTRE ID TELEGRAM :</span> {tgUser?.id || 'INCONNU'}
            </div>
            {tgUser?.username && (
              <div>
                <span className="text-white font-bold">NOM D'UTILISATEUR :</span> @{tgUser.username}
              </div>
            )}
            <div className="h-[1px] bg-neutral-900 my-2" />
            <div className="text-[8px] text-zinc-500 leading-normal uppercase">
              ⚠️ Cet ID n'est pas enregistré dans l'infrastructure de la réserve 👽⛰️ALIENS FARMS OFFICIEL⛰️👽. Veuillez demander au propriétaire principal d'ajouter votre ID Telegram ci-dessus à la Whitelist pour accorder l'accès complet instantanément.
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-gray-400 text-[9px] font-mono tracking-widest uppercase transition duration-300 cursor-pointer shadow-md"
          >
            RETOUR AU STORE 👽⛰️ALIENS FARMS OFFICIEL⛰️👽
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/95 backdrop-blur-md p-2 sm:p-6 flex items-start justify-center">
      <div className="w-full max-w-6xl my-4 p-4 rounded-2xl bg-[#090909] border border-[#D4AF37]/35 shadow-2xl space-y-5 antialiased relative">
      
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between border-b border-[#222] pb-3.5">
        <div className="flex items-center gap-2.5">
          <Database className="w-4.5 h-4.5 text-[#D4AF37]" />
          <div>
            <h3 className="font-display font-bold text-xs tracking-widest text-[#F5EFEB] uppercase leading-none">
              SECURE RESHAPE CONSOLE
            </h3>
            <p className="text-[9px] font-mono text-[#C5A880] mt-1">
              {tgUser ? `LOGGÉ EN TANT QU'OWNER • ID ${tgUser.id}` : 'CONNECTÉ VIA CLÉ D\'ACCÈS'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              clearAdminPasswordToken();
              triggerHaptic('warning');
              onClose();
            }}
            className="px-2.5 py-1.5 rounded-lg bg-red-950/80 border border-red-500/50 text-red-400 hover:bg-red-900 hover:text-white text-[9px] font-mono font-bold tracking-wider uppercase transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Déconnecter la session administrateur"
          >
            <Lock className="w-3 h-3 text-red-400" />
            <span>Déconnexion</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#222]/80 border border-white/10 text-gray-400 hover:text-white cursor-pointer transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/25 text-emerald-400 text-[10px] flex items-center gap-2 font-mono">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/25 text-red-400 text-[10px] flex items-center gap-2 font-mono">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ADMIN LEVEL TAB DISPATCHER */}
      <div className="grid grid-cols-4 gap-1 sm:grid-cols-8 bg-[#141414] p-1.5 rounded-xl border border-white/5">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('products');
          }}
          className={`py-2 text-[7.5px] font-mono tracking-wider uppercase rounded-lg font-bold transition-all ${activeTab === 'products' ? 'bg-[#D4AF37] text-black' : 'text-gray-400 hover:text-white bg-transparent'}`}
        >
          PRODUITS ({products.length})
        </button>
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('orders');
            loadOrdersJournal();
          }}
          className={`py-2 text-[7.5px] font-mono tracking-wider uppercase rounded-lg font-bold transition-all flex items-center justify-center gap-0.5 ${activeTab === 'orders' ? 'bg-[#D4AF37] text-black' : 'text-gray-400 hover:text-white bg-transparent'}`}
        >
          <span>CMDES ({orders.length})</span>
        </button>
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('settings');
            loadBrandingSettings();
          }}
          className={`py-2 text-[7.5px] font-mono tracking-wider uppercase rounded-lg font-bold transition-all flex items-center justify-center gap-0.5 ${activeTab === 'settings' ? 'bg-[#D4AF37] text-black' : 'text-gray-400 hover:text-white bg-transparent'}`}
        >
          <span>VISUELS</span>
        </button>
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('whitelist');
            loadWhitelistData();
            loadConnectionLogsData();
            loadPendingApprovalsData();
          }}
          className={`py-2 text-[7.5px] font-mono tracking-wider uppercase rounded-lg font-bold transition-all flex items-center justify-center gap-0.5 ${activeTab === 'whitelist' ? 'bg-[#D4AF37] text-black' : 'text-gray-400 hover:text-white bg-transparent'}`}
        >
          <span>WHITELIST</span>
        </button>
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('broadcast');
            fetchBroadcastStatus();
          }}
          className={`py-2 text-[7.5px] font-mono tracking-wider uppercase rounded-lg font-bold transition-all flex items-center justify-center gap-0.5 ${activeTab === 'broadcast' ? 'bg-[#D4AF37] text-black' : 'text-gray-400 hover:text-white bg-transparent'}`}
        >
          <span>BROADCAST</span>
        </button>
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('vip');
            fetchVipUsers();
          }}
          className={`py-2 text-[7.5px] font-mono tracking-wider uppercase rounded-lg font-bold transition-all flex items-center justify-center gap-0.5 ${activeTab === 'vip' ? 'bg-[#D4AF37] text-black' : 'text-gray-400 hover:text-white bg-transparent'}`}
        >
          <span>VIP</span>
        </button>
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('rewards');
            fetchRewardsData();
          }}
          className={`py-2 text-[7.5px] font-mono tracking-wider uppercase rounded-lg font-bold transition-all flex items-center justify-center gap-0.5 ${activeTab === 'rewards' ? 'bg-[#D4AF37] text-black' : 'text-gray-400 hover:text-white bg-transparent'}`}
        >
          <span>CRA LOYAUTÉ</span>
        </button>
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('promos');
            fetchPromosData();
          }}
          className={`py-2 text-[7.5px] font-mono tracking-wider uppercase rounded-lg font-bold transition-all flex items-center justify-center gap-0.5 ${activeTab === 'promos' ? 'bg-[#D4AF37] text-black' : 'text-gray-400 hover:text-white bg-transparent'}`}
        >
          <span>PROMOS</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        
        {/* TAB A: PRODUCT CATALOG MANAGEMENT */}
        {activeTab === 'products' && (
          <motion.div
            key="tab-products"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* NEW PRODUCT REGISTER */}
            <div className="bg-[#111] p-3 rounded-xl border border-white/5 space-y-3.5">
              <span className="block text-[9px] font-mono text-[#D4AF37] font-extrabold uppercase tracking-widest">
                ＋ INSCRIRE UN NOUVEL ARTICLE (CRA MAROC)
              </span>

              <form onSubmit={handleCreateProduct} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[8px] font-mono text-gray-500 uppercase mb-1">Désignation :</label>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Ex: DRY GOLD SIFT"
                      className="w-full text-xs py-2 px-2.5 rounded-lg bg-black border border-[#222] focus:border-[#D4AF37] outline-none text-white font-mono placeholder-zinc-800 uppercase"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] font-mono text-gray-500 uppercase mb-1">Maison Label :</label>
                    <input
                      type="text"
                      value={newAuthor}
                      onChange={(e) => setNewAuthor(e.target.value)}
                      placeholder="Ex: OMERTA 47"
                      className="w-full text-xs py-2 px-2.5 rounded-lg bg-black border border-[#222] focus:border-[#D4AF37] outline-none text-white font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[8px] font-mono text-gray-500 uppercase mb-1">Catégorie :</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full text-xs py-2 px-2 rounded-lg bg-black border border-[#222] focus:border-[#D4AF37] outline-none text-[#D4AF37] font-mono font-bold uppercase"
                    >
                      <option value="DRY SIFT">DRY SIFT</option>
                      <option value="BELDIA">BELDIA</option>
                      <option value="STATIC">STATIC</option>
                      <option value="FROZEN">FROZEN SIFT</option>
                      <option value="WPFF">WPFF</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[8px] font-mono text-gray-500 uppercase mb-1">Prix de vente (€) :</label>
                    <input
                      type="number"
                      value={newPrice}
                      onChange={(e) => setNewPrice(Number(e.target.value))}
                      className="w-full text-xs py-2 px-2.5 rounded-lg bg-black border border-[#222] focus:border-[#D4AF37] outline-none text-white font-mono"
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[8px] font-mono text-gray-400 uppercase mb-1 flex items-center justify-between">
                    <span>Prix de gros / d'achat grossiste (€) :</span>
                    <span className="text-[#D4AF37] font-extrabold text-[7.5px] tracking-normal">PRO</span>
                  </label>
                  <input
                    type="number"
                    value={newWholesalePrice || ''}
                    onChange={(e) => setNewWholesalePrice(Number(e.target.value))}
                    className="w-full text-xs py-2 px-2.5 rounded-lg bg-black border border-[#222] focus:border-[#D4AF37] outline-none text-white font-mono"
                    placeholder="Saisir le tarif grossiste pour calculer vos marges réelles"
                    min="0"
                  />
                </div>

                 <div>
                   <label className="block text-[8px] font-mono text-gray-500 uppercase mb-1">Zone d'affichage / Section Storefront (Optionnel) :</label>
                   <select
                     value={newDisplayZone}
                     onChange={(e) => setNewDisplayZone(e.target.value)}
                     className="w-full text-xs py-2 px-2.5 rounded-lg bg-black border border-[#222] focus:border-[#D4AF37] outline-none text-white font-mono"
                   >
                     <option value="">Par défaut (suit la catégorie sélectionnée)</option>
                     <option value="TANT DE DEGRÉS D'EXCELLENCE">TANT DE DEGRÉS D'EXCELLENCE</option>
                     <option value="NOS DOUBLES FILTRÉS D'ÉLITE">NOS DOUBLES FILTRÉS D'ÉLITE</option>
                     <option value="NOS SPECIAUX FROZEN SIFT">NOS SPECIAUX FROZEN SIFT</option>
                     <option value="RÉSERVE BELDIA TRADITIONNELLE">RÉSERVE BELDIA TRADITIONNELLE</option>
                   </select>
                 </div>

                 {/* AUTOMATIC CONFIGURATIONS AND TOTAL PREVIEW */}
                 <div className="p-3 bg-[#0a0a0a] rounded-xl border border-zinc-900 space-y-1 font-mono text-[8px] text-gray-500 text-left">
                   <span className="uppercase text-white text-[9px] block mb-1">Informations de tarification (€) :</span>
                   Ce produit sera affiché au tarif fixe et unique de <span className="text-[#D4AF37] font-bold">{newPrice} €</span>. Les frais de livraison sont offerts pour tous les membres du Club Privilégié.
                 </div>

                <div>
                  <label className="block text-[8px] font-mono text-gray-500 uppercase mb-1">Affiche Narrative :</label>
                  <textarea
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Détails de la confection, douceur des fibres, coupe, finitions du liseré..."
                    className="w-full h-14 text-xs p-2 rounded-lg bg-black border border-[#222] focus:border-[#D4AF37] outline-none text-white placeholder-zinc-800"
                    required
                  />
                </div>

                {/* FILE MEDIAS */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="block text-[8px] font-mono text-gray-500 uppercase mb-1">Vidéo Principale</span>
                    <button
                      type="button"
                      disabled={mainVideoUploading}
                      onClick={() => videoInputRef.current?.click()}
                      className="w-full py-2 rounded-lg border border-dashed border-[#222] hover:border-[#D4AF37] bg-black text-gray-400 flex items-center justify-center gap-1 text-[8px] font-mono transition disabled:opacity-50 font-bold"
                    >
                      <Video className="w-3 h-3 text-[#D4AF37]" />
                      <span>{mainVideoUploading ? `En cours (${uploadProgress})...` : 'Téléverser'}</span>
                    </button>
                    <input ref={videoInputRef} type="file" accept="video/*" onChange={handleVideoSelect} className="hidden" />
                    <div className="mt-1">
                      <input
                        type="text"
                        placeholder="Ou coller URL..."
                        value={videoPreviewUrl}
                        onChange={(e) => setVideoPreviewUrl(e.target.value)}
                        className="w-full text-[8px] py-1 px-1.5 rounded bg-black border border-zinc-900 text-white font-mono placeholder-zinc-800"
                      />
                    </div>
                    {videoPreviewUrl && <div className="text-[7px] font-mono text-[#D4AF37] mt-1 max-w-full truncate">✔ Lien actif</div>}
                  </div>

                  <div>
                    <span className="block text-[8px] font-mono text-gray-500 uppercase mb-1">Couverture</span>
                    <button
                      type="button"
                      disabled={mainPhotoUploading}
                      onClick={() => photoInputRef.current?.click()}
                      className="w-full py-2 rounded-lg border border-dashed border-[#222] hover:border-[#D4AF37] bg-black text-gray-400 flex items-center justify-center gap-1 text-[8px] font-mono transition disabled:opacity-50 font-bold"
                    >
                      <Upload className="w-3 h-3 text-[#C5A880]" />
                      <span>{mainPhotoUploading ? `En cours (${uploadProgress})...` : 'Téléverser'}</span>
                    </button>
                    <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
                    <div className="mt-1">
                      <input
                        type="text"
                        placeholder="Ou coller URL..."
                        value={photoPreviewUrl}
                        onChange={(e) => setPhotoPreviewUrl(e.target.value)}
                        className="w-full text-[8px] py-1 px-1.5 rounded bg-black border border-zinc-900 text-white font-mono placeholder-zinc-800"
                      />
                    </div>
                    {photoPreviewUrl && <div className="text-[7px] font-mono text-[#C5A880] mt-1 max-w-full truncate">✔ Lien actif</div>}
                  </div>

                  <div>
                    <span className="block text-[8px] font-mono text-gray-500 uppercase mb-1">Galerie (Multi)</span>
                    <button
                      type="button"
                      disabled={extraPhotosUploading}
                      onClick={() => extraPhotosInputRef.current?.click()}
                      className="w-full py-2 rounded-lg border border-dashed border-[#222] hover:border-[#D4AF37] bg-black text-gray-400 flex items-center justify-center gap-1 text-[8px] font-mono transition disabled:opacity-50 font-bold"
                    >
                      <Plus className="w-3 h-3 text-[#D4AF37]" />
                      <span>{extraPhotosUploading ? `En cours (${uploadProgress})...` : `Photos (${extraPhotosUrls.length})`}</span>
                    </button>
                    <input ref={extraPhotosInputRef} type="file" accept="image/*" multiple onChange={handleExtraPhotosSelect} className="hidden" />
                    <div className="mt-1 flex gap-1">
                      <input
                        type="text"
                        placeholder="Autre URL (Entrée)..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = e.currentTarget.value.trim();
                            if (val) {
                              setExtraPhotosUrls(prev => [...prev, val]);
                              e.currentTarget.value = '';
                            }
                          }
                        }}
                        className="w-full text-[8px] py-1 px-1.5 rounded bg-black border border-zinc-900 text-white font-mono placeholder-zinc-800"
                      />
                    </div>
                    {extraPhotosUrls.length > 0 && (
                      <div className="mt-1 text-[7px] font-mono text-[#D4AF37] space-y-0.5">
                        <div className="truncate">✔ {extraPhotosUrls.length} photo(s) prêtes</div>
                        <button
                          type="button"
                          onClick={() => setExtraPhotosUrls([])}
                          className="text-red-500 hover:text-red-400 underline block text-[6.5px] uppercase cursor-pointer"
                        >
                          Vider galerie
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Guidelines Codecs Compatibility on iOS / Telegram */}
                <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/35 rounded-lg p-3 text-left text-[8.5px] font-mono leading-relaxed space-y-1.5 text-zinc-300">
                  <span className="text-[#D4AF37] block font-extrabold text-center uppercase tracking-wider">⚠️ PERMANENCE ET STABILITÉ DES MÉDIAS</span>
                  <p>
                    L'hébergement de cette application s'exécute dans un container éphémère (Sandbox Cloud Run) sécurisé. <strong className="text-white">Chaque fois que le projet redémarre (recompilation, inactivité ou mise à jour), les fichiers importés localement de façon classique se suppriment d'eux-mêmes automatiquement de l'espace temporaire du serveur.</strong>
                  </p>
                  <p>
                    <strong className="text-[#D4AF37] font-bold">💎 SOLUTION PERMANENTE RECOMMANDÉE :</strong> Au lieu d'importer directement vos fichiers locaux, privilégiez le copier/coller de <strong className="text-white">liens URL directs permanents</strong> (provenant d'hébergeurs de confiance stables comme <strong className="text-[#D4AF37] font-bold">Catbox, Imgur, Discord, Youtube, Telegram CDN</strong>, etc.) dans les zones de saisie textuelles "<strong className="text-white">Ou coller URL...</strong>" ci-dessus. Ces médias externes ne disparaîtront jamais, assurant un affichage définitif impeccable pour tous vos clients VIP !
                  </p>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[8px] font-mono text-gray-500 uppercase mb-1">Statut Produit :</label>
                      <select
                        id="new-badge-type-select"
                        value={newBadgeType}
                        onChange={(e) => setNewBadgeType(e.target.value)}
                        className="w-full text-xs py-2 px-2 rounded-lg bg-black border border-[#222] focus:border-[#D4AF37] outline-none text-[#D4AF37] font-mono font-bold uppercase"
                      >
                        <option value="NONE">Aucun (Par défaut)</option>
                        <option value="IN_STOCK">🟢 IN STOCK</option>
                        <option value="LAST">🟠 LAST</option>
                        <option value="OUT">🔴 OUT OF STOCK</option>
                        <option value="PROMO">🏷️ PROMO (Personnalisé)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[8px] font-mono text-gray-500 uppercase mb-1">Mettre à la une :</label>
                      <button
                        id="new-is-featured-btn"
                        type="button"
                        onClick={() => setIsFeatured(!isFeatured)}
                        className={`w-full py-2 px-3 rounded-lg text-xs font-mono uppercase tracking-wide border text-center ${isFeatured ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#D4AF37]' : 'bg-black border-[#222] text-gray-500'}`}
                      >
                        {isFeatured ? '★ Vedette active' : 'Non'}
                      </button>
                    </div>
                  </div>

                  {newBadgeType === 'PROMO' && (
                    <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                      <label className="block text-[8px] font-mono text-[#D4AF37] uppercase mb-1">Valeur de la promotion (ex: -12%, -20%) :</label>
                      <input
                        id="new-badge-promo-input"
                        type="text"
                        value={newBadgePromo}
                        onChange={(e) => setNewBadgePromo(e.target.value)}
                        placeholder="-12%"
                        className="w-full text-xs py-2 px-3 rounded-lg bg-black border border-[#D4AF37]/45 focus:border-[#D4AF37] outline-none text-[#D4AF37] font-mono font-bold uppercase"
                      />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-white text-black font-extrabold text-[9px] tracking-widest uppercase hover:bg-[#D4AF37] transition duration-300 cursor-pointer"
                >
                  {isSubmitting ? 'ENREGISTREMENT...' : 'PUBLIER SUR L\'EXPOSITION'}
                </button>
              </form>
            </div>

            {/* CATALOG LIST */}
            <div id="edit-form-anchor" className="space-y-2">
              <span className="block text-[9px] font-mono text-gray-500 uppercase tracking-widest">ARTICLES EXPOSÉS :</span>
              {products.map((p) => (
                <div key={p.id} className="p-2 bg-[#121212] rounded-xl border border-white/5 flex items-center justify-between gap-3 font-mono">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {p.thumbnailUrl && p.thumbnailUrl.trim() !== '' ? (
                      <img src={p.thumbnailUrl || undefined} alt={p.title} className="w-8 h-8 rounded-lg object-cover bg-black" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-neutral-800 flex items-center justify-center text-[7px] text-zinc-600 font-bold uppercase">N/A</div>
                    )}
                    <div className="min-w-0">
                      <h5 className="text-[10px] font-extrabold text-white truncate uppercase">{p.title}</h5>
                      <span className="text-[8px] text-[#C5A880] block leading-relaxed">
                        {p.category} • Vente: <span className="text-[#D4AF37]">{p.price || p.pricePerGram || 0} €</span>
                        {p.wholesalePrice !== undefined && p.wholesalePrice !== null && Number(p.wholesalePrice) > 0 && (
                          <span className="text-zinc-500 block text-[7.5px]">
                            Achat: <span className="text-zinc-400">{p.wholesalePrice} €</span> • Marge: <span className="text-emerald-500 font-extrabold">{(p.price || p.pricePerGram || 0) - p.wholesalePrice} €</span>
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  {confirmingDeleteId === p.id ? (
                    <div className="flex items-center gap-1 bg-red-950/20 p-1 rounded-lg border border-red-500/20">
                      <button
                        type="button"
                        onClick={() => executeDeleteProduct(p.id, p.title)}
                        className="px-2 py-0.5 rounded bg-red-600 text-[8px] font-bold text-white cursor-pointer"
                      >
                        Sûr?
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingDeleteId(null)}
                        className="px-2 py-0.5 rounded bg-zinc-800 text-[8px] text-gray-300 cursor-pointer"
                      >
                        Non
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEditing(p)}
                        className="p-1 rounded bg-zinc-900 border border-[#222] text-gray-400 hover:text-[#D4AF37] cursor-pointer"
                        title="Modifier"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingDeleteId(p.id)}
                        className="p-1 rounded bg-red-950/20 border border-red-950/45 text-red-500 hover:bg-red-500 hover:text-black cursor-pointer"
                        title="Détruire"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* EDIT MODAL EXPANDED OR INLINE */}
            {editingProduct && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-xl bg-gradient-to-tr from-black to-[#0a0a0a] border border-[#D4AF37] space-y-3 font-mono"
              >
                <div className="flex justify-between border-b border-[#222] pb-1.5">
                  <span className="text-[9px] text-[#D4AF37] font-bold uppercase">Modifier: {editingProduct.title}</span>
                  <div className="flex items-center gap-2">
                    {confirmingDeleteId === editingProduct.id ? (
                      <div className="flex items-center gap-1 bg-red-950/40 px-1.5 py-0.5 rounded border border-red-500/30">
                        <span className="text-[8px] text-red-400 font-bold uppercase">Supprimer ?</span>
                        <button
                          type="button"
                          onClick={() => {
                            executeDeleteProduct(editingProduct.id, editingProduct.title);
                            setEditingProduct(null);
                          }}
                          className="px-1.5 py-0.5 rounded bg-red-600 text-[8px] font-bold text-white cursor-pointer hover:bg-red-500"
                        >
                          Oui, supprimer
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingDeleteId(null)}
                          className="px-1.5 py-0.5 rounded bg-zinc-800 text-[8px] text-gray-300 cursor-pointer"
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmingDeleteId(editingProduct.id)}
                        className="px-2 py-0.5 rounded bg-red-950/30 border border-red-500/30 text-red-400 hover:bg-red-600 hover:text-white text-[8px] font-bold uppercase cursor-pointer transition flex items-center gap-1"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                        Supprimer
                      </button>
                    )}
                    <button type="button" onClick={() => setEditingProduct(null)} className="text-gray-500 text-[8px] hover:text-white cursor-pointer">[ FERMER ]</button>
                  </div>
                </div>

                <form onSubmit={handleUpdateProduct} className="space-y-3">
                  <div>
                    <label className="block text-[8px] text-gray-500">TITRE :</label>
                    <input
                      type="text"
                      value={editingProduct.title}
                      onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value.toUpperCase() })}
                      className="w-full text-xs p-2 bg-black border border-[#222] text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[8px] text-gray-500">PRIX DE VENTE (€) :</label>
                      <input
                        type="number"
                        value={editingProduct.pricePerGram || editingProduct.price || ''}
                        onChange={(e) => {
                          const num = Number(e.target.value);
                          setEditingProduct({
                            ...editingProduct,
                            price: num,
                            pricePerGram: num
                          });
                        }}
                        className="w-full text-xs p-2 bg-black border border-[#222] text-white font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] text-gray-500">CATÉGORIE :</label>
                      <select
                        value={editingProduct.category}
                        onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                        className="w-full text-xs p-1.5 bg-black border border-[#222] text-[#D4AF37] font-mono font-bold uppercase"
                      >
                        <option value="DRY SIFT">DRY SIFT</option>
                        <option value="BELDIA">BELDIA</option>
                        <option value="STATIC">STATIC</option>
                        <option value="FROZEN">FROZEN SIFT</option>
                        <option value="WPFF">WPFF</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[8px] text-gray-400">PRIX DE GROS / D'ACHAT GROSSISTE (€) :</label>
                    <input
                      type="number"
                      value={editingProduct.wholesalePrice || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, wholesalePrice: Number(e.target.value) })}
                      className="w-full text-xs p-2 bg-black border border-[#222] text-white font-mono"
                      placeholder="Tarif d'achat d'un grossiste"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[8px] text-gray-500">PROVENANCE / MAISON :</label>
                      <input
                        type="text"
                        value={editingProduct.author || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, author: e.target.value })}
                        className="w-full text-xs p-2 bg-black border border-[#222] text-white"
                        placeholder="Ex: OMERTA 47"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] text-gray-500">DESCRIPTION DU PRODUIT :</label>
                      <textarea
                        value={editingProduct.description || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                        className="w-full text-xs p-1.5 bg-black border border-[#222] text-white h-[38px] resize-none"
                        placeholder="Arômes, saveurs, effets..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[8px] text-zinc-500 uppercase">ZONE D'AFFICHAGE / SECTION STOREFRONT (OPTIONNEL) :</label>
                    <select
                      value={editingProduct.displayZone || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, displayZone: e.target.value || undefined })}
                      className="w-full text-xs p-1.5 bg-black border border-[#222] text-white"
                    >
                      <option value="">Par défaut (suit la catégorie)</option>
                      <option value="COLLECTIONS PRIVÉES">COLLECTIONS PRIVÉES</option>
                      <option value="MEET UP RABAT">MEET UP RABAT</option>
                      <option value="WPFF">WPFF</option>
                      <option value="BELDIA">BELDIA</option>
                      <option value="FROZEN">FROZEN SIFT</option>
                      <option value="STATIC">STATIC</option>
                      <option value="ACCESSOIRES">ACCESSOIRES</option>
                    </select>
                  </div>

                  {(() => {
                    const { type: editBadgeType, promo: editBadgePromo } = getBadgeTypeAndValue(editingProduct.badge);
                    return (
                      <div className="space-y-2 border border-white/5 bg-zinc-950/40 p-2 rounded-lg">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[8px] text-zinc-500 uppercase font-mono mb-1">Statut Produit :</label>
                            <select
                              value={editBadgeType}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === 'NONE') {
                                  setEditingProduct({ ...editingProduct, badge: undefined });
                                } else if (val === 'IN_STOCK') {
                                  setEditingProduct({ ...editingProduct, badge: 'IN_STOCK' });
                                } else if (val === 'LAST') {
                                  setEditingProduct({ ...editingProduct, badge: 'LAST' });
                                } else if (val === 'OUT_OF_STOCK') {
                                  setEditingProduct({ ...editingProduct, badge: 'OUT_OF_STOCK' });
                                } else if (val === 'PROMO') {
                                  setEditingProduct({ ...editingProduct, badge: '-10%' });
                                }
                              }}
                              className="w-full text-xs p-2 bg-black border border-[#222] text-[#D4AF37] font-mono font-bold uppercase outline-none focus:border-[#D4AF37] rounded"
                            >
                              <option value="NONE">Aucun (Par défaut)</option>
                              <option value="IN_STOCK">🟢 IN STOCK</option>
                              <option value="LAST">🟠 LAST</option>
                              <option value="OUT_OF_STOCK">🔴 OUT OF STOCK</option>
                              <option value="PROMO">🏷️ PROMO (Personnalisé)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[8px] text-zinc-500 uppercase font-mono mb-1">METTRE À LA UNE (VEDETTE) :</label>
                            <button
                              type="button"
                              onClick={() => setEditingProduct({ ...editingProduct, isFeatured: !editingProduct.isFeatured })}
                              className={`w-full py-2 px-3 text-center border text-[8px] font-mono uppercase tracking-wide cursor-pointer rounded ${editingProduct.isFeatured ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#D4AF37]' : 'bg-black border-[#222] text-gray-500'}`}
                            >
                              {editingProduct.isFeatured ? '★ VEDETTE ACTIVE' : 'NON'}
                            </button>
                          </div>
                        </div>

                        {editBadgeType === 'PROMO' && (
                          <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                            <label className="block text-[8px] font-mono text-[#D4AF37] uppercase mb-1 font-bold">Valeur de la promotion (ex: -12%, -25%) :</label>
                            <input
                              type="text"
                              value={editBadgePromo}
                              onChange={(e) => setEditingProduct({ ...editingProduct, badge: e.target.value })}
                              placeholder="-12%"
                              className="w-full text-xs py-2 px-3 rounded bg-black border border-[#D4AF37]/45 focus:border-[#D4AF37] outline-none text-[#D4AF37] font-mono font-bold uppercase"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* FILE MEDIAS EDIT */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="block text-[8px] font-mono text-gray-500 uppercase mb-1">Modifier Vidéo</span>
                      <button
                        type="button"
                        disabled={editVideoUploading}
                        onClick={() => editVideoInputRef.current?.click()}
                        className="w-full py-1.5 rounded bg-black border border-dashed border-[#222] hover:border-[#D4AF37] text-gray-400 text-[8px] font-mono transition flex flex-col items-center justify-center disabled:opacity-50"
                      >
                        <span className="text-[#D4AF37]">{editVideoUploading ? `En cours (${uploadProgress})...` : 'Téléverser'}</span>
                        {editVideoUploading ? (
                          <span className="text-[7px] text-yellow-500 animate-pulse">Envoi en cours...</span>
                        ) : editingProduct.videoUrl ? (
                          <span className="text-[7px] text-green-500">✔ Disponible</span>
                        ) : (
                          <span className="text-[7px] text-gray-600">Aucune</span>
                        )}
                      </button>
                      <input ref={editVideoInputRef} type="file" accept="video/*" onChange={handleEditVideoSelect} className="hidden" />
                      <div className="mt-1">
                        <input
                          type="text"
                          placeholder="Ou URL directe..."
                          value={editingProduct.videoUrl || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, videoUrl: e.target.value })}
                          className="w-full text-[8px] py-1 px-1.5 rounded bg-black border border-zinc-900 text-white font-mono placeholder-zinc-800"
                        />
                      </div>
                    </div>

                    <div>
                      <span className="block text-[8px] font-mono text-gray-500 uppercase mb-1">Modifier Image</span>
                      <button
                        type="button"
                        disabled={editPhotoUploading}
                        onClick={() => editPhotoInputRef.current?.click()}
                        className="w-full py-1.5 rounded bg-black border border-dashed border-[#222] hover:border-[#D4AF37] text-gray-400 text-[8px] font-mono transition flex flex-col items-center justify-center relative overflow-hidden disabled:opacity-50"
                      >
                        {editingProduct.thumbnailUrl && editingProduct.thumbnailUrl.trim() !== '' && !editingProduct.thumbnailUrl.startsWith('data:') ? (
                          <img src={editingProduct.thumbnailUrl || undefined} className="absolute inset-0 w-full h-full object-cover opacity-20" alt="" />
                        ) : null}
                        <span className="text-[#D4AF37] relative z-10">{editPhotoUploading ? `En cours (${uploadProgress})...` : 'Téléverser'}</span>
                        {editPhotoUploading ? (
                          <span className="text-[7px] text-yellow-500 relative z-10 animate-pulse">Envoi en cours...</span>
                        ) : editingProduct.thumbnailUrl ? (
                          <span className="text-[7px] text-green-500 relative z-10">✔ Disponible</span>
                        ) : (
                          <span className="text-[7px] text-gray-600 relative z-10">Aucune</span>
                        )}
                      </button>
                      <input ref={editPhotoInputRef} type="file" accept="image/*" onChange={handleEditPhotoSelect} className="hidden" />
                      <div className="mt-1">
                        <input
                          type="text"
                          placeholder="Ou URL directe..."
                          value={editingProduct.thumbnailUrl || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, thumbnailUrl: e.target.value })}
                          className="w-full text-[8px] py-1 px-1.5 rounded bg-black border border-zinc-900 text-white font-mono placeholder-zinc-800"
                        />
                      </div>
                    </div>

                    <div>
                      <span className="block text-[8px] font-mono text-gray-500 uppercase mb-1">Galerie Photos</span>
                      <button
                        type="button"
                        disabled={editExtraPhotosUploading}
                        onClick={() => editExtraPhotosInputRef.current?.click()}
                        className="w-full py-1.5 rounded bg-black border border-dashed border-[#222] hover:border-[#D4AF37] text-gray-400 text-[8px] font-mono transition flex flex-col items-center justify-center disabled:opacity-50"
                      >
                        <span className="text-[#D4AF37]">{editExtraPhotosUploading ? `En cours (${uploadProgress})...` : 'Téléverser'}</span>
                        <span className="text-[7px] text-gray-500">{(editingProduct.additionalPhotos || []).length} photos</span>
                      </button>
                      <input ref={editExtraPhotosInputRef} type="file" accept="image/*" multiple onChange={handleEditExtraPhotosSelect} className="hidden" />
                      <div className="mt-1 flex gap-1">
                        <input
                          type="text"
                          placeholder="Autre URL (Entrée)..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const val = e.currentTarget.value.trim();
                              if (val) {
                                const currentList = editingProduct.additionalPhotos || [];
                                setEditingProduct({
                                  ...editingProduct,
                                  additionalPhotos: [...currentList, val]
                                });
                                e.currentTarget.value = '';
                              }
                            }
                          }}
                          className="w-full text-[8px] py-1 px-1.5 rounded bg-black border border-zinc-900 text-white font-mono placeholder-zinc-800"
                        />
                      </div>
                      {(editingProduct.additionalPhotos || []).length > 0 && (
                        <button
                          type="button"
                          onClick={() => setEditingProduct({ ...editingProduct, additionalPhotos: [] })}
                          className="text-red-500 hover:text-red-400 underline block text-[6.5px] uppercase mt-1 cursor-pointer"
                        >
                          Vider galerie
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Guidelines Codecs Compatibility on iOS / Telegram */}
                  <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/35 rounded-lg p-2.5 text-left text-[8px] font-mono leading-relaxed space-y-1 text-zinc-300">
                    <span className="text-[#D4AF37] block font-extrabold text-center uppercase">⚠️ STABILITÉ DE L'EXPOSITION</span>
                    <p>
                      Privilégiez la saisie de <strong className="text-white">liens URL externes directs</strong> (provenant d'Imgur ou Catbox) de vos médias afin de garantir leur persistance complète même après les redémarrages ou recompilations automatisés du serveur Cloud Run !
                    </p>
                  </div>

                  {/* Quantity options edit-preview */}
                  <div className="p-3 bg-[#0a0a0a] rounded-lg border border-zinc-900 space-y-1 font-mono text-[8px] text-gray-500">
                    <span className="uppercase text-white text-[9px] block mb-1">Détails de Tarification :</span>
                    Ce produit sera affiché sur le catalogue avec un prix de vente fixe et unique de <span className="text-[#D4AF37] font-bold">{editingProduct.price || 0} €</span>. Les frais d'expédition sont offerts sur l'ensemble de la boutique.
                  </div>
                  <button type="submit" className="w-full py-2 bg-[#D4AF37] text-black font-extrabold text-[9px] uppercase">
                    Sauvegarder
                  </button>
                </form>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* TAB B: CUSTOMER ORDERS LIST AND CONTROLLER */}
        {activeTab === 'orders' && (
          <motion.div
            key="tab-orders"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">REGISTRE DES EXPÉDITIONS :</span>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  loadOrdersJournal();
                }}
                className="text-[8px] font-mono bg-[#111] hover:bg-[#222] px-2.5 py-1 rounded border border-white/5 text-[#D4AF37] uppercase"
              >
                Rafraîchir
              </button>
            </div>

            {loadingOrders ? (
              <div className="py-12 text-center text-[10px] font-mono text-gray-600 animate-pulse">Chargement du journal des ventes...</div>
            ) : orders.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-[#222] rounded-2xl">
                <FileSpreadsheet className="w-8 h-8 text-[#D4AF37]/10 mx-auto" />
                <p className="text-[9px] text-gray-500 font-mono uppercase tracking-widest mt-2">Aucune commande enregistrée au Maroc à ce jour.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto scrollbar-none pr-0.5">
                {orders.map((o) => {
                  return (
                    <div 
                      key={o.id} 
                      className={`p-3.5 rounded-xl bg-[#111] border font-mono text-[9px] space-y-2 transition ${o.status === 'completed' ? 'border-emerald-500/20 bg-emerald-950/5' : o.status === 'cancelled' ? 'border-red-950/30' : 'border-[#D4AF37]/20 bg-[#121212]'}`}
                    >
                      {/* Order top line */}
                      <div className="flex justify-between items-start border-b border-[#222] pb-2">
                        <div>
                          <span className="text-[#D4AF37] font-bold block">{o.id}</span>
                          <span className="text-gray-500 text-[8px]">{new Date(o.date).toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        {/* Status tag */}
                        <div className="flex gap-1.5 items-center">
                          <span className={`px-2 py-0.5 rounded text-[7.5px] font-bold uppercase ${o.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : o.status === 'cancelled' ? 'bg-red-950 text-red-400' : 'bg-amber-500/10 text-amber-500'}`}>
                            {o.status === 'completed' ? 'LIVRÉE' : o.status === 'cancelled' ? 'ANNULÉE' : 'EN ATTENTE'}
                          </span>
                        </div>
                      </div>

                      {/* Customer metrics */}
                      <div className="space-y-1 text-gray-400">
                        <div>Client : <span className="text-[#F5EFEB] font-sans font-bold text-[10px]">{o.customerName}</span></div>
                        <div className="flex items-center gap-1">Téléphone : <span className="text-[#F5EFEB] cursor-text">{o.phoneNumber}</span></div>
                        <div>Ville : <span className="text-white font-sans">{o.city}</span></div>
                        <div className="leading-relaxed">Adresse : <span className="text-[#f5efe9] font-sans">{o.address}</span></div>
                        <div>
                          Paiement : <span className="text-white">
                            {o.paymentMethod === 'cod' ? '💵 Cash à la livraison' : o.paymentMethod === 'postal' ? '📮 Remboursement postal' : `🏦 Virement (${o.bankName})`}
                          </span>
                        </div>
                      </div>

                      {/* Ordered Articles shelf */}
                      <div className="bg-black/40 p-2.5 rounded-lg border border-white/5 space-y-1">
                        <span className="text-[7.5px] text-gray-500 uppercase leading-none block mb-1">Articles commandés :</span>
                        {o.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-white text-[8.5px]">
                            <span className="truncate pr-2">
                              • {item.quantity > 1 ? `${item.quantity}x ` : ''}{item.title} {item.selectedSize ? `(${item.selectedSize})` : ''}
                            </span>
                            <span className="shrink-0 text-[#C5A880]">{item.price} €</span>
                          </div>
                        ))}
                        <div className="border-t border-[#222] mt-1.5 pt-1.5 flex justify-between font-extrabold text-[9.5px]">
                          <span className="text-[#C5A880]">MONTANT NET :</span>
                          <span className="text-[#D4AF37]">{o.totalAmount} €</span>
                        </div>
                      </div>

                      {/* STATUS OR PURGE WORK TOOLS */}
                      <div className="flex justify-between items-center gap-2 pt-1 border-t border-[#222]">
                        {/* Status switcher */}
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => handleModifyOrderStatus(o.id, 'completed')}
                            className="bg-emerald-950/60 border border-emerald-800/20 hover:bg-emerald-400 hover:text-black text-emerald-400 p-1.5 rounded transition"
                            title="Marquer comme Livrée"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleModifyOrderStatus(o.id, 'cancelled')}
                            className="bg-red-950/40 border border-red-800/10 hover:bg-red-500 hover:text-white text-red-400 p-1.5 rounded transition"
                            title="Annuler"
                          >
                            <Ban className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Permanent Order Delete */}
                        {confirmingOrderDeleteId === o.id ? (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handlePurgeOrder(o.id)}
                              className="px-2 py-1 rounded bg-red-650 text-white text-[8px] font-bold uppercase cursor-pointer"
                            >
                              Oui purger
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmingOrderDeleteId(null)}
                              className="px-2 py-1 rounded bg-zinc-800 text-gray-400 text-[8px] cursor-pointer"
                            >
                              Non
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmingOrderDeleteId(o.id)}
                            className="text-[8px] text-red-500/70 hover:text-red-400 underline font-mono cursor-pointer"
                          >
                            Purger la commande
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* TAB C: BRANDING CUSTOMIZATION PANEL */}
        {activeTab === 'settings' && (
          <motion.div
            key="tab-settings"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="bg-[#111] p-3.5 rounded-xl border border-white/5 space-y-4">
              <div>
                <span className="block text-[9px] font-mono text-[#D4AF37] font-extrabold uppercase tracking-widest">
                  🎨 PERSONNALISATION DES VISUELS DE MARQUE & ACCÈS
                </span>
                <p className="text-[8px] font-mono text-zinc-500 mt-0.5 leading-normal">
                  Modifiez les fonds d'écran, logos et contrôlez l'activation globale de l'application.
                </p>
              </div>

              {/* App Activity Toggle Switch */}
              <div className="bg-black/90 border border-amber-500/30 p-3 rounded-xl space-y-2 shadow-inner">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="block text-xs font-mono text-amber-400 font-extrabold uppercase tracking-wider">
                      🔌 ÉTAT GLOBAL DE L'APPLICATION
                    </span>
                    <span className="text-[10px] text-neutral-400 block mt-0.5">
                      Éteint l'application pour tous les utilisateurs (affiche un écran noir hors-ligne).
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newStatus = !settings.appDisabled;
                      setBrandingSettings(prev => ({ ...prev, appDisabled: newStatus }));
                      triggerHaptic('heavy');
                    }}
                    className={`px-3 py-2 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition cursor-pointer shrink-0 flex items-center gap-2 border ${
                      settings.appDisabled
                        ? 'bg-red-950/90 border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                        : 'bg-emerald-950/90 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${settings.appDisabled ? 'bg-red-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`} />
                    <span>{settings.appDisabled ? '🔴 APPLICATION ÉTEINTE' : '🟢 APPLICATION ALLUMÉE'}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3 font-mono text-[9px]">
                {/* Intro Screen Background */}
                <div className="space-y-1">
                  <label className="text-gray-400 block font-bold mb-1">IMAGE / VIDÉO DE FOND CHANNELS (INTRO ANIME / CANVAS DE FOND) :</label>
                  <input
                    type="text"
                    value={settings.introBgUrl || ''}
                    onChange={(e) => setBrandingSettings({ ...settings, introBgUrl: e.target.value })}
                    placeholder="Lien URL de l'image/vidéo (ex: Pixeldrain) ou Base64"
                    className="w-full text-[9px] py-1.5 px-2.5 rounded bg-black border border-[#222] focus:border-[#D4AF37] text-white outline-none"
                  />
                  <div className="flex gap-2 mt-1">
                    <button
                      type="button"
                      disabled={uploadingIntro}
                      onClick={() => {
                        const fileInput = document.createElement('input');
                        fileInput.type = 'file';
                        fileInput.accept = 'image/*,video/*';
                        fileInput.onchange = async (e: any) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setUploadingIntro(true);
                            setUploadProgress('0%');
                            triggerHaptic('medium');
                            try {
                              const publicUrl = await performDetailedUpload(file);
                              setBrandingSettings(prev => ({ ...prev, introBgUrl: publicUrl }));
                              triggerHaptic('success');
                            } catch (err) {
                              console.error('Intro upload error:', err);
                              setErrorMsg('Erreur de téléversement...');
                              setTimeout(() => setErrorMsg(''), 4000);
                            } finally {
                              setUploadingIntro(false);
                              setUploadProgress('');
                            }
                          }
                        };
                        fileInput.click();
                      }}
                      className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded font-bold text-[8px] text-[#C5A880] hover:text-white transition cursor-pointer disabled:opacity-50"
                    >
                      {uploadingIntro ? `Téléversement (${uploadProgress})...` : 'Uploader image/vidéo'}
                    </button>
                    {settings.introBgUrl && (
                      <button
                        type="button"
                        onClick={() => setBrandingSettings({ ...settings, introBgUrl: '' })}
                        className="text-red-500 hover:text-red-400 text-[8px] cursor-pointer"
                      >
                        Effacer
                      </button>
                    )}
                  </div>
                  {settings.introBgUrl && settings.introBgUrl.trim() !== '' ? (
                    <div className="mt-2 w-full h-24 rounded-lg overflow-hidden border border-zinc-900 bg-black relative">
                      {isVideoUrl(settings.introBgUrl) ? (
                        <video src={settings.introBgUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                      ) : (
                        <img src={settings.introBgUrl || undefined} className="w-full h-full object-cover" alt="Fond intro" />
                      )}
                    </div>
                  ) : null}
                </div>

                {/* Launch / Start Screen Background */}
                <div className="space-y-1">
                  <label className="text-gray-400 block font-bold mb-1">IMAGE / VIDÉO DE TOILE D'INTRO (LAUNCH SCREEN BACKGROUND) :</label>
                  <input
                    type="text"
                    value={settings.launchScreenUrl || ''}
                    onChange={(e) => setBrandingSettings({ ...settings, launchScreenUrl: e.target.value })}
                    placeholder="Lien URL de l'image/vidéo d'accueil"
                    className="w-full text-[9px] py-1.5 px-2.5 rounded bg-black border border-[#222] focus:border-[#D4AF37] text-white outline-none"
                  />
                  <div className="flex gap-2 mt-1">
                    <button
                      type="button"
                      disabled={uploadingLaunch}
                      onClick={() => {
                        const fileInput = document.createElement('input');
                        fileInput.type = 'file';
                        fileInput.accept = 'image/*,video/*';
                        fileInput.onchange = async (e: any) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setUploadingLaunch(true);
                            setUploadProgress('0%');
                            triggerHaptic('medium');
                            try {
                              const publicUrl = await performDetailedUpload(file);
                              setBrandingSettings(prev => ({ ...prev, launchScreenUrl: publicUrl }));
                              triggerHaptic('success');
                            } catch (err) {
                              console.error('Launch screen upload error:', err);
                              setErrorMsg('Erreur de téléversement...');
                              setTimeout(() => setErrorMsg(''), 4000);
                            } finally {
                              setUploadingLaunch(false);
                              setUploadProgress('');
                            }
                          }
                        };
                        fileInput.click();
                      }}
                      className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded font-bold text-[8px] text-[#C5A880] hover:text-white transition cursor-pointer disabled:opacity-50"
                    >
                      {uploadingLaunch ? `Téléversement (${uploadProgress})...` : 'Uploader image/vidéo'}
                    </button>
                    {settings.launchScreenUrl && (
                      <button
                        type="button"
                        onClick={() => setBrandingSettings({ ...settings, launchScreenUrl: '' })}
                        className="text-red-500 hover:text-red-400 text-[8px] cursor-pointer"
                      >
                        Effacer
                      </button>
                    )}
                  </div>
                  {settings.launchScreenUrl && settings.launchScreenUrl.trim() !== '' ? (
                    <div className="mt-2 w-full h-24 rounded-lg overflow-hidden border border-zinc-900 bg-black relative">
                      {isVideoUrl(settings.launchScreenUrl) ? (
                        <video src={settings.launchScreenUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                      ) : (
                        <img src={settings.launchScreenUrl || undefined} className="w-full h-full object-cover" alt="Launch intro" />
                      )}
                    </div>
                  ) : null}
                </div>

                {/* Homepage Hero Card Background */}
                <div className="space-y-1">
                  <label className="text-gray-400 block font-bold mb-1">FOND DE PREVIEW HERO DU SITE (HERO BANNER BACKGROUND) :</label>
                  <input
                    type="text"
                    value={settings.homepageHeroBgUrl || ''}
                    onChange={(e) => setBrandingSettings({ ...settings, homepageHeroBgUrl: e.target.value })}
                    placeholder="Ex: https://images.unsplash.com/photo-... ou URL Vidéo"
                    className="w-full text-[9px] py-1.5 px-2.5 rounded bg-black border border-[#222] focus:border-[#D4AF37] text-white outline-none"
                  />
                  <div className="flex gap-2 mt-1">
                    <button
                      type="button"
                      disabled={uploadingHero}
                      onClick={() => {
                        const fileInput = document.createElement('input');
                        fileInput.type = 'file';
                        fileInput.accept = 'image/*,video/*';
                        fileInput.onchange = async (e: any) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setUploadingHero(true);
                            setUploadProgress('0%');
                            triggerHaptic('medium');
                            try {
                              const publicUrl = await performDetailedUpload(file);
                              setBrandingSettings(prev => ({ ...prev, homepageHeroBgUrl: publicUrl }));
                              triggerHaptic('success');
                            } catch (err) {
                              console.error('Hero visual upload error:', err);
                              setErrorMsg('Erreur de téléversement...');
                              setTimeout(() => setErrorMsg(''), 4000);
                            } finally {
                              setUploadingHero(false);
                              setUploadProgress('');
                            }
                          }
                        };
                        fileInput.click();
                      }}
                      className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded font-bold text-[8px] text-[#C5A880] hover:text-white transition cursor-pointer disabled:opacity-50"
                    >
                      {uploadingHero ? `Téléversement (${uploadProgress})...` : 'Uploader image/vidéo'}
                    </button>
                    {settings.homepageHeroBgUrl && (
                      <button
                        type="button"
                        onClick={() => setBrandingSettings({ ...settings, homepageHeroBgUrl: '' })}
                        className="text-red-500 hover:text-red-400 text-[8px] cursor-pointer"
                      >
                        Effacer
                      </button>
                    )}
                  </div>
                  {settings.homepageHeroBgUrl && settings.homepageHeroBgUrl.trim() !== '' ? (
                    <div className="mt-2 w-full h-24 rounded-lg overflow-hidden border border-zinc-900 bg-black relative">
                      {isVideoUrl(settings.homepageHeroBgUrl) ? (
                        <video src={settings.homepageHeroBgUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                      ) : (
                        <img src={settings.homepageHeroBgUrl || undefined} className="w-full h-full object-cover" alt="Fond hero" />
                      )}
                    </div>
                  ) : null}
                </div>

                {/* Main Logo Url */}
                <div className="space-y-1">
                  <label className="text-gray-400 block font-bold mb-1">LOGO ICON DU HEADER (CONTENEUR PRÉVU) :</label>
                  <input
                    type="text"
                    value={settings.logoUrl || ''}
                    onChange={(e) => setBrandingSettings({ ...settings, logoUrl: e.target.value })}
                    placeholder="/input_file_0.png ou Base64"
                    className="w-full text-[9px] py-1.5 px-2.5 rounded bg-black border border-[#222] focus:border-[#D4AF37] text-white outline-none"
                  />
                  <div className="flex gap-2 mt-1">
                    <button
                      type="button"
                      disabled={uploadingLogo}
                      onClick={() => {
                        const fileInput = document.createElement('input');
                        fileInput.type = 'file';
                        fileInput.accept = 'image/*';
                        fileInput.onchange = async (e: any) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setUploadingLogo(true);
                            setUploadProgress('0%');
                            triggerHaptic('medium');
                            try {
                              const publicUrl = await performDetailedUpload(file);
                              setBrandingSettings(prev => ({ ...prev, logoUrl: publicUrl }));
                              triggerHaptic('success');
                            } catch (err) {
                              console.error('Logo upload error:', err);
                              setErrorMsg('Erreur de téléversement...');
                              setTimeout(() => setErrorMsg(''), 4000);
                            } finally {
                              setUploadingLogo(false);
                              setUploadProgress('');
                            }
                          }
                        };
                        fileInput.click();
                      }}
                      className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded font-bold text-[8px] text-[#C5A880] hover:text-white transition cursor-pointer disabled:opacity-50"
                    >
                      {uploadingLogo ? `Téléversement (${uploadProgress})...` : 'Uploader un logo d\'en-tête'}
                    </button>
                    {settings.logoUrl && (
                      <button
                        type="button"
                        onClick={() => setBrandingSettings({ ...settings, logoUrl: '' })}
                        className="text-red-500 hover:text-red-400 text-[8px] cursor-pointer"
                      >
                        Effacer
                      </button>
                    )}
                  </div>
                  {settings.logoUrl && settings.logoUrl.trim() !== '' ? (
                    <div className="mt-2 w-16 h-16 rounded-lg overflow-hidden border border-zinc-900 bg-black relative flex items-center justify-center">
                      <img src={settings.logoUrl || undefined} className="w-full h-full object-cover" alt="Logo" />
                    </div>
                  ) : null}
                </div>

                {/* Background Watermark Logo Url */}
                <div className="space-y-1">
                  <label className="text-gray-400 block font-bold mb-1">LOGO EN FILIGRANE EN ARRIÈRE-PLAN (MODIFIABLE & TRÈS DISCRET) :</label>
                  <input
                    type="text"
                    value={settings.bgLogoUrl || ''}
                    onChange={(e) => setBrandingSettings({ ...settings, bgLogoUrl: e.target.value })}
                    placeholder="URL du logo de fond filigrane ou Base64"
                    className="w-full text-[9px] py-1.5 px-2.5 rounded bg-black border border-[#222] focus:border-[#D4AF37] text-white outline-none"
                  />
                  <div className="flex gap-2 mt-1">
                    <button
                      type="button"
                      disabled={uploadingBgLogo}
                      onClick={() => {
                        const fileInput = document.createElement('input');
                        fileInput.type = 'file';
                        fileInput.accept = 'image/*';
                        fileInput.onchange = async (e: any) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setUploadingBgLogo(true);
                            setUploadProgress('0%');
                            triggerHaptic('medium');
                            try {
                              const publicUrl = await performDetailedUpload(file);
                              setBrandingSettings(prev => ({ ...prev, bgLogoUrl: publicUrl }));
                              triggerHaptic('success');
                            } catch (err) {
                              console.error('Bg logo upload error:', err);
                              setErrorMsg('Erreur de téléversement...');
                              setTimeout(() => setErrorMsg(''), 4000);
                            } finally {
                              setUploadingBgLogo(false);
                              setUploadProgress('');
                            }
                          }
                        };
                        fileInput.click();
                      }}
                      className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded font-bold text-[8px] text-[#C5A880] hover:text-white transition cursor-pointer disabled:opacity-50"
                    >
                      {uploadingBgLogo ? `Téléversement (${uploadProgress})...` : 'Uploader logo filigrane'}
                    </button>
                    {settings.bgLogoUrl && (
                      <button
                        type="button"
                        onClick={() => setBrandingSettings({ ...settings, bgLogoUrl: '' })}
                        className="text-red-500 hover:text-red-400 text-[8px] cursor-pointer"
                      >
                        Effacer
                      </button>
                    )}
                  </div>
                  {settings.bgLogoUrl && settings.bgLogoUrl.trim() !== '' ? (
                    <div className="mt-2 w-16 h-16 rounded-lg overflow-hidden border border-zinc-900 bg-black relative flex items-center justify-center">
                      <img src={settings.bgLogoUrl || undefined} className="w-full h-full object-contain filter opacity-30 blur-[0.5px]" alt="Logo filigrane" />
                    </div>
                  ) : null}
                </div>

                {/* Intro Vertical Autoplay Video Url */}
                <div className="space-y-1">
                  <label className="text-gray-400 block font-bold mb-1">VIDÉO VERTICALE D'INTRODUCTION (LECTURE SEULE SUR L'ÉCRAN D'ENTRÉE) :</label>
                  <input
                    type="text"
                    value={settings.introVideoUrl || ''}
                    onChange={(e) => setBrandingSettings({ ...settings, introVideoUrl: e.target.value })}
                    placeholder="Lien URL de la vidéo d'intro ou Base64"
                    className="w-full text-[9px] py-1.5 px-2.5 rounded bg-black border border-[#222] focus:border-[#D4AF37] text-white outline-none"
                  />
                  <div className="flex gap-2 mt-1">
                    <button
                      type="button"
                      disabled={uploadingIntro}
                      onClick={() => {
                        const fileInput = document.createElement('input');
                        fileInput.type = 'file';
                        fileInput.accept = 'video/*';
                        fileInput.onchange = async (e: any) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setUploadingIntro(true);
                            setUploadProgress('0%');
                            triggerHaptic('medium');
                            try {
                              const publicUrl = await performDetailedUpload(file);
                              setBrandingSettings(prev => ({ ...prev, introVideoUrl: publicUrl }));
                              triggerHaptic('success');
                            } catch (err) {
                              console.error('Intro vertical video upload error:', err);
                              setErrorMsg('Erreur de téléversement...');
                              setTimeout(() => setErrorMsg(''), 4000);
                            } finally {
                              setUploadingIntro(false);
                              setUploadProgress('');
                            }
                          }
                        };
                        fileInput.click();
                      }}
                      className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded font-bold text-[8px] text-[#C5A880] hover:text-white transition cursor-pointer disabled:opacity-50"
                    >
                      {uploadingIntro ? `Téléversement (${uploadProgress})...` : 'Uploader vidéo verticale d\'intro'}
                    </button>
                    {settings.introVideoUrl && (
                      <button
                        type="button"
                        onClick={() => setBrandingSettings({ ...settings, introVideoUrl: '' })}
                        className="text-red-500 hover:text-red-400 text-[8px] cursor-pointer"
                      >
                        Effacer
                      </button>
                    )}
                  </div>
                  {settings.introVideoUrl && settings.introVideoUrl.trim() !== '' ? (
                    <div className="mt-2 w-full h-32 rounded-lg overflow-hidden border border-zinc-900 bg-black relative flex items-center justify-center">
                      <video src={settings.introVideoUrl} autoPlay loop muted playsInline className="h-full object-contain" />
                    </div>
                  ) : null}
                </div>

                {/* GROS TITRES / SECTION TITLES */}
                <div className="border border-[#171717] bg-[#070707] p-4 rounded-xl space-y-3">
                  <span className="block text-[8px] font-mono text-[#D4AF37] uppercase tracking-widest font-bold">
                    GROS TITRES / SECTION TITLES
                  </span>
                  
                  {sectionTitles.length === 0 ? (
                    <div className="py-6 text-center text-zinc-600 text-[9px] font-mono border border-dashed border-[#222] rounded-lg">
                      Aucun titre de section personnalisé.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {sectionTitles
                        .sort((a, b) => (a.order || 0) - (b.order || 0))
                        .map((title, idx) => (
                          <div 
                            key={title.id} 
                            className="bg-black/95 p-3 rounded-lg border border-[#1d1d1d] hover:border-zinc-800 transition flex flex-col gap-2"
                          >
                            {/* Top row: Text & Controls */}
                            <div className="flex items-center gap-2">
                              {/* Drag-free orders order indicator */}
                              <div className="text-[7px] font-mono text-[#C5A880] w-3">
                                #{idx + 1}
                              </div>

                              <input
                                type="text"
                                value={title.text}
                                onChange={(e) => handleUpdateSectionTitle(title.id, { text: e.target.value })}
                                placeholder="COLLECTIONS PRIVÉES"
                                className="flex-1 text-[10px] py-1 px-2 rounded bg-zinc-950 border border-zinc-900 focus:border-[#D4AF37] text-white outline-none font-sans font-medium uppercase"
                              />

                              {/* Toggle visibility */}
                              <button
                                type="button"
                                onClick={() => handleUpdateSectionTitle(title.id, { enabled: !title.enabled })}
                                className={`p-1 rounded border transition ${title.enabled ? 'border-green-950 bg-green-950/25 text-green-400 hover:bg-green-900/40' : 'border-zinc-900 bg-zinc-900/25 text-zinc-500 hover:bg-zinc-800/40'}`}
                                title={title.enabled ? "Masquer" : "Afficher"}
                              >
                                {title.enabled ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                              </button>

                              {/* Reorder Up */}
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveSectionTitle(idx, 'up')}
                                className="p-1 rounded border border-zinc-900 bg-zinc-950 text-zinc-400 hover:text-white transition disabled:opacity-30 disabled:pointer-events-none"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>

                              {/* Reorder Down */}
                              <button
                                type="button"
                                disabled={idx === sectionTitles.length - 1}
                                onClick={() => handleMoveSectionTitle(idx, 'down')}
                                className="p-1 rounded border border-zinc-900 bg-zinc-950 text-zinc-400 hover:text-white transition disabled:opacity-30 disabled:pointer-events-none"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>

                              {/* Trash */}
                              <button
                                type="button"
                                onClick={() => handleRemoveSectionTitle(title.id)}
                                className="p-1 rounded border border-red-950/45 bg-red-950/20 text-red-400 hover:bg-red-900/40 hover:text-red-300 transition"
                                title="Supprimer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Bottom row: Config Details */}
                            <div className="grid grid-cols-3 gap-2">
                              {/* Category choice */}
                              <div>
                                <label className="block text-[7px] font-mono text-zinc-500 uppercase mb-0.5">Filtre Cible</label>
                                <select
                                  value={title.category}
                                  onChange={(e) => handleUpdateSectionTitle(title.id, { category: e.target.value })}
                                  className="w-full text-[8px] py-1 px-1.5 rounded bg-zinc-950 border border-zinc-900 text-zinc-300 focus:border-[#D4AF37] outline-none"
                                >
                                  <option value="All">All (Tout)</option>
                                  <option value="DRY SIFT">DRY SIFT</option>
                                  <option value="BELDIA">BELDIA</option>
                                  <option value="FROZEN">FROZEN SIFT</option>
                                  <option value="STATIC">STATIC</option>
                                  <option value="WPFF">WPFF</option>
                                  <option value="ACCESSOIRES">ACCESSOIRES</option>
                                </select>
                              </div>

                              {/* Size Choice */}
                              <div>
                                <label className="block text-[7px] font-mono text-zinc-500 uppercase mb-0.5">Taille</label>
                                <select
                                  value={title.size}
                                  onChange={(e) => handleUpdateSectionTitle(title.id, { size: e.target.value as any })}
                                  className="w-full text-[8px] py-1 px-1.5 rounded bg-zinc-950 border border-zinc-900 text-zinc-300 focus:border-[#D4AF37] outline-none"
                                >
                                  <option value="S">Small (S)</option>
                                  <option value="M">Medium (M)</option>
                                  <option value="L">Large (L)</option>
                                  <option value="XL">Extra-Large (XL)</option>
                                </select>
                              </div>

                              {/* Color Choice */}
                              <div>
                                <label className="block text-[7px] font-mono text-zinc-500 uppercase mb-0.5">Couleur</label>
                                <div className="flex gap-1.5 items-center">
                                  <input
                                    type="color"
                                    value={title.color.startsWith('#') && title.color.length === 7 ? title.color : '#FFFFFF'}
                                    onChange={(e) => handleUpdateSectionTitle(title.id, { color: e.target.value })}
                                    className="w-4 h-4 rounded bg-transparent border border-none cursor-pointer outline-none"
                                    style={{ padding: 0 }}
                                  />
                                  <input
                                    type="text"
                                    value={title.color}
                                    onChange={(e) => handleUpdateSectionTitle(title.id, { color: e.target.value })}
                                    placeholder="#FFFFFF"
                                    className="w-full text-[8px] py-1 px-1 rounded bg-zinc-950 border border-zinc-900 text-zinc-300 focus:border-[#D4AF37] outline-none font-mono"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleAddSectionTitle}
                    className="w-full py-1.5 rounded border border-dashed border-[#D4AF37]/35 hover:border-[#D4AF37] bg-black text-[#D4AF37] flex items-center justify-center gap-1.5 text-[8px] font-mono transition-all font-bold"
                  >
                    <Plus className="w-3 h-3" />
                    <span>AJOUTER UN GROS TITRE</span>
                  </button>
                </div>

                {/* Intro status line / tagline ticker */}
                <div className="space-y-1">
                  <label className="text-gray-400 block font-bold mb-1">MESSAGE DE GARDE ET INTRO DE CHARGEMENT :</label>
                  <input
                    type="text"
                    value={settings.introStatusLine || ''}
                    onChange={(e) => setBrandingSettings({ ...settings, introStatusLine: e.target.value })}
                    placeholder="👽⛰️ALIENS FARMS OFFICIEL⛰️👽 — PRIVATE RESERVE"
                    className="w-full text-[9px] py-1.5 px-2.5 rounded bg-black border border-[#222] focus:border-[#D4AF37] text-white outline-none"
                  />
                </div>

                {/* Telegram & Contact Links Configuration for Page Contact */}
                <div className="space-y-3 p-3 rounded-xl border border-[#D4AF37]/30 bg-[#111]">
                  <h4 className="text-[#D4AF37] font-bold text-xs uppercase flex items-center gap-2">
                    📱 CONFIGURATION DES LIENS DE CONTACT (PAGE CONTACT)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-gray-300 block font-bold text-[9px]">✈️ CANAL TELEGRAM OFFICIEL :</label>
                      <input
                        type="text"
                        value={settings.telegramChannelUrl || ''}
                        onChange={(e) => setBrandingSettings({ ...settings, telegramChannelUrl: e.target.value })}
                        placeholder="Ex: https://t.me/+ox8xo-KqAk1jYjI0"
                        className="w-full text-[9px] py-1.5 px-2.5 rounded bg-black border border-[#222] focus:border-[#D4AF37] text-white outline-none font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-gray-300 block font-bold text-[9px]">🎧 SUPPORT TELEGRAM 24/7 :</label>
                      <input
                        type="text"
                        value={settings.telegramSupportUrl || ''}
                        onChange={(e) => setBrandingSettings({ ...settings, telegramSupportUrl: e.target.value })}
                        placeholder="Ex: https://t.me/Samy_ghost"
                        className="w-full text-[9px] py-1.5 px-2.5 rounded bg-black border border-[#222] focus:border-[#D4AF37] text-white outline-none font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-gray-300 block font-bold text-[9px]">📸 INSTAGRAM OFFICIEL :</label>
                      <input
                        type="text"
                        value={settings.instagramUrl || ''}
                        onChange={(e) => setBrandingSettings({ ...settings, instagramUrl: e.target.value })}
                        placeholder="Ex: https://instagram.com/north47_lab"
                        className="w-full text-[9px] py-1.5 px-2.5 rounded bg-black border border-[#222] focus:border-[#D4AF37] text-white outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* BANDEAU DÉFILANT LUMINEUX (MARQUEE) ADMINISTRATION */}
                <div className="p-4 rounded-xl bg-neutral-900/80 border border-amber-500/30 space-y-4">
                  <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span className="font-mono text-xs font-black text-amber-300 uppercase tracking-wider">
                        Bandeau Défilant Lumineux (Marquee LED)
                      </span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.marqueeConfig?.enabled ?? true}
                        onChange={(e) => {
                          const cfg = settings.marqueeConfig || DEFAULT_MARQUEE_CONFIG;
                          setBrandingSettings({
                            ...settings,
                            marqueeConfig: { ...cfg, enabled: e.target.checked }
                          });
                        }}
                        className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                      />
                      <span className="text-[10px] font-mono text-white font-bold">
                        {(settings.marqueeConfig?.enabled ?? true) ? 'ACTIVÉ' : 'DÉSACTIVÉ'}
                      </span>
                    </label>
                  </div>

                  {/* Vitesse de défilement */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-black/60 p-2.5 rounded-lg border border-white/5">
                    <span className="text-[9px] font-mono font-bold text-neutral-300">⚡ VITESSE DE DÉFILEMENT :</span>
                    <div className="flex items-center gap-1.5">
                      {(['slow', 'medium', 'fast'] as const).map((spd) => (
                        <button
                          key={spd}
                          type="button"
                          onClick={() => {
                            const cfg = settings.marqueeConfig || DEFAULT_MARQUEE_CONFIG;
                            setBrandingSettings({
                              ...settings,
                              marqueeConfig: { ...cfg, speed: spd }
                            });
                          }}
                          className={`px-2.5 py-1 rounded text-[8.5px] font-mono font-bold uppercase transition cursor-pointer ${
                            (settings.marqueeConfig?.speed || 'medium') === spd
                              ? 'bg-amber-500 text-black border border-amber-400 font-extrabold shadow'
                              : 'bg-neutral-800 text-neutral-400 hover:text-white border border-white/5'
                          }`}
                        >
                          {spd === 'slow' ? 'Lente (50s)' : spd === 'medium' ? 'Moyenne (30s)' : 'Rapide (16s)'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Messages défilants */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-mono font-bold text-neutral-400 block">
                      💬 MESSAGES DU BANDEAU (ÉDITION, ORDRE & ACTIVATION) :
                    </label>

                    {(settings.marqueeConfig?.items || DEFAULT_MARQUEE_CONFIG.items).map((item, idx) => (
                      <div 
                        key={item.id} 
                        className="flex items-center gap-2 p-2 rounded-lg bg-black/70 border border-white/10"
                      >
                        <input
                          type="checkbox"
                          checked={item.active !== false}
                          onChange={(e) => {
                            const cfg = settings.marqueeConfig || DEFAULT_MARQUEE_CONFIG;
                            const updatedItems = cfg.items.map((it) => 
                              it.id === item.id ? { ...it, active: e.target.checked } : it
                            );
                            setBrandingSettings({
                              ...settings,
                              marqueeConfig: { ...cfg, items: updatedItems }
                            });
                          }}
                          className="w-3.5 h-3.5 accent-amber-500 rounded cursor-pointer"
                          title="Activer/Désactiver ce message"
                        />

                        <input
                          type="text"
                          value={item.text}
                          onChange={(e) => {
                            const cfg = settings.marqueeConfig || DEFAULT_MARQUEE_CONFIG;
                            const updatedItems = cfg.items.map((it) => 
                              it.id === item.id ? { ...it, text: e.target.value } : it
                            );
                            setBrandingSettings({
                              ...settings,
                              marqueeConfig: { ...cfg, items: updatedItems }
                            });
                          }}
                          className="flex-1 text-[9px] font-mono py-1 px-2 rounded bg-neutral-950 border border-white/10 text-amber-300 focus:border-amber-500 outline-none"
                        />

                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => {
                              const cfg = settings.marqueeConfig || DEFAULT_MARQUEE_CONFIG;
                              const items = [...cfg.items];
                              const temp = items[idx];
                              items[idx] = items[idx - 1];
                              items[idx - 1] = temp;
                              items.forEach((it, i) => (it.order = i + 1));
                              setBrandingSettings({
                                ...settings,
                                marqueeConfig: { ...cfg, items }
                              });
                            }}
                            className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 disabled:opacity-30 cursor-pointer"
                            title="Monter"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === (settings.marqueeConfig?.items || DEFAULT_MARQUEE_CONFIG.items).length - 1}
                            onClick={() => {
                              const cfg = settings.marqueeConfig || DEFAULT_MARQUEE_CONFIG;
                              const items = [...cfg.items];
                              const temp = items[idx];
                              items[idx] = items[idx + 1];
                              items[idx + 1] = temp;
                              items.forEach((it, i) => (it.order = i + 1));
                              setBrandingSettings({
                                ...settings,
                                marqueeConfig: { ...cfg, items }
                              });
                            }}
                            className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 disabled:opacity-30 cursor-pointer"
                            title="Descendre"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const cfg = settings.marqueeConfig || DEFAULT_MARQUEE_CONFIG;
                            const updatedItems = cfg.items.filter((it) => it.id !== item.id);
                            setBrandingSettings({
                              ...settings,
                              marqueeConfig: { ...cfg, items: updatedItems }
                            });
                          }}
                          className="p-1 rounded bg-red-950/50 hover:bg-red-900 border border-red-500/30 text-red-400 cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        const cfg = settings.marqueeConfig || DEFAULT_MARQUEE_CONFIG;
                        const newId = 'm_' + Date.now();
                        const newItem: MarqueeItem = {
                          id: newId,
                          text: '✨ Nouveau message SHELF TERPS Private Reserve',
                          active: true,
                          order: cfg.items.length + 1
                        };
                        setBrandingSettings({
                          ...settings,
                          marqueeConfig: { ...cfg, items: [...cfg.items, newItem] }
                        });
                      }}
                      className="w-full py-1.5 px-3 rounded-lg border border-dashed border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-mono text-[9px] font-bold uppercase flex items-center justify-center gap-1.5 transition cursor-pointer mt-2"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Ajouter un message au bandeau</span>
                    </button>
                  </div>
                </div>

                {/* Telegram Mini-App URL configuration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-gray-400 block font-bold mb-1">🔗 URL OFFICIELLE MINI-APP TELEGRAM (BOUTON SHOP 🛍️) :</label>
                    <input
                      type="text"
                      value={settings.customAppUrl || ''}
                      onChange={(e) => setBrandingSettings({ ...settings, customAppUrl: e.target.value })}
                      placeholder="https://st-production-a9ae.up.railway.app (par défaut)"
                      className="w-full text-[9px] py-1.5 px-2.5 rounded bg-black border border-[#222] focus:border-[#D4AF37] text-white outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-gray-400 block font-bold mb-1">🔗 URL DE DESTINATION (BOUTON 2 - OPTIONNEL) :</label>
                    <input
                      type="text"
                      value={settings.instagramUrl2 || ''}
                      onChange={(e) => setBrandingSettings({ ...settings, instagramUrl2: e.target.value })}
                      placeholder="Ex: https://t.me/mon_canal (laisser vide pour désactiver)"
                      className="w-full text-[9px] py-1.5 px-2.5 rounded bg-black border border-[#222] focus:border-[#D4AF37] text-white outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Promo Broadcast content configuration */}
                <div className="space-y-1">
                  <label className="text-gray-400 block font-bold mb-1">📢 TEXTE DU MESSAGE DE BROADCAST :</label>
                  <textarea
                    rows={6}
                    value={settings.promoMessageText || ''}
                    onChange={(e) => setBrandingSettings({ ...settings, promoMessageText: e.target.value })}
                    placeholder="🛍️ BOUTIQUE\n\nNotre boutique est disponible directement sur Telegram..."
                    className="w-full text-[9px] py-1.5 px-2.5 rounded bg-black border border-[#222] focus:border-[#D4AF37] text-white outline-none font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-gray-400 block font-bold mb-1">🏷️ TEXTE DU BOUTON 1 :</label>
                    <input
                      type="text"
                      value={settings.promoButtonText || ''}
                      onChange={(e) => setBrandingSettings({ ...settings, promoButtonText: e.target.value })}
                      placeholder="Boutique 🛍️"
                      className="w-full text-[9px] py-1.5 px-2.5 rounded bg-black border border-[#222] focus:border-[#D4AF37] text-white outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-gray-400 block font-bold mb-1">🏷️ TEXTE DU BOUTON 2 (OPTIONNEL) :</label>
                    <input
                      type="text"
                      value={settings.promoButtonText2 || ''}
                      onChange={(e) => setBrandingSettings({ ...settings, promoButtonText2: e.target.value })}
                      placeholder="Ex: Rejoindre le Canal 📢"
                      className="w-full text-[9px] py-1.5 px-2.5 rounded bg-black border border-[#222] focus:border-[#D4AF37] text-white outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Secure Admin Password configuration */}
                <div className="space-y-1">
                  <label className="text-gray-400 block font-bold mb-1">🔐 CONFIGURER LE MOT DE PASSE D'ACCÈS ADMIN :</label>
                  <input
                    type="text"
                    value={settings.adminPassword || ''}
                    onChange={(e) => setBrandingSettings({ ...settings, adminPassword: e.target.value })}
                    placeholder="omerta2026 (par défaut)"
                    className="w-full text-[9px] py-1.5 px-2.5 rounded bg-black border border-[#222] focus:border-[#D4AF37] text-[#D4AF37] outline-none font-mono font-bold"
                  />
                  <p className="text-[7.5px] font-mono text-zinc-500 mt-0.5 leading-normal">
                    Par défaut, si vous laissez vide, le mot de passe de secours est "omerta2026". Ce mot de passe est obligatoire pour ouvrir la console d'administration et sécuriser l'application.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={async () => {
                    setIsSubmitting(true);
                    triggerHaptic('heavy');
                    try {
                      const updated = await updateBrandingSettings(settings);
                      if (updated && typeof updated.adminPassword === 'string') {
                        setAdminPasswordToken(updated.adminPassword);
                      }
                      setBrandingSettings(updated);
                      if (onBrandingChange) {
                        onBrandingChange(updated);
                      }
                      triggerHaptic('success');
                      setSuccessMsg('Branding mis à jour et synchronisé !');
                      setTimeout(() => setSuccessMsg(''), 4000);
                    } catch (e) {
                      console.error('Core visual settings save failing', e);
                      setErrorMsg('Échec de la sauvegarde des personnalisations...');
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  className="w-full py-3 mt-2 rounded-xl bg-[#D4AF37] text-black font-extrabold text-[9px] tracking-widest uppercase hover:bg-white transition duration-350 cursor-pointer"
                >
                  {isSubmitting ? 'SAUVEGARDE EN COURS...' : 'APPLIQUER ET PUBLIER'}
                </button>

              </div>
            </div>
          </motion.div>
        )}

        {/* TAB D: WHITELIST ACCESS CONTROL SYSTEM */}
        {activeTab === 'whitelist' && (
          <motion.div
            key="tab-whitelist"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="bg-[#111] p-3.5 rounded-xl border border-white/5 space-y-4 font-mono text-[9px]">
              <div>
                <span className="block text-[9px] font-mono text-[#D4AF37] font-extrabold uppercase tracking-widest">
                  🔒 GARDE DE SÉCURITÉ & WHITELIST (ACCÈS PRIVÉ)
                </span>
                <p className="text-[8px] font-mono text-zinc-500 mt-1 leading-relaxed">
                  Gérez les ID Telegram autorisés à accéder à la Mini App. Les utilisateurs non listés verront l'écran de restriction d'élite "PRIVATE ACCESS ONLY". L'ID Propriétaire 858781160 est toujours configuré d'office par défaut.
                </p>
              </div>

              {/* Form to add user */}
              <form onSubmit={handleAddWhitelist} className="space-y-3 bg-black/40 p-3 rounded-lg border border-zinc-900">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-gray-400 block font-bold mb-1 uppercase text-[7.5px]">Type d'identifiant:</label>
                    <select
                      value={newWhitelistType}
                      onChange={(e) => setNewWhitelistType(e.target.value as any)}
                      className="w-full text-[9px] py-1.5 px-2.5 rounded bg-black border border-[#222] focus:border-[#D4AF37] text-white outline-none"
                    >
                      <option value="ID">Telegram numeric ID (ex: 858781160)</option>
                      <option value="Username">Telegram username (ex: omerta_cartel)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-400 block font-bold mb-1 uppercase text-[7.5px]">Valeur (ID ou Username):</label>
                    <input
                      type="text"
                      required
                      placeholder={newWhitelistType === 'ID' ? 'ex: 858781160' : 'ex: omerta_cartel'}
                      value={newWhitelistVal}
                      onChange={(e) => setNewWhitelistVal(e.target.value)}
                      className="w-full text-[9px] py-1.5 px-2.5 rounded bg-black border border-[#222] focus:border-[#D4AF37] text-white outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-gray-400 block font-bold mb-1 uppercase text-[7.5px]">Rôle d'autorisation:</label>
                    <select
                      value={newWhitelistRole}
                      onChange={(e) => setNewWhitelistRole(e.target.value as any)}
                      className="w-full text-[9px] py-1.5 px-2.5 rounded bg-black border border-[#222] focus:border-[#D4AF37] text-white outline-none"
                    >
                      <option value="MEMBER">MEMBER (Accès standard)</option>
                      <option value="ADMIN">ADMIN (Accès restreint aux produits/commandes)</option>
                      <option value="OWNER">OWNER (Accès complet au panneau admin)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-400 block font-bold mb-1 uppercase text-[7.5px]">Notes / Nom d'usage:</label>
                    <input
                      type="text"
                      placeholder="ex: Client VIP Marrakech"
                      value={newWhitelistNotes}
                      onChange={(e) => setNewWhitelistNotes(e.target.value)}
                      className="w-full text-[9px] py-1.5 px-2.5 rounded bg-black border border-[#222] focus:border-[#D4AF37] text-white outline-none font-sans"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2 rounded bg-[#D4AF37] text-black font-extrabold text-[8.5px] uppercase tracking-wider hover:bg-white transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>AUTORISER L'ACCÈS DU MEMBRE</span>
                </button>
              </form>

              {/* List of Pending Approvals */}
              <div className="space-y-2 pt-2 border-t border-zinc-900">
                <div className="flex items-center justify-between">
                  <span className="block text-[8px] text-[#D4AF37] uppercase tracking-widest font-extrabold">
                    ⏳ DEMANDES D'ACCÈS EN ATTENTE ({pendingApprovals.length})
                  </span>
                  <button
                    type="button"
                    onClick={loadPendingApprovalsData}
                    disabled={loadingPending}
                    className="text-[7.5px] px-2 py-0.5 rounded border border-zinc-100 bg-zinc-900 hover:bg-neutral-800 text-zinc-400 font-mono font-bold tracking-widest uppercase transition cursor-pointer"
                  >
                    {loadingPending ? 'Actualisation...' : 'Actualiser'}
                  </button>
                </div>

                {loadingPending ? (
                  <div className="py-4 text-center text-zinc-600">Chargement des demandes...</div>
                ) : pendingApprovals.length === 0 ? (
                  <div className="py-4 text-center text-zinc-600 border border-dashed border-[#222] rounded-lg">
                    Aucune demande d'accès en attente. Votre forteresse est entièrement sécurisée.
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-900 border border-[#D4AF37]/30 bg-[#D4AF37]/5 rounded-xl overflow-hidden">
                    {pendingApprovals.map((item) => (
                      <div key={item.id} className="p-3 flex items-center justify-between gap-3 text-[9px] hover:bg-[#D4AF37]/10 transition">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-[#F5EFEB] text-[9.5px]">
                              {item.username && item.username !== 'N/A' ? `@${item.username.replace(/^@/, '')}` : `ID: ${item.telegramId}`}
                            </span>
                            {(item.firstName || item.lastName) && (
                              <span className="text-zinc-400 font-sans text-[8px] italic">
                                ({[item.firstName, item.lastName].filter(Boolean).join(' ')})
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-zinc-500 text-[7.5px]">
                            <span>ID: {item.telegramId}</span>
                            <span>•</span>
                            <span>Reçu le {new Date(item.date).toLocaleString('fr-FR')}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleApprovePending(item)}
                            className="px-2 py-1 rounded bg-[#D4AF37] hover:bg-white text-black text-[7.5px] font-extrabold uppercase transition cursor-pointer flex items-center gap-0.5"
                            title="Approuver l'accès"
                          >
                            <UserCheck className="w-3 h-3" />
                            <span>APPROUVER</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectPending(item)}
                            className="p-1 rounded border border-red-950/45 bg-red-950/20 text-red-400 hover:bg-red-900/40 transition cursor-pointer font-bold"
                            title="Rejeter la demande"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* List of Whitelisted items */}
              <div className="space-y-2">
                <span className="block text-[8px] text-[#C5A880] uppercase tracking-widest font-extrabold mb-1">
                  UTILISATEURS ENREGISTRÉS EN WHITELIST ({whitelist.length})
                </span>

                {loadingWhitelist ? (
                  <div className="py-4 text-center text-zinc-600">Chargement de la liste...</div>
                ) : whitelist.length === 0 ? (
                  <div className="py-4 text-center text-zinc-600 border border-dashed border-[#222] rounded-lg">
                    Aucun utilisateur personnalisé. (Seul l'Owner & amine sont autorisés par défaut)
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-900 border border-zinc-900 bg-black/20 rounded-xl overflow-hidden">
                    {whitelist.map((item) => {
                      const valLower = item.value.toLowerCase().replace(/^@/, '');
                      const matchedUser = vipUsers.find((u) => 
                        (item.type === 'ID' && String(u.telegramId) === String(item.value)) ||
                        (u.telegramUsername && u.telegramUsername.toLowerCase().replace(/^@/, '') === valLower)
                      );

                      const matchedLog = connectionLogs.find((l) => 
                        String(l.telegramId) === String(item.value) || 
                        (l.username && l.username.toLowerCase().replace(/^@/, '') === valLower)
                      );

                      const tgUsername = matchedUser?.telegramUsername || matchedLog?.username || (item.type === 'Username' ? item.value.replace(/^@/, '') : '');
                      const tgFirstName = matchedUser?.firstName || matchedLog?.firstName || '';
                      const tgLastName = matchedUser?.lastName || matchedLog?.lastName || '';
                      const tgFullName = [tgFirstName, tgLastName].filter(Boolean).join(' ');
                      const tgId = matchedUser?.telegramId || (item.type === 'ID' ? item.value : matchedLog?.telegramId);

                      return (
                        <div key={item.id} className="p-3 flex items-center justify-between gap-3 text-[9px] hover:bg-zinc-950/40 transition">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400 font-extrabold text-[7px] uppercase rounded">
                                {item.type}
                              </span>
                              <span className="px-1.5 py-0.5 bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] font-extrabold text-[7px] uppercase rounded">
                                {item.role || 'MEMBER'}
                              </span>

                              {/* Telegram Nickname in Bold Gold */}
                              {tgUsername && tgUsername !== 'N/A' && tgUsername !== 'guest' ? (
                                <span className="font-extrabold text-[#D4AF37] text-[10px] bg-[#D4AF37]/10 px-2 py-0.5 rounded border border-[#D4AF37]/30 flex items-center gap-1 font-mono">
                                  <User className="w-3 h-3 text-[#D4AF37]" />
                                  <span>@{tgUsername.replace(/^@/, '')}</span>
                                </span>
                              ) : (
                                <span className="font-bold text-[#F5EFEB] text-[9.5px] font-mono">
                                  {item.type === 'Username' && !item.value.startsWith('@') ? '@' : ''}{item.value}
                                </span>
                              )}

                              {/* Telegram Full Name */}
                              {tgFullName && (
                                <span className="text-zinc-300 font-sans text-[8.5px] font-semibold bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                                  {tgFullName}
                                </span>
                              )}

                              {/* Telegram ID */}
                              {tgId && (
                                <span className="text-zinc-500 font-mono text-[7.5px]">
                                  (ID: {tgId})
                                </span>
                              )}
                            </div>
                            {item.notes && <span className="text-zinc-500 text-[8px] font-sans mt-1 block">{item.notes}</span>}
                          </div>

                          {/* Delete button */}
                          {item.id !== 'default-owner' && item.id !== 'default-amine' ? (
                            <button
                              type="button"
                              onClick={() => handleDeleteWhitelist(item.id)}
                              className="p-1 rounded border border-red-950/45 bg-red-950/20 text-red-400 hover:bg-red-900/40 transition cursor-pointer font-bold shrink-0"
                              title="Révoquer l'accès"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          ) : (
                            <span className="text-[7.5px] text-[#D4AF37]/50 uppercase tracking-widest font-mono font-bold shrink-0">PROTÉGÉ</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Telegram Members / Visitors Monitor */}
              <div className="pt-4 border-t border-zinc-900 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="block text-[8px] text-[#D4AF37] uppercase tracking-widest font-extrabold pb-1 flex items-center gap-1">
                    <User className="w-3 h-3 text-[#D4AF37]" />
                    <span>MEMBRES ACCÉDANT À LA MINI-APP ({vipUsers.length})</span>
                  </span>
                  <button
                    type="button"
                    onClick={fetchVipUsers}
                    disabled={loadingVip}
                    className="text-[7.5px] px-2 py-0.5 rounded border border-zinc-100 bg-zinc-900 hover:bg-neutral-800 text-zinc-400 font-mono font-bold tracking-widest uppercase transition cursor-pointer"
                  >
                    {loadingVip ? 'Chargement...' : 'Actualiser'}
                  </button>
                </div>

                {loadingVip ? (
                  <div className="py-4 text-center text-zinc-600">Chargement des membres Telegram...</div>
                ) : vipUsers.length === 0 ? (
                  <div className="py-4 text-center text-zinc-600 border border-dashed border-[#222] rounded-lg">
                    Aucun membre Telegram enregistré pour le moment.
                  </div>
                ) : (
                  <div className="max-h-[220px] overflow-y-auto divide-y divide-zinc-900 border border-zinc-900 bg-black/30 rounded-xl">
                    {vipUsers.map((u: any) => {
                      const cleanUser = u.telegramUsername && u.telegramUsername !== 'guest' && u.telegramUsername !== 'N/A' ? u.telegramUsername.replace(/^@/, '') : '';
                      const fullName = [u.firstName, u.lastName].filter(Boolean).join(' ');

                      return (
                        <div key={u.id || u.telegramId} className="p-2.5 flex items-center justify-between gap-2 hover:bg-zinc-950/50 transition">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {cleanUser ? (
                                <span className="font-extrabold text-[#D4AF37] font-mono text-[9.5px] bg-[#D4AF37]/10 px-1.5 py-0.5 rounded border border-[#D4AF37]/20">
                                  @{cleanUser}
                                </span>
                              ) : (
                                <span className="font-bold text-[#F5EFEB] font-mono text-[9px]">
                                  {u.pseudo || 'Membre Anonyme'}
                                </span>
                              )}

                              {fullName && (
                                <span className="text-zinc-300 font-sans text-[8.5px] font-semibold">
                                  ({fullName})
                                </span>
                              )}

                              <span className="text-zinc-500 font-mono text-[7.5px]">
                                ID: {u.telegramId}
                              </span>
                            </div>

                            <div className="mt-1 flex items-center gap-2 text-zinc-500 text-[7.5px] font-mono flex-wrap">
                              <span className="px-1 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-[#D4AF37]">
                                Rang: {u.level || 'Member'}
                              </span>
                              <span>Dépenses: {u.totalSpent || 0} € ({u.totalOrders || 0} commandes)</span>
                              {u.lastActive && (
                                <span>Accès le {new Date(u.lastActive).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Connection logs section */}
              <div className="pt-4 border-t border-zinc-900 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="block text-[8px] text-[#C5A880] uppercase tracking-widest font-extrabold pb-1">
                    📜 JOURNAL DES DERNIÈRES CONNEXIONS ({connectionLogs.length})
                  </span>
                  <button
                    type="button"
                    onClick={loadConnectionLogsData}
                    disabled={loadingLogs}
                    className="text-[7.5px] px-2 py-0.5 rounded border border-zinc-100 bg-zinc-900 hover:bg-neutral-800 text-zinc-400 font-mono font-bold tracking-widest uppercase transition cursor-pointer"
                  >
                    {loadingLogs ? 'Chargement...' : 'Actualiser'}
                  </button>
                </div>

                {loadingLogs ? (
                  <div className="py-4 text-center text-zinc-600">Chargement du journal...</div>
                ) : connectionLogs.length === 0 ? (
                  <div className="py-4 text-center text-zinc-600 border border-dashed border-[#222] rounded-lg">
                    Aucun historique d'accès enregistré dans la base.
                  </div>
                ) : (
                  <div className="max-h-[220px] overflow-y-auto divide-y divide-zinc-900 border border-zinc-900 bg-black/30 rounded-xl">
                    {connectionLogs.map((log: any) => {
                      const isAuth = log.status === 'Autorisé' || log.status === 'Authorized';
                      const cleanUser = log.username && log.username !== 'N/A' && log.username !== 'guest' ? log.username.replace(/^@/, '') : '';
                      const fullName = [log.firstName, log.lastName].filter(Boolean).join(' ');

                      return (
                        <div key={log.id} className="p-2.5 flex items-start justify-between gap-2 hover:bg-zinc-950/50 transition">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`px-1.5 py-0.5 font-bold font-mono text-[6.5px] uppercase rounded border ${isAuth ? 'bg-emerald-950/30 border-emerald-900/50 text-emerald-400' : 'bg-rose-950/30 border-rose-900/50 text-rose-400'}`}>
                                {isAuth ? 'AUTORISÉ' : 'REFUSÉ'}
                              </span>

                              {/* Telegram Nickname in Gold */}
                              {cleanUser ? (
                                <span className="font-extrabold text-[#D4AF37] font-mono text-[9.5px]">
                                  @{cleanUser}
                                </span>
                              ) : null}

                              {/* Telegram Full Name */}
                              {fullName ? (
                                <span className="text-zinc-200 font-sans text-[8.5px] font-medium">
                                  ({fullName})
                                </span>
                              ) : null}

                              <span className="font-bold text-zinc-400 font-mono text-[8px]">ID: {log.telegramId}</span>
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-zinc-500 text-[7.5px] font-mono flex-wrap">
                              <span>📅 {new Date(log.date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                              <span className="truncate max-w-[180px] text-[7.5px]" title={log.device}>📱 {log.device}</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteConnectionLog(log.id)}
                            className="p-1 rounded border border-zinc-900 bg-zinc-950 text-zinc-600 hover:text-red-400 hover:border-red-950/35 hover:bg-red-950/20 transition cursor-pointer shrink-0"
                            title="Supprimer la ligne"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB E: TELEGRAM BOUTIQUE BROADCAST CONTROLS */}
        {activeTab === 'broadcast' && (
          <motion.div
            key="tab-broadcast"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4 font-mono text-[9px]"
          >
            <div className="bg-[#111] p-3.5 rounded-xl border border-white/5 space-y-4">
              <div>
                <span className="block text-[9px] font-mono text-[#D4AF37] font-extrabold uppercase tracking-widest font-bold">
                  📢 DIFFUSION DE MESSAGE BOUTIQUE (BROADCAST)
                </span>
                <p className="text-[8px] font-mono text-zinc-500 mt-1 leading-relaxed">
                  Cette interface vous permet de diffuser un message de promotion ou une annonce de boutique à tous les utilisateurs enregistrés dans la base (provenant de la Whitelist ou des journaux de connexion).
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-black/40 border border-zinc-900 rounded-lg p-2.5 text-center">
                  <span className="text-zinc-500 block uppercase text-[7.5px] font-bold">Utilisateurs Découverts</span>
                  <span className="text-white text-base font-bold mt-1 block">
                    {loadingBroadcast ? '...' : broadcastStats?.totalUsers ?? '0'}
                  </span>
                </div>
                <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-lg p-2.5 text-center">
                  <span className="text-emerald-500/70 block uppercase text-[7.5px] font-bold">Déjà Envoyés</span>
                  <span className="text-emerald-400 text-base font-bold mt-1 block">
                    {loadingBroadcast ? '...' : broadcastStats?.sentCount ?? '0'}
                  </span>
                </div>
                <div className="bg-rose-950/20 border border-rose-900/40 rounded-lg p-2.5 text-center">
                  <span className="text-rose-500/70 block uppercase text-[7.5px] font-bold">En Attente (Reste)</span>
                  <span className="text-rose-400 text-base font-bold mt-1 block">
                    {loadingBroadcast ? '...' : broadcastStats?.pendingCount ?? '0'}
                  </span>
                </div>
              </div>

              {/* Message customization inputs */}
              <div className="bg-black/40 border border-zinc-900 rounded-lg p-3 space-y-3">
                <span className="text-[#D4AF37] block text-[8px] uppercase tracking-wider font-extrabold">✏️ RETOUCHER LE MESSAGE DE DIFFUSION (INFO / PROMO COULISSES) :</span>
                
                <div className="space-y-1">
                  <label className="text-zinc-500 block text-[7px] font-bold">TEXTE DU MESSAGE :</label>
                  <textarea
                    rows={8}
                    value={settings.promoMessageText || ''}
                    onChange={(e) => setBrandingSettings({ ...settings, promoMessageText: e.target.value })}
                    placeholder={`📱 ANNONCE\n\nEntrez vos nouvelles informations ici pour diffusion...`}
                    className="w-full text-[9px] py-1.5 px-2.5 rounded bg-black border border-zinc-900 focus:border-[#D4AF37] text-white outline-none font-mono"
                  />
                  <p className="text-[7px] font-mono text-zinc-650">Vous pouvez mettre des sauts de ligne, des émojis et formater pour Telegram.</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-zinc-500 block text-[7px] font-bold">TEXTE DU BOUTON 1 :</label>
                    <input
                      type="text"
                      value={settings.promoButtonText || ''}
                      onChange={(e) => setBrandingSettings({ ...settings, promoButtonText: e.target.value })}
                      placeholder="Boutique 🛍️"
                      className="w-full text-[9px] py-1.5 px-2.5 rounded bg-black border border-zinc-900 focus:border-[#D4AF37] text-white outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-zinc-500 block text-[7px] font-bold">URL DE DESTINATION (BOUTON 1) :</label>
                    <input
                      type="text"
                      value={settings.instagramUrl || ''}
                      onChange={(e) => setBrandingSettings({ ...settings, instagramUrl: e.target.value })}
                      placeholder="Laisser vide pour utiliser la Mini-App"
                      className="w-full text-[9px] py-1.5 px-2.5 rounded bg-black border border-zinc-900 focus:border-[#D4AF37] text-white outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-zinc-500 block text-[7px] font-bold">TEXTE DU BOUTON 2 (OPTIONNEL) :</label>
                    <input
                      type="text"
                      value={settings.promoButtonText2 || ''}
                      onChange={(e) => setBrandingSettings({ ...settings, promoButtonText2: e.target.value })}
                      placeholder="Ex: Rejoindre le Canal 📢"
                      className="w-full text-[9px] py-1.5 px-2.5 rounded bg-black border border-zinc-900 focus:border-[#D4AF37] text-white outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-zinc-500 block text-[7px] font-bold">URL DE DESTINATION (BOUTON 2 - OPTIONNEL) :</label>
                    <input
                      type="text"
                      value={settings.instagramUrl2 || ''}
                      onChange={(e) => setBrandingSettings({ ...settings, instagramUrl2: e.target.value })}
                      placeholder="Ex: https://t.me/mon_canal (laisser vide)"
                      className="w-full text-[9px] py-1.5 px-2.5 rounded bg-black border border-zinc-900 focus:border-[#D4AF37] text-white outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1 pt-1 border-t border-zinc-900/60 pb-1">
                  <label className="text-zinc-500 block text-[7px] font-bold">IMAGE D'ACCOMPAGNEMENT DU BROADCAST (VISUEL TELEGRAM) :</label>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                      type="text"
                      value={settings.promoImageUrl || ''}
                      onChange={(e) => setBrandingSettings({ ...settings, promoImageUrl: e.target.value })}
                      placeholder="Coller l'URL d'une image ou l'uploader ci-contre"
                      className="flex-grow text-[9px] py-1.5 px-2.5 rounded bg-black border border-zinc-900 focus:border-[#D4AF37] text-white outline-none font-mono"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={uploadingPromoImg}
                        onClick={() => {
                          const fileInput = document.createElement('input');
                          fileInput.type = 'file';
                          fileInput.accept = 'image/*';
                          fileInput.onchange = async (e: any) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setUploadingPromoImg(true);
                              setUploadProgress('0%');
                              triggerHaptic('medium');
                              try {
                                const publicUrl = await performDetailedUpload(file);
                                setBrandingSettings(prev => ({ ...prev, promoImageUrl: publicUrl }));
                                triggerHaptic('success');
                              } catch (err) {
                                console.error('Promo image upload error:', err);
                                setErrorMsg('Erreur de téléversement...');
                                setTimeout(() => setErrorMsg(''), 4000);
                              } finally {
                                setUploadingPromoImg(false);
                                setUploadProgress('');
                              }
                            }
                          };
                          fileInput.click();
                        }}
                        className="px-2.5 py-1.5 bg-zinc-950 hover:bg-neutral-900 border border-zinc-800 hover:border-[#D4AF37] rounded font-bold text-[7.5px] text-[#C5A880] hover:text-white transition cursor-pointer disabled:opacity-50 font-mono text-center shrink-0"
                      >
                        {uploadingPromoImg ? `Téléversement (${uploadProgress})...` : '📷 TÉLÉCOPIER DEPUIS MOBILE'}
                      </button>
                      {settings.promoImageUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic('light');
                            setBrandingSettings({ ...settings, promoImageUrl: '' });
                          }}
                          className="px-2 py-1.5 bg-red-950/20 hover:bg-red-950 border border-red-900/35 hover:border-red-500 hover:text-white text-red-400 font-bold text-[7.5px] rounded transition cursor-pointer font-mono shrink-0"
                        >
                          EFFACER
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-[7px] font-mono text-zinc-650">Si paramétrée, l'image sera envoyée avec le texte du message ci-dessus en guise de légende.</p>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={async () => {
                      setIsSubmitting(true);
                      triggerHaptic('heavy');
                      try {
                        const updated = await updateBrandingSettings(settings);
                        setBrandingSettings(updated);
                        if (onBrandingChange) {
                          onBrandingChange(updated);
                        }
                        triggerHaptic('success');
                        setSuccessMsg('Message, boutons et visuel enregistrés pour diffusion !');
                        setTimeout(() => setSuccessMsg(''), 3000);
                      } catch (e) {
                        console.error('Error saving broadcast customization', e);
                        setErrorMsg('Échec de la sauvegarde des paramètres de diffusion...');
                        setTimeout(() => setErrorMsg(''), 3005);
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                    className="w-full py-2 bg-zinc-950 border border-zinc-800 hover:border-[#D4AF37] text-zinc-350 hover:text-white font-bold text-[8px] uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                  >
                    {isSubmitting ? "ENREGISTREMENT EN COURS..." : "💾 ENREGISTRER CE MESSAGE (CONSERVÉ ET SYNCHRONISÉ)"}
                  </button>
                </div>
              </div>

              {/* Message Content Preview Box */}
              <div className="bg-black/50 border border-zinc-900 rounded-lg p-3 space-y-2">
                <span className="text-zinc-500 block text-[7.5px] uppercase tracking-wider font-bold">APERCU DU MESSAGE PROMOTIONNEL :</span>
                
                <div className="bg-[#181818] rounded-lg border border-[#222] overflow-hidden">
                  {settings.promoImageUrl && settings.promoImageUrl.trim() !== '' && (
                    <div className="w-full max-h-[140px] overflow-hidden border-b border-[#222] bg-black flex items-center justify-center">
                      <img src={settings.promoImageUrl} className="w-full max-h-[140px] object-contain" alt="Aperçu Visuel Broadcast" />
                    </div>
                  )}
                  <div className="p-3 font-sans text-zinc-300 text-[9.5px] whitespace-pre-wrap leading-relaxed">
                    {settings.promoMessageText || `🛍️ BOUTIQUE\n\nNotre boutique est désormais disponible directement sur Telegram !\n\nVous y retrouverez :\n\n→ Tous nos produits et nouveautés\n→ Commande sécurisée en quelques clics\n→ Vos récompenses de fidélité et codes promos\n\nRejoignez-nous directement dans la Mini App !\n\n🤫 Cercle Privé`}
                  </div>
                </div>

                {/* Simulated TG Keyboard inline button */}
                <div className="pt-1.5 flex flex-col items-center gap-1.5">
                  <div className="w-full max-w-xs flex flex-col gap-1">
                    <span 
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-[#111] text-sky-400 border border-sky-950/45 text-[9px] font-extrabold rounded-lg font-mono uppercase tracking-wider"
                    >
                      <span>{settings.promoButtonText || "Boutique 🛍️"}</span>
                      <span className="text-[7.5px] text-zinc-500">
                        {settings.instagramUrl ? `(Lien : ${settings.instagramUrl})` : "(Ouvre la Mini-App)"}
                      </span>
                    </span>
                    
                    {settings.promoButtonText2 && (
                      <span 
                        className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-[#111] text-sky-400 border border-sky-950/45 text-[9px] font-extrabold rounded-lg font-mono uppercase tracking-wider animate-pulse"
                      >
                        <span>{settings.promoButtonText2}</span>
                        <span className="text-[7.5px] text-zinc-500">
                          {settings.instagramUrl2 ? `(Lien : ${settings.instagramUrl2})` : "(Ouvre la Mini-App)"}
                        </span>
                      </span>
                    )}
                  </div>
                  <span className="text-[7.5px] text-zinc-500 font-mono tracking-normal block text-center break-all mt-0.5">
                    Bouton 1 : {settings.instagramUrl || '(Automatique : Mini-App)'}
                    {settings.instagramUrl2 && ` | Bouton 2 : ${settings.instagramUrl2}`}
                  </span>
                </div>
              </div>

              {/* Broadcast Configuration Toggles */}
              <div className="bg-black/35 border border-zinc-900 rounded-lg p-2.5 space-y-2 text-[8px] font-mono">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 cursor-pointer select-none" onClick={() => { triggerHaptic('light'); setBroadcastForceAll(!broadcastForceAll); }}>
                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${broadcastForceAll ? 'bg-[#D4AF37] border-[#D4AF37]' : 'bg-black border-zinc-800'}`}>
                      {broadcastForceAll && <span className="text-black font-extrabold text-[7.5px]">✓</span>}
                    </div>
                    <span className="text-zinc-300 font-bold uppercase">FORCER LA DIFFUSION À TOUS LES MEMBRES</span>
                  </div>
                  <span className="text-zinc-500 text-[7px] bg-zinc-950 px-1 py-0.5 rounded uppercase font-bold text-right shrink-0">
                    {broadcastForceAll ? 'TOUS LES MEMBRES' : 'FILTRÉ'}
                  </span>
                </div>
                <p className="text-[7.5px] text-zinc-500 leading-normal pl-5">
                  Si activé, tous les membres recevront le message, quel que soit leur historique de réception. Idéal pour envoyer une nouvelle annonce/information à tout le monde.
                </p>

                <div className="pt-1.5 border-t border-zinc-900/40 flex items-center justify-between">
                  <span className="text-zinc-400">HISTORIQUE DES ENVOIS EN COURS :</span>
                  <button
                    type="button"
                    onClick={handleResetBroadcastTracking}
                    disabled={loadingBroadcast || broadcasting}
                    className="px-2 py-1 rounded bg-zinc-950 hover:bg-neutral-900 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 transition cursor-pointer text-[7.5px] uppercase font-bold tracking-wider"
                  >
                    🔄 RÉINITIALISER LE STATUT 'DÉJÀ ENVOYÉ'
                  </button>
                </div>
              </div>

              {/* Broadcast Action Controls */}
              <div className="space-y-2 border-t border-zinc-950 pt-3">
                <button
                  type="button"
                  onClick={handleStartBroadcast}
                  disabled={broadcasting || loadingBroadcast || (!broadcastForceAll && (broadcastStats?.pendingCount ?? 0) === 0)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#D4AF37] disabled:bg-[#D4AF37]/25 disabled:text-zinc-500 text-black font-extrabold text-[10px] uppercase tracking-widest rounded-xl hover:bg-white transition cursor-pointer"
                >
                  {broadcasting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      <span>PROPAGATION EN COURS...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>{broadcastForceAll ? "📣 ENVOYER CE MESSAGE À TOUS LES MEMBRES" : "DÉBUTER LA DIFFUSION (FILTRÉE)"}</span>
                    </>
                  )}
                </button>

                {/* ROLLBACK BUTTON */}
                <button
                  type="button"
                  onClick={handleUndoLastBroadcast}
                  disabled={undoingBroadcast || broadcasting || editingBroadcast}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 border rounded-xl transition cursor-pointer font-bold text-[9px] uppercase tracking-wider ${
                    confirmUndoBroadcastState === 'confirm'
                      ? "bg-rose-950/40 border-rose-500 text-rose-300 animate-pulse"
                      : "border-rose-500/20 hover:border-rose-500/50 hover:bg-rose-950/10 text-rose-400"
                  }`}
                >
                  {undoingBroadcast ? (
                    <>
                      <div className="w-3 h-3 border-2 border-rose-500/30 border-t-rose-400 rounded-full animate-spin" />
                      <span>RETRAIT ET EFFACEMENT EN COURS...</span>
                    </>
                  ) : confirmUndoBroadcastState === 'confirm' ? (
                    <>
                      <AlertTriangle className="w-3 h-3 text-rose-400" />
                      <span>⚠️ TOUT EFFACER ? RE-CLIQUER POUR CONFIRMER LA SUPPRESSION DU BROADCAST 🗑️</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3 h-3 text-rose-500" />
                      <span>🗑️ Supprimer le dernier broadcast (Retirer des fils de discussion)</span>
                    </>
                  )}
                </button>

                {/* EDIT BROADCAST MESSAGE CONTENT BUTTON */}
                <button
                  type="button"
                  onClick={handleEditLastBroadcast}
                  disabled={editingBroadcast || broadcasting || undoingBroadcast}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 border rounded-xl transition cursor-pointer font-bold text-[9px] uppercase tracking-wider ${
                    confirmEditBroadcastState === 'confirm'
                      ? "bg-emerald-955/50 border-emerald-500 text-emerald-300 animate-pulse"
                      : "border-[#D4AF37]/20 hover:border-[#D4AF37]/60 hover:bg-[#D4AF37]/10 text-[#D4AF37]"
                  }`}
                >
                  {editingBroadcast ? (
                     <>
                      <div className="w-3 h-3 border-2 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin" />
                      <span>MISE À JOUR DU BROADCAST EN COURS...</span>
                     </>
                  ) : confirmEditBroadcastState === 'confirm' ? (
                    <>
                      <AlertTriangle className="w-3 h-3 text-emerald-450" />
                      <span>⚡ METTRE À JOUR MAINTENANT ? RE-CLIQUER POUR CONFIRMER LES MODIFICATIONS ✏️</span>
                    </>
                  ) : (
                    <>
                      <span>✏️ Mettre à jour le dernier broadcast avec le message et lien actuels</span>
                    </>
                  )}
                </button>

                 {editResult && (
                  <div className={`p-3 rounded-lg border text-[8.5px] ${
                    editResult.error 
                      ? 'bg-rose-950/20 border-rose-500/30 text-rose-400' 
                      : 'bg-emerald-950/10 border-emerald-500/25 text-zinc-300'
                  } space-y-2`}>
                    {editResult.error ? (
                      <div className="flex gap-1.5 items-center">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>Erreur : {editResult.error}</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <span className="text-emerald-400 block font-bold uppercase tracking-wider text-[8px]">✓ MODIFICATION DU BROADCAST COMPLÉTÉE</span>
                        <div className="grid grid-cols-3 gap-2 text-zinc-400 text-[8px] font-mono pt-1 border-t border-zinc-900 pb-1">
                          <span>Total traités : <strong className="text-white">{editResult.totalProcessed}</strong></span>
                          <span>Modifiés : <strong className="text-emerald-400">{editResult.editedCount}</strong></span>
                          <span>Échecs : <strong className="text-rose-400">{editResult.failedCount}</strong></span>
                        </div>
                        
                        {editResult.logs && editResult.logs.length > 0 && (
                          <div className="space-y-1 mt-1.5 max-h-32 overflow-y-auto pt-1 border-t border-zinc-900/60 font-mono text-[7px]">
                            <span className="text-[7.5px] text-[#D4AF37] block font-bold font-mono">🔍 JOURNAL DE DÉBOGAGE :</span>
                            <div className="space-y-1">
                              {editResult.logs.map((log: any, i: number) => (
                                <div key={i} className="p-1.5 bg-black border border-white/5 rounded text-[7.5px] space-y-1 leading-snug">
                                  <div className="flex justify-between gap-2">
                                    <span>Chat: <strong className="text-white select-all">{log.chatId}</strong> | Msg: <strong className="text-white select-all">{log.messageId}</strong></span>
                                    <span className={log.success ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                                      {log.success ? "SUCCÈS" : "ÉCHEC"}
                                    </span>
                                  </div>
                                  {!log.success && log.error && (
                                    <div className="text-rose-400 text-[7px]">
                                      Erreur : {log.error}
                                    </div>
                                  )}
                                  {log.telegramResponse && (
                                    <details className="text-[7px] text-zinc-500 cursor-pointer">
                                      <summary className="hover:text-zinc-300">Réponse brute Telegram (JSON)</summary>
                                      <pre className="p-1 bg-zinc-950 rounded text-zinc-400 mt-1 overflow-x-auto whitespace-pre-wrap max-w-full leading-tight select-all font-mono">
                                        {JSON.stringify(log.telegramResponse, null, 2)}
                                      </pre>
                                    </details>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {undoResult && (
                  <div className={`p-3 rounded-lg border text-[8.5px] ${
                    undoResult.error 
                      ? 'bg-rose-950/20 border-rose-500/30 text-rose-400' 
                      : 'bg-emerald-950/10 border-emerald-500/25 text-zinc-300'
                  } space-y-2`}>
                    {undoResult.error ? (
                      <div className="flex gap-1.5 items-center">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>Erreur : {undoResult.error}</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <span className="text-emerald-400 block font-bold uppercase tracking-wider text-[8px]">✓ RETRAIT DU BROADCAST COMPLÉTÉ</span>
                        <div className="grid grid-cols-3 gap-2 text-zinc-400 text-[8px] font-mono pt-1 border-t border-zinc-900 pb-1">
                          <span>Total traités : <strong className="text-white">{undoResult.totalProcessed}</strong></span>
                          <span>Supprimés : <strong className="text-emerald-400">{undoResult.deletedCount}</strong></span>
                          <span>Échecs : <strong className="text-rose-400">{undoResult.failedCount}</strong></span>
                        </div>
                        
                        {undoResult.logs && undoResult.logs.length > 0 && (
                          <div className="space-y-1 mt-1.5 max-h-32 overflow-y-auto pt-1 border-t border-zinc-900/60 font-mono text-[7px]">
                            <span className="text-[7.5px] text-[#D4AF37] block font-bold font-mono">🔍 JOURNAL DE DÉBOGAGE :</span>
                            <div className="space-y-1">
                              {undoResult.logs.map((log: any, i: number) => (
                                <div key={i} className="p-1.5 bg-black border border-white/5 rounded text-[7.5px] space-y-1 leading-snug">
                                  <div className="flex justify-between gap-2">
                                    <span>Chat: <strong className="text-white select-all">{log.chatId}</strong> | Msg: <strong className="text-white select-all">{log.messageId}</strong></span>
                                    <span className={log.success ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                                      {log.success ? "SUCCÈS" : "ÉCHEC"}
                                    </span>
                                  </div>
                                  {!log.success && log.error && (
                                    <div className="text-rose-400 text-[7px]">
                                      Erreur : {log.error}
                                    </div>
                                  )}
                                  {log.telegramResponse && (
                                    <details className="text-[7px] text-zinc-500 cursor-pointer">
                                      <summary className="hover:text-zinc-300">Réponse brute Telegram (JSON)</summary>
                                      <pre className="p-1 bg-zinc-950 rounded text-zinc-400 mt-1 overflow-x-auto whitespace-pre-wrap max-w-full leading-tight select-all font-mono">
                                        {JSON.stringify(log.telegramResponse, null, 2)}
                                      </pre>
                                    </details>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {broadcastResult && (
                  <div className={`p-3 rounded-lg border ${
                    broadcastResult.error 
                      ? 'bg-rose-950/20 border-rose-500/30 text-rose-400' 
                      : 'bg-emerald-950/10 border-emerald-500/25 text-zinc-300'
                  }`}>
                    {broadcastResult.error ? (
                      <div className="flex gap-1.5 items-center">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>Erreur : {broadcastResult.error}</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <span className="text-[#D4AF37] block font-bold text-[8.5px] uppercase tracking-wider">✓ DIFFUSION EXÉCUTÉE ET ENREGISTRÉE</span>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-zinc-400 text-[8px] font-mono mt-1 pt-1 border-t border-zinc-900">
                          <span>Utilisateurs scannés : <strong className="text-white">{broadcastResult.totalDiscovered}</strong></span>
                          <span>Déjà envoyés : <strong className="text-white">{broadcastResult.alreadySent}</strong></span>
                          <span>Envoyés avec succès : <strong className="text-emerald-400">{broadcastResult.sentThisTurn}</strong></span>
                          <span>Échecs d'envoi : <strong className="text-rose-400">{broadcastResult.failedThisTurn}</strong></span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* EMERGENCY MANUAL TELEGRAM ADMIN TOOL CARD */}
            <div className="bg-[#111] p-3.5 rounded-xl border border-white/5 space-y-3">
              <div className="border-b border-[#222] pb-1.5">
                <span className="text-[9px] font-mono text-[#D4AF37] font-extrabold uppercase tracking-widest flex items-center gap-1.5">
                  🛠️ OUTIL DE CORRECTION MANUELLE ET SUPPRESSION D'URGENCE
                </span>
                <p className="text-[7.5px] text-zinc-400 mt-0.5">
                  Permet de supprimer ou de modifier n'importe quel message Telegram envoyé en saisissant directement l'identifiant de la discussion (Chat ID) et le numéro du message (Message ID).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Search / Target Coordinates */}
                <div className="space-y-2">
                  <div>
                    <label className="text-zinc-500 block text-[7.5px] font-bold uppercase">Chat ID (Discussion ou Canal Telegram) :</label>
                    <input
                      type="text"
                      placeholder="Ex: 8464716562 ou -100xxxxxxxxxx"
                      value={manualChatId}
                      onChange={(e) => setManualChatId(e.target.value)}
                      className="w-full bg-black border border-white/5 focus:border-[#D4AF37] rounded-lg px-2.5 py-1.5 text-[8.5px] font-mono text-white placeholder-zinc-650 focus:outline-none mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-500 block text-[7.5px] font-bold uppercase">Message ID (Numéro unique de message) :</label>
                    <input
                      type="text"
                      placeholder="Ex: 45 ou 2135"
                      value={manualMessageId}
                      onChange={(e) => setManualMessageId(e.target.value)}
                      className="w-full bg-black border border-white/5 focus:border-[#D4AF37] rounded-lg px-2.5 py-1.5 text-[8.5px] font-mono text-white placeholder-zinc-650 focus:outline-none mt-1"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      id="manualHasPhoto"
                      type="checkbox"
                      checked={manualHasPhoto}
                      onChange={(e) => setManualHasPhoto(e.target.checked)}
                      className="w-3 h-3 accent-[#D4AF37]"
                    />
                    <label htmlFor="manualHasPhoto" className="text-zinc-400 text-[8px] font-mono cursor-pointer select-none">
                      Le message cible contient une Photo / Image
                    </label>
                  </div>
                </div>

                {/* Edit Content Form */}
                <div className="space-y-2 border-t md:border-t-0 md:border-l border-zinc-900 pt-3.5 md:pt-0 md:pl-3.5">
                  <div>
                    <label className="text-zinc-500 block text-[7.5px] font-bold uppercase">Nouveau texte ou description :</label>
                    <textarea
                      rows={2}
                      placeholder="..."
                      value={manualText}
                      onChange={(e) => setManualText(e.target.value)}
                      className="w-full bg-black border border-white/5 focus:border-[#D4AF37] rounded-lg px-2.5 py-1.5 text-[8.5px] font-sans text-white focus:outline-none mt-1 resize-y"
                    />
                  </div>

                   <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-zinc-500 block text-[7.5px] font-bold uppercase">Lien redirection bouton 1 :</label>
                      <input
                        type="text"
                        placeholder="https://..."
                        value={manualUrl}
                        onChange={(e) => setManualUrl(e.target.value)}
                        className="w-full bg-black border border-white/5 focus:border-[#D4AF37] rounded-lg px-2 py-1 text-[8px] font-mono text-white focus:outline-none mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-zinc-500 block text-[7.5px] font-bold uppercase">Label bouton 1 :</label>
                      <input
                        type="text"
                        placeholder="Ex: Boutique 🛍️"
                        value={manualBtnLabel}
                        onChange={(e) => setManualBtnLabel(e.target.value)}
                        className="w-full bg-black border border-white/5 focus:border-[#D4AF37] rounded-lg px-2 py-1 text-[8px] font-sans text-white focus:outline-none mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div>
                      <label className="text-zinc-500 block text-[7.5px] font-bold uppercase">Lien redirection bouton 2 (Optionnel) :</label>
                      <input
                        type="text"
                        placeholder="https://..."
                        value={manualUrl2}
                        onChange={(e) => {
                          setManualUrl2(e.target.value);
                          localStorage.setItem('hl_manual_url2', e.target.value);
                        }}
                        className="w-full bg-black border border-white/5 focus:border-[#D4AF37] rounded-lg px-2 py-1 text-[8px] font-mono text-white focus:outline-none mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-zinc-500 block text-[7.5px] font-bold uppercase">Label bouton 2 (Optionnel) :</label>
                      <input
                        type="text"
                        placeholder="Ex: Canal Telegram 📢"
                        value={manualBtnLabel2}
                        onChange={(e) => {
                          setManualBtnLabel2(e.target.value);
                          localStorage.setItem('hl_manual_btn2', e.target.value);
                        }}
                        className="w-full bg-black border border-white/5 focus:border-[#D4AF37] rounded-lg px-2 py-1 text-[8px] font-sans text-white focus:outline-none mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Action Controls */}
              <div className="grid grid-cols-2 gap-2 border-t border-zinc-950 pt-3">
                <button
                  type="button"
                  onClick={handleManualDeleteMessage}
                  disabled={manualLoading}
                  className={`flex items-center justify-center gap-1.5 py-2 border rounded-lg transition cursor-pointer font-bold text-[8.5px] uppercase tracking-wider ${
                    confirmDeleteState === 'confirm'
                      ? "bg-rose-950/40 border-rose-500 text-rose-300 animate-pulse"
                      : "border-rose-500/20 hover:border-rose-500/50 hover:bg-rose-950/10 text-rose-450"
                  }`}
                >
                  {manualLoading 
                    ? "..." 
                    : confirmDeleteState === 'confirm' 
                      ? "⚠️ CLIQUER POUR CONFIRMER LA SUPPRESSION 🗑️" 
                      : "🗑️ Supprimer le Message"
                  }
                </button>
                <button
                  type="button"
                  onClick={handleManualEditMessage}
                  disabled={manualLoading}
                  className={`flex items-center justify-center gap-1.5 py-2 border rounded-lg transition cursor-pointer font-bold text-[8.5px] uppercase tracking-wider ${
                    confirmEditState === 'confirm'
                      ? "bg-emerald-950/40 border-emerald-500 text-emerald-300 animate-pulse"
                      : "border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-950/10 text-emerald-400"
                  }`}
                >
                  {manualLoading 
                    ? "..." 
                    : confirmEditState === 'confirm' 
                      ? "⚡ CLIQUER POUR CONFIRMER LA MODIFICATION ✏️" 
                      : "✏️ Modifier le Message"
                  }
                </button>
              </div>

               {manualResultMsg && (
                <div className={`p-2.5 rounded-lg border text-[8px] font-mono space-y-2 ${
                  manualResultMsg.success ? "bg-emerald-950/10 border-emerald-500/25 text-emerald-400" : "bg-rose-950/20 border-rose-500/30 text-rose-400"
                }`}>
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="font-bold">{manualResultMsg.msg}</span>
                  </div>
                  
                  {manualResultMsg.log && (
                    <div className="p-1.5 bg-black/50 border border-zinc-800/60 rounded text-[7.5px] space-y-1 leading-snug text-zinc-300">
                      <div>Chat ID utilisé : <strong className="text-white select-all">{manualResultMsg.log.chatId}</strong></div>
                      <div>Message ID utilisé : <strong className="text-white select-all">{manualResultMsg.log.messageId}</strong></div>
                      {!manualResultMsg.success && manualResultMsg.log.error && (
                        <div className="text-rose-400">Erreur exacte : {manualResultMsg.log.error}</div>
                      )}
                      {manualResultMsg.log.telegramResponse && (
                        <details className="text-[7px] text-zinc-500 cursor-pointer pt-0.5">
                          <summary className="hover:text-zinc-350">Réponse brute Telegram (JSON)</summary>
                          <pre className="p-1 bg-zinc-950 rounded text-zinc-400 mt-1 overflow-x-auto whitespace-pre-wrap max-w-full font-mono text-[6.5px] leading-tight">
                            {JSON.stringify(manualResultMsg.log.telegramResponse, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* LISTE DES MESSAGES DU DERNIER BROADCAST ACTIF POUR COPIE RAPIDE */}
              {broadcastStats?.lastBroadcast && broadcastStats.lastBroadcast.length > 0 && (
                <div className="pt-2 border-t border-[#222] space-y-2">
                  <span className="text-[#D4AF37] block text-[8px] uppercase tracking-wider font-extrabold flex items-center gap-1.5">
                    📋 MESSAGES DU DERNIER BROADCAST ACTIF ({broadcastStats.lastBroadcast.length}) :
                  </span>
                  <div className="max-h-32 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-zinc-800 pr-1">
                    {broadcastStats.lastBroadcast.map((item: any, idx: number) => (
                      <div 
                        key={idx} 
                        className="flex items-center justify-between gap-2 p-1.5 bg-zinc-950 border border-white/5 rounded text-[7.5px] font-mono hover:border-[#D4AF37]/30 transition"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex gap-2">
                            <span>Chat: <strong className="text-white select-all">{item.chatId}</strong></span>
                            <span>Msg: <strong className="text-white select-all">{item.messageId}</strong></span>
                          </div>
                          <div className="text-[6.5px] text-zinc-550">
                            Envoyé: {item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : 'N/A'}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic('light');
                            setManualChatId(item.chatId);
                            setManualMessageId(String(item.messageId));
                            localStorage.setItem('hl_manual_chat_id', item.chatId);
                            localStorage.setItem('hl_manual_msg_id', String(item.messageId));
                            
                            // Animates selection notice with visual feedback
                            setManualResultMsg({
                              success: true,
                              msg: `🎯 ID du message ${item.messageId} chargé avec succès !`
                            });
                          }}
                          className="px-1 py-0.5 border border-[#D4AF37]/20 hover:border-[#D4AF37]/60 hover:bg-[#D4AF37]/10 text-[#D4AF37] text-[6.5px] font-sans font-bold uppercase rounded cursor-pointer"
                        >
                          Sélectionner 🎯
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB F: VIP MEMBERS ACCOUNTS */}
        {activeTab === 'vip' && (
          <motion.div
            key="tab-vip"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="bg-[#111] p-3.5 rounded-xl border border-white/5 space-y-3">
              <div className="flex items-center justify-between border-b border-[#222] pb-2">
                <span className="text-[9px] font-mono text-[#D4AF37] font-extrabold uppercase tracking-widest">
                  👑 COMPTES VIP ET ESPACE MEMBRES ({vipUsers.length})
                </span>
                <button
                  type="button"
                  onClick={fetchVipUsers}
                  className="px-2.5 py-1 rounded bg-[#222] hover:bg-neutral-850 text-[8px] font-mono uppercase tracking-wider text-gray-300"
                >
                  🔄 Actualiser
                </button>
              </div>

              {loadingVip ? (
                <div className="py-8 text-center text-zinc-500 text-[9px] font-mono">
                  Chargement des profils d'élite...
                </div>
              ) : vipUsers.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 text-[9px] font-mono">
                  Aucun membre enregistré pour le moment.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[9px] font-mono">
                    <thead>
                      <tr className="border-b border-[#222] text-[#C5A880] uppercase">
                        <th className="py-2">Client (Pseudo)</th>
                        <th className="py-2">Niveau VIP</th>
                        <th className="py-2 text-center">Points</th>
                        <th className="py-2 text-center">Commandes</th>
                        <th className="py-2 text-right">Dépenses</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900">
                      {vipUsers.map((user) => {
                        const points = user.points || 0;
                        const ordersCount = user.ordersCount || 0;
                        const totalSpent = user.totalSpent || 0;
                        
                        // VIP Levels mapping
                        let levelName = '🥉 Member';
                        let levelColor = 'text-gray-400';
                        if (ordersCount >= 15) {
                          levelName = '💎 Elite';
                          levelColor = 'text-cyan-400 font-extrabold';
                        } else if (ordersCount >= 8) {
                          levelName = '🥇 Gold';
                          levelColor = 'text-amber-400 font-extrabold';
                        } else if (ordersCount >= 3) {
                          levelName = '🥈 Silver';
                          levelColor = 'text-zinc-300 font-semibold';
                        }

                        return (
                          <tr key={user.telegramId} className="hover:bg-white/5 transition-colors">
                            <td className="py-2.5 pr-2">
                              <span className="block text-white font-bold">{user.pseudo || "Membre 👽⛰️ALIENS FARMS OFFICIEL⛰️👽"}</span>
                              <span className="text-[7.5px] text-zinc-500">ID: {user.telegramId} @{user.username || 'N/A'}</span>
                            </td>
                            <td className="py-2.5">
                              <span className={`px-1.5 py-0.5 rounded bg-black/60 border border-white/5 ${levelColor}`}>
                                {levelName}
                              </span>
                            </td>
                            <td className="py-2.5 text-center font-bold text-amber-300">
                              {points} pts
                            </td>
                            <td className="py-2.5 text-center text-zinc-300">
                              {ordersCount}
                            </td>
                            <td className="py-2.5 text-right font-bold text-emerald-400">
                              {totalSpent.toLocaleString('fr-FR')} €
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB G: MANAGEABLE LOYALTY REWARDS */}
        {activeTab === 'rewards' && (
          <motion.div
            key="tab-rewards"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* ADD/EDIT REWARD FORM */}
            <div className="bg-[#111] p-3.5 rounded-xl border border-white/5 space-y-3">
              <span className="block text-[9px] font-mono text-[#D4AF37] font-extrabold uppercase tracking-widest">
                {editingReward ? '📝 MODIFIER UNE RÉCOMPENSE' : '＋ AJOUTER UNE NOUVELLE RÉCOMPENSE DE FIDÉLITÉ'}
              </span>

              {editingReward ? (
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!editingReward.title || !editingReward.description) {
                      setErrorMsg('Veuillez remplir le titre et la description.');
                      setTimeout(() => setErrorMsg(''), 3000);
                      return;
                    }
                    const rewardData: Reward = {
                      id: editingReward.id || 'reward-' + Math.random().toString(36).substring(2, 9),
                      title: editingReward.title,
                      description: editingReward.description,
                      minOrders: Number(editingReward.minOrders || 1),
                      isActive: editingReward.isActive ?? true,
                      promoCode: editingReward.promoCode || ''
                    };
                    await handleSaveReward(rewardData);
                  }} 
                  className="space-y-3"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[7.5px] font-mono text-zinc-500 uppercase font-bold mb-1">Titre de la récompense</label>
                      <input
                        type="text"
                        value={editingReward.title || ''}
                        onChange={(e) => setEditingReward({ ...editingReward, title: e.target.value })}
                        placeholder="Ex: Grinder Gold 24K"
                        className="w-full bg-[#181818] border border-zinc-850 focus:border-[#D4AF37] rounded p-2 text-[9px] text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[7.5px] font-mono text-zinc-500 uppercase font-bold mb-1">Commandes requises</label>
                      <input
                        type="number"
                        min="1"
                        value={editingReward.minOrders || ''}
                        onChange={(e) => setEditingReward({ ...editingReward, minOrders: Number(e.target.value) })}
                        placeholder="Ex: 5"
                        className="w-full bg-[#181818] border border-zinc-850 focus:border-[#D4AF37] rounded p-2 text-[9px] text-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[7.5px] font-mono text-zinc-500 uppercase font-bold mb-1">Code Promo Débloqué (Optionnel)</label>
                      <input
                        type="text"
                        value={editingReward.promoCode || ''}
                        onChange={(e) => setEditingReward({ ...editingReward, promoCode: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                        placeholder="Ex: CADEAU24K"
                        className="w-full bg-[#181818] border border-zinc-850 focus:border-[#D4AF37] rounded p-2 text-[9px] text-white font-mono uppercase"
                      />
                    </div>
                    <div className="flex items-center pt-5">
                      <label className="flex items-center gap-2 text-[8px] font-mono text-zinc-300 uppercase font-bold cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={editingReward.isActive ?? true}
                          onChange={(e) => setEditingReward({ ...editingReward, isActive: e.target.checked })}
                          className="w-3.5 h-3.5 bg-zinc-950 border border-zinc-800 accent-[#D4AF37] rounded"
                        />
                        <span>Récompense active ?</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[7.5px] font-mono text-zinc-500 uppercase font-bold mb-1">Description élégante</label>
                    <textarea
                      value={editingReward.description || ''}
                      onChange={(e) => setEditingReward({ ...editingReward, description: e.target.value })}
                      placeholder="Décrivez cet objet d'élite ou cette réduction offerte..."
                      className="w-full bg-[#181818] border border-zinc-850 focus:border-[#D4AF37] rounded p-2 text-[9px] text-white h-16"
                      required
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-2 bg-[#D4AF37] hover:bg-white text-black font-extrabold text-[8px] uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                    >
                      💾 Sauvegarder la Récompense
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingReward(null)}
                      className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:text-white text-zinc-400 text-[8px] uppercase font-mono rounded-lg transition-all cursor-pointer"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              ) : (
                <div className="pt-1.5">
                  <button
                    type="button"
                    onClick={() => setEditingReward({ minOrders: 3, isActive: true })}
                    className="w-full py-2 bg-zinc-950 border border-zinc-850 hover:border-[#D4AF37] text-zinc-400 hover:text-[#D4AF37] font-bold text-[8.5px] uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                  >
                    ＋ AJOUTER UNE NOUVELLE RÉCOMPENSE
                  </button>
                </div>
              )}
            </div>

            {/* LIST ACTIVE REWARDS */}
            <div className="bg-[#111] p-3.5 rounded-xl border border-white/5 space-y-3">
              <span className="block text-[9px] font-mono text-zinc-500 font-extrabold uppercase tracking-widest pl-1">
                📋 CATALOGUE DES RÉCOMPENSES 👽⛰️ALIENS FARMS OFFICIEL⛰️👽 DELUXE
              </span>

              {loadingRewards ? (
                <div className="py-8 text-center text-zinc-650 text-[8.5px] font-mono">
                  Chargement de la réserve de cadeaux...
                </div>
              ) : rewardsList.length === 0 ? (
                <div className="py-8 text-center text-zinc-650 text-[8.5px] font-mono">
                  Aucune récompense fidélité paramétrée. Créez-en une ci-dessus !
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {rewardsList.map((reward) => (
                    <div 
                      key={reward.id} 
                      className={`p-3 rounded-lg border transition ${reward.isActive ? 'bg-black/60 border-zinc-900 hover:border-[#D4AF37]/50' : 'bg-black/20 border-zinc-950 opacity-60'}`}
                    >
                      <div className="flex items-start justify-between gap-2 border-b border-zinc-900 pb-1.5">
                        <div>
                          <h4 className="text-[10px] text-white font-extrabold font-sans flex items-center gap-1.5 leading-tight">
                            <span>🎁 {reward.title}</span>
                            {!reward.isActive && <span className="text-[6.5px] bg-red-950/20 text-red-500 border border-red-500/10 px-1 rounded uppercase tracking-wide">Désactivé</span>}
                          </h4>
                          <span className="text-[8px] font-mono text-[#D4AF37] mt-0.5 block font-bold uppercase">
                            Déblocage : {reward.minOrders} command{reward.minOrders > 1 ? 'es' : 'e'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              triggerHaptic('light');
                              setEditingReward({ ...reward });
                            }}
                            className="p-1 rounded bg-[#222] hover:bg-neutral-850 text-gray-400 hover:text-white"
                          >
                            <Edit3 className="w-2.5 h-2.5" />
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (confirmDeleteRewardId === reward.id) {
                                triggerHaptic('heavy');
                                setConfirmDeleteRewardId(null);
                                await handleDeleteReward(reward.id);
                              } else {
                                triggerHaptic('warning');
                                setConfirmDeleteRewardId(reward.id);
                                setTimeout(() => {
                                  setConfirmDeleteRewardId(prev => prev === reward.id ? null : prev);
                                }, 4000);
                              }
                            }}
                            className={`p-1 rounded transition border text-[7px] font-sans font-bold flex items-center justify-center ${
                              confirmDeleteRewardId === reward.id
                                ? "bg-rose-600 border-rose-700 text-white px-2 animate-pulse"
                                : "bg-rose-950/20 hover:bg-rose-900 border-rose-950 text-rose-450 hover:text-white"
                            }`}
                          >
                            {confirmDeleteRewardId === reward.id ? "CONFIRMER ? 🗑️" : <Trash2 className="w-2.5 h-2.5" />}
                          </button>
                        </div>
                      </div>

                      <p className="text-[8.5px] text-zinc-400 mt-1.5 font-sans leading-normal">
                        {reward.description}
                      </p>

                      {reward.promoCode && (
                        <div className="mt-2 text-[7.5px] font-mono bg-[#1c1c1c] p-1.5 rounded border border-white/5 flex items-center justify-between">
                          <span className="text-zinc-500">CODE DIRECT :</span>
                          <span className="text-[#D4AF37] font-bold tracking-wider">{reward.promoCode}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB H: MANAGEABLE PROMO CODES */}
        {activeTab === 'promos' && (
          <motion.div
            key="tab-promos"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* ADD/EDIT PROMO CODE FORM */}
            <div className="bg-[#111] p-3.5 rounded-xl border border-white/5 space-y-3">
              <span className="block text-[9px] font-mono text-[#D4AF37] font-extrabold uppercase tracking-widest">
                {editingPromo ? '📝 MODIFIER CODE DE REDUCTION' : '＋ CRÉER UN CODE PROMO PRIVÉ'}
              </span>

              {editingPromo ? (
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!editingPromo.code || editingPromo.value === undefined || editingPromo.value <= 0) {
                      setErrorMsg('Veuillez remplir le code promo et spécifier une valeur positive.');
                      setTimeout(() => setErrorMsg(''), 3000);
                      return;
                    }
                    const promoData: PromoCode = {
                      id: editingPromo.id || 'promo-' + Math.random().toString(36).substring(2, 9),
                      code: editingPromo.code.toUpperCase().replace(/\s+/g, ''),
                      type: editingPromo.type || 'percent',
                      value: Number(editingPromo.value || 0),
                      maxUses: editingPromo.maxUses ? Number(editingPromo.maxUses) : undefined,
                      timesUsed: editingPromo.timesUsed || 0,
                      expiredAt: editingPromo.expiredAt || undefined,
                      isActive: editingPromo.isActive ?? true
                    };
                    await handleSavePromo(promoData);
                  }} 
                  className="space-y-3"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[7.5px] font-mono text-zinc-500 uppercase font-bold mb-1">Code Promo unique</label>
                      <input
                        type="text"
                        value={editingPromo.code || ''}
                        onChange={(e) => setEditingPromo({ ...editingPromo, code: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                        placeholder="Ex: VIPHASH20"
                        className="w-full bg-[#181818] border border-zinc-850 focus:border-[#D4AF37] rounded p-2 text-[9px] text-white font-mono uppercase font-bold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[7.5px] font-mono text-zinc-500 uppercase font-bold mb-1">Type de réduction</label>
                      <select
                        value={editingPromo.type || 'percent'}
                        onChange={(e) => setEditingPromo({ ...editingPromo, type: e.target.value as 'fixed' | 'percent' })}
                        className="w-full bg-[#181818] border border-zinc-850 focus:border-[#D4AF37] rounded p-2 text-[9px] text-white font-mono"
                      >
                        <option value="percent font-bold">Pourcentage (%)</option>
                        <option value="fixed font-bold">Réduction Fixe (€)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[7.5px] font-mono text-zinc-500 uppercase font-bold mb-1">Valeur de la réduction</label>
                      <input
                        type="number"
                        min="1"
                        value={editingPromo.value || ''}
                        onChange={(e) => setEditingPromo({ ...editingPromo, value: Number(e.target.value) })}
                        placeholder="Ex: 20 (pour 20% ou 20 €)"
                        className="w-full bg-[#181818] border border-zinc-850 focus:border-[#D4AF37] rounded p-2 text-[9px] text-white font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[7.5px] font-mono text-zinc-500 uppercase font-bold mb-1">Limite d'utilisation max</label>
                      <input
                        type="number"
                        min="1"
                        value={editingPromo.maxUses || ''}
                        onChange={(e) => setEditingPromo({ ...editingPromo, maxUses: e.target.value ? Number(e.target.value) : undefined })}
                        placeholder="Ex: 50 (Vide = Illimité)"
                        className="w-full bg-[#181818] border border-zinc-850 focus:border-[#D4AF37] rounded p-2 text-[9px] text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[7.5px] font-mono text-zinc-500 uppercase font-bold mb-1">Date d'expiration</label>
                      <input
                        type="date"
                        value={editingPromo.expiredAt || ''}
                        onChange={(e) => setEditingPromo({ ...editingPromo, expiredAt: e.target.value })}
                        className="w-full bg-[#181818] border border-zinc-850 focus:border-[#D4AF37] rounded p-2 text-[9px] text-white font-mono"
                      />
                    </div>
                    <div className="flex items-center pt-5">
                      <label className="flex items-center gap-2 text-[8px] font-mono text-zinc-300 uppercase font-bold cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={editingPromo.isActive ?? true}
                          onChange={(e) => setEditingPromo({ ...editingPromo, isActive: e.target.checked })}
                          className="w-3.5 h-3.5 bg-zinc-950 border border-zinc-800 accent-[#D4AF37] rounded"
                        />
                        <span>Code promo actif ?</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-2 bg-[#D4AF37] hover:bg-white text-black font-extrabold text-[8px] uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                    >
                      💾 Enregistrer le Code Promo
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingPromo(null)}
                      className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:text-white text-zinc-400 text-[8px] uppercase font-mono rounded-lg transition-all cursor-pointer"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              ) : (
                <div className="pt-1.5">
                  <button
                    type="button"
                    onClick={() => setEditingPromo({ type: 'percent', value: 10, isActive: true, timesUsed: 0 })}
                    className="w-full py-2 bg-zinc-950 border border-zinc-850 hover:border-[#D4AF37] text-zinc-400 hover:text-[#D4AF37] font-bold text-[8.5px] uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                  >
                    ＋ AJOUTER UN NOUVEAU CODE DE REDUCTION
                  </button>
                </div>
              )}
            </div>

            {/* LIST ACTIVE PROMOS */}
            <div className="bg-[#111] p-3.5 rounded-xl border border-white/5 space-y-3">
              <span className="block text-[9px] font-mono text-zinc-500 font-extrabold uppercase tracking-widest pl-1">
                📋 CODE DE RÉDUCTIONS SAUVEGARDÉS
              </span>

              {loadingPromos ? (
                <div className="py-8 text-center text-zinc-650 text-[8.5px] font-mono">
                  Chargement de la soute de coupons...
                </div>
              ) : promosList.length === 0 ? (
                <div className="py-8 text-center text-zinc-650 text-[8.5px] font-mono">
                  Aucun coupon en soute. Créez-en un nouveau ci-dessus !
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[9px] font-mono">
                    <thead>
                      <tr className="border-b border-[#222] text-[#C5A880] uppercase">
                        <th className="py-2">Code</th>
                        <th className="py-2">Avantage</th>
                        <th className="py-2 text-center">Usages</th>
                        <th className="py-2">Fin Validité</th>
                        <th className="py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900">
                      {promosList.map((promo) => {
                        const hasExpiration = !!promo.expiredAt;
                        const isExpired = hasExpiration && new Date(promo.expiredAt!) < new Date(new Date().setHours(0,0,0,0));
                        const isLimitReached = promo.maxUses ? (promo.timesUsed || 0) >= promo.maxUses : false;
                        const ok = promo.isActive && !isExpired && !isLimitReached;

                        return (
                          <tr key={promo.id} className={`hover:bg-white/5 transition-colors ${ok ? '' : 'opacity-55'}`}>
                            <td className="py-2">
                              <span className="block font-bold text-white tracking-wider bg-zinc-950 inline-block px-1.5 py-0.5 rounded border border-white/5">{promo.code}</span>
                            </td>
                            <td className="py-2 text-[#D4AF37] font-bold">
                              {promo.type === 'percent' ? `-${promo.value}%` : `-${promo.value} €`}
                            </td>
                            <td className="py-2 text-center">
                              {promo.timesUsed || 0} / {promo.maxUses || '∞'}
                            </td>
                            <td className="py-2 text-zinc-400">
                              {promo.expiredAt ? (
                                <span className={isExpired ? 'text-red-400' : 'text-zinc-500'}>
                                  {isExpired ? '⌛ Expiré' : promo.expiredAt}
                                </span>
                              ) : (
                                <span className="text-zinc-600">Jamais</span>
                              )}
                            </td>
                            <td className="py-2 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    triggerHaptic('light');
                                    setEditingPromo({ ...promo });
                                  }}
                                  className="p-1 rounded bg-[#222] hover:bg-neutral-850 text-gray-400 hover:text-white"
                                >
                                  <Edit3 className="w-2.5 h-2.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (confirmDeletePromoId === promo.id) {
                                      triggerHaptic('heavy');
                                      setConfirmDeletePromoId(null);
                                      await handleDeletePromo(promo.id);
                                    } else {
                                      triggerHaptic('warning');
                                      setConfirmDeletePromoId(promo.id);
                                      setTimeout(() => {
                                        setConfirmDeletePromoId(prev => prev === promo.id ? null : prev);
                                      }, 4000);
                                    }
                                  }}
                                  className={`p-1 rounded transition border text-[7px] font-sans font-bold flex items-center justify-center ${
                                    confirmDeletePromoId === promo.id
                                      ? "bg-rose-600 border-rose-700 text-white px-2 animate-pulse"
                                      : "bg-rose-950/20 hover:bg-rose-900 border-rose-950 text-rose-450 hover:text-white"
                                  }`}
                                >
                                  {confirmDeletePromoId === promo.id ? "CONFIRMER ? 🗑️" : <Trash2 className="w-2.5 h-2.5" />}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}

       {uploadStatus.isActive && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
           <div className="w-full max-w-lg bg-zinc-950 border border-[#D4AF37]/35 rounded-xl p-5 shadow-2xl flex flex-col gap-4">
             {/* Title */}
             <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-ping" />
                 <h3 className="font-sans font-bold text-[11px] text-[#F5EFEB] uppercase tracking-wider">
                   Traitement de média haute précision
                 </h3>
               </div>
               <span className="font-mono text-[7px] text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 break-all select-all">{uploadStatus.filename}</span>
             </div>

             {/* Stepper Progression: Téléversement -> Vérification -> Stockage -> Terminé */}
             <div className="grid grid-cols-4 gap-1 text-center py-2 relative">
               {(() => {
                 const stepOrder = ['upload', 'verify', 'store', 'done'];
                 const currentIndex = stepOrder.indexOf(uploadStatus.step);
                 
                 return stepOrder.map((stKey, idx) => {
                   const isCompleted = uploadStatus.step === 'error' 
                     ? idx < currentIndex 
                     : uploadStatus.step === 'done' || idx <= currentIndex;
                   const isActive = uploadStatus.step === stKey;
                   const isPending = !isCompleted && !isActive;
                   const isError = uploadStatus.step === 'error' && idx === currentIndex;

                   let indicatorBg = 'bg-[#111] text-zinc-400 border-zinc-900';
                   let labelColor = 'text-zinc-650';

                   if (isCompleted) {
                     indicatorBg = 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/50';
                     labelColor = 'text-[#D4AF37] font-bold';
                   } else if (isActive) {
                     indicatorBg = 'bg-zinc-900 text-white border-zinc-500 animate-pulse';
                     labelColor = 'text-white font-bold';
                   } else if (isError) {
                     indicatorBg = 'bg-red-950/40 text-red-400 border-red-500';
                     labelColor = 'text-red-400 font-bold';
                   }

                   const labelStr = stKey === 'upload' ? 'Téléversement' 
                     : stKey === 'verify' ? 'Vérification'
                     : stKey === 'store' ? 'Stockage'
                     : 'Terminé';

                   return (
                     <div key={stKey} className="flex flex-col items-center gap-1.5 relative z-10">
                       <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-mono text-[10px] font-extrabold ${indicatorBg}`}>
                         {isCompleted && uploadStatus.step !== 'error' ? '✓' : isError ? '✕' : idx + 1}
                       </div>
                       <span className={`text-[8px] tracking-tight uppercase ${labelColor}`}>
                         {labelStr}
                       </span>
                       {idx < 3 && (
                         <div className={`hidden sm:block absolute top-[15px] left-[55%] right-[-45%] h-[1px] -z-10 ${
                           uploadStatus.step === 'done' || idx < currentIndex ? 'bg-[#D4AF37]/35' : 'bg-zinc-900'
                         }`} />
                       )}
                     </div>
                   );
                 });
               })()}
             </div>

             {/* Progress Bar & Percent */}
             <div className="flex flex-col gap-1.5 bg-zinc-900/40 p-3 rounded-lg border border-zinc-900">
               <div className="flex justify-between items-center text-[9px] font-mono">
                 <span className="text-zinc-400 uppercase tracking-widest">Opération en cours</span>
                 <span className="text-[#D4AF37] font-bold">{uploadStatus.percent}%</span>
               </div>
               <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden border border-zinc-900">
                 <div 
                   className="bg-gradient-to-r from-[#D4AF37] to-[#F3E9C9] h-full transition-all duration-300 rounded-full"
                   style={{ width: `${uploadStatus.percent}%` }}
                 />
               </div>
             </div>

             {/* Live Logging Console (error logs and persistent confirmations) */}
             <div className="flex flex-col gap-1">
               <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">Détails d'exécution en temps réel :</span>
               <div className="h-44 bg-black border border-zinc-900 rounded-lg p-3 overflow-y-auto font-mono text-[8.5px] leading-relaxed flex flex-col gap-1.5 text-zinc-400 select-text">
                 {uploadStatus.logs.length === 0 ? (
                   <span className="text-zinc-700 italic">[Aucun log émis]</span>
                 ) : (
                   uploadStatus.logs.map((logLine, lIdx) => (
                     <div 
                       key={lIdx} 
                       className={`${
                         logLine.includes('[ERREUR]') || logLine.includes('[ERROR]') ? 'text-red-400 bg-red-950/20 p-1.5 rounded border border-red-950/45' 
                         : logLine.includes('[TERMINÉ]') || logLine.includes('[SUCCÈS]') ? 'text-[#D4AF37]' 
                         : logLine.includes('[STOCKAGE]') ? 'text-cyan-400'
                         : 'text-zinc-400'
                       }`}
                     >
                       {logLine}
                     </div>
                   ))
                 )}
               </div>
             </div>

             {/* HTTP Error diagnostic card */}
             {uploadStatus.step === 'error' && (
               <div className="bg-red-950/30 border border-red-500/30 rounded-lg p-3 flex flex-col gap-1">
                 <div className="flex items-center gap-2 text-red-400 font-extrabold text-[9px] uppercase">
                   <span>Rapport Diagnostic :</span>
                   <span className="bg-red-900/30 px-1.5 py-0.5 rounded border border-red-500/40 text-[9px] font-mono">
                     {uploadStatus.httpStatus ? `HTTP ${uploadStatus.httpStatus}` : 'RECHERCHE D\'ACCÈS'}
                   </span>
                 </div>
                 <p className="text-red-100 text-[9px] font-sans">
                   Erreur : {uploadStatus.error || "Une erreur fatale s'est produite lors de la transmission ou du transcodage. Veuillez re-vérifier la connexion internet."}
                 </p>
                 {uploadStatus.httpResponse && (
                   <div className="mt-1">
                     <span className="text-[7.5px] font-mono text-zinc-500 block uppercase">Réponse serveur brute :</span>
                     <pre className="text-[8px] bg-black/60 p-1.5 rounded border border-[#222] font-mono text-zinc-500 overflow-x-auto max-w-full whitespace-pre-wrap">
                       {uploadStatus.httpResponse}
                     </pre>
                   </div>
                 )}
               </div>
             )}

             {/* Final confirmation when written to storage */}
             {uploadStatus.step === 'done' && (
               <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-lg p-3 flex flex-col gap-1">
                 <div className="flex items-center gap-2 text-[#D4AF37] font-extrabold text-[9px] uppercase">
                   <span className="tracking-widest">Écriture sur stockage final : CONFIRMÉE ✓</span>
                 </div>
                 <p className="text-zinc-300 text-[9px] font-sans">
                   {uploadStatus.message || "Le fichier a été retranscrit et stocké de manière permanente dans le cloud. Aucune perte possible."}
                 </p>
               </div>
             )}

             {/* Action footer */}
             <div className="flex justify-end gap-2 border-t border-zinc-900 pt-3">
               {(uploadStatus.step === 'done' || uploadStatus.step === 'error') && (
                 <button
                   type="button"
                   onClick={() => setUploadStatus(prev => ({ ...prev, isActive: false }))}
                   className="px-4 py-1.5 bg-[#D4AF37] text-black font-sans font-extrabold text-[9px] uppercase tracking-wider rounded hover:bg-white transition cursor-pointer"
                 >
                   Fermer Diagnostic
                 </button>
               )}
             </div>
           </div>
         </div>
       )}

      </AnimatePresence>
      </div>
    </div>
  );
}
