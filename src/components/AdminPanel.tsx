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
  UserCheck
} from 'lucide-react';
import { VideoItem, Order, BrandingSettings, SectionTitle, WhitelistItem } from '../types';
import { addProduct, deleteProduct, getOrders, updateOrderStatus, deleteOrder, getBrandingSettings, updateBrandingSettings, uploadFileRaw, getWhitelist, addWhitelistItem, deleteWhitelistItem, setAdminPasswordToken } from '../db';

const isVideoUrl = (url?: string): boolean => {
  if (!url) return false;
  const cleanUrl = url.toLowerCase().split('?')[0];
  return cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.webm') || cleanUrl.endsWith('.mov') || url.includes('video') || url.includes('mp4');
};

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
  const isInsideTelegram = !!(tg && tg.initData && tg.initData.trim() !== '');

  // Whitelist state variables
  const [whitelist, setWhitelist] = useState<WhitelistItem[]>([]);
  const [loadingWhitelist, setLoadingWhitelist] = useState<boolean>(false);
  const [newWhitelistVal, setNewWhitelistVal] = useState<string>('');
  const [newWhitelistType, setNewWhitelistType] = useState<'ID' | 'Username'>('ID');

  // Master Passcode & Owner security logic restored
  const isUserOwner = (user: any) => {
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
  };

  const isWhitelisted = useMemo(() => {
    if (!isInsideTelegram) {
      return true; // Bypass outside Telegram for web preview
    }
    if (tgUser) {
      return isUserOwner(tgUser);
    }
    return false;
  }, [tgUser, isInsideTelegram]);

  // Tab state: 'products' | 'orders' | 'settings' | 'whitelist'
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'settings' | 'whitelist'>('products');

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
    introStatusLine: 'HASH\'N FLASH MOCRO — LA RÉSERVE PRIVÉE'
  });

  // States for adding product (Morocco MAD strictly)
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');
  const [newPrice, setNewPrice] = useState<number>(350);
  const [newCategory, setNewCategory] = useState<string>('DRY');
  const [newDisplayZone, setNewDisplayZone] = useState<string>(''); // Optional storefront placement (e.g. MEET UP RABAT)
  const [newAuthor, setNewAuthor] = useState<string>('HASH\'N FLASH MOCRO');
  const [isFeatured, setIsFeatured] = useState<boolean>(true);
  
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
      triggerHaptic('medium');
      try {
        const publicUrl = await uploadFileRaw(file);
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
      }
    }
  };

  const handleEditPhotoSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditPhotoUploading(true);
      triggerHaptic('light');
      try {
        const publicUrl = await uploadFileRaw(file);
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
      }
    }
  };

  const handleEditExtraPhotosSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setEditExtraPhotosUploading(true);
      triggerHaptic('light');
      try {
        const uploadedUrls: string[] = [];
        for (const file of Array.from(files) as File[]) {
          const publicUrl = await uploadFileRaw(file);
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
      const records = await getWhitelist();
      setWhitelist(records);
    } catch (e) {
      console.error('Error loading whitelist data', e);
    } finally {
      setLoadingWhitelist(false);
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
        notes: newWhitelistNotes.trim()
      });
      setNewWhitelistVal('');
      setNewWhitelistNotes('');
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
      triggerHaptic('medium');
      try {
        const publicUrl = await uploadFileRaw(file);
        setVideoPreviewUrl(publicUrl);
        triggerHaptic('success');
      } catch (err: any) {
        console.error('Video select raw upload failed:', err);
        setErrorMsg('Échec de chargement de la vidéo.');
        setTimeout(() => setErrorMsg(''), 4500);
      } finally {
        setMainVideoUploading(false);
      }
    }
  };

  // Cover image file selection
  const handlePhotoSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMainPhotoUploading(true);
      triggerHaptic('light');
      try {
        const publicUrl = await uploadFileRaw(file);
        setPhotoPreviewUrl(publicUrl);
        triggerHaptic('success');
      } catch (err: any) {
        console.error('Photo select raw upload failed:', err);
        setErrorMsg('Échec de chargement de l\'image de couverture.');
        setTimeout(() => setErrorMsg(''), 4500);
      } finally {
        setMainPhotoUploading(false);
      }
    }
  };

  const handleExtraPhotosSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setExtraPhotosUploading(true);
      triggerHaptic('light');
      try {
        const uploadedUrls: string[] = [];
        for (const file of Array.from(files) as File[]) {
          const publicUrl = await uploadFileRaw(file);
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
        currency: 'MAD',
        category: newCategory,
        displayZone: newDisplayZone || undefined,
        isPremium: true,
        isFeatured: isFeatured,
        author: newAuthor.toUpperCase() || 'OMERTA 47',
        views: Math.floor(Math.random() * 1200) + 250,
        duration: '0:15',
        videoUrl: videoPreviewUrl || '',
        thumbnailUrl: photoPreviewUrl || '/input_file_2.png',
        additionalPhotos: extraPhotosUrls
      };

      // Call addProduct directly as clear JSON payload (no blobs anymore, no base64 parsing!)
      await addProduct(freshProd);

      triggerHaptic('success');
      setSuccessMsg(`"${newTitle}" a été créé avec succès et tarifé à ${newPrice} MAD.`);
      setErrorMsg('');
      
      // Reset variables
      setNewTitle('');
      setNewDesc('');
      setNewPrice(350);
      setNewDisplayZone('');
      setVideoPreviewUrl('');
      setPhotoPreviewUrl('');
      setExtraPhotosUrls([]);

      await onRefreshProducts();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Core product creation save failing', err);
      setErrorMsg('Échec de la sauvegarde...');
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
    } catch (err) {
      console.error(err);
      setErrorMsg('Erreur lors de la mise à jour...');
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
      <div className="mx-4 my-12 p-8 rounded-2xl bg-[#090909] border border-red-900/40 text-center space-y-5 shadow-2xl relative select-none">
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
            ⚠️ Cet ID n'est pas enregistré dans l'infrastructure de la réserve HASH'N FLASH MOCRO. Veuillez demander au propriétaire principal d'ajouter votre ID Telegram ci-dessus à la Whitelist pour accorder l'accès complet instantanément.
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-gray-400 text-[9px] font-mono tracking-widest uppercase transition duration-300 cursor-pointer shadow-md"
        >
          RETOUR AU STORE HASH'N FLASH MOCRO
        </button>
      </div>
    );
  }

  return (
    <div className="mx-3 my-4 p-4 rounded-2xl bg-[#090909] border border-[#D4AF37]/35 shadow-2xl space-y-5 antialiased">
      
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between border-b border-[#222] pb-3.5">
        <div className="flex items-center gap-2.5">
          <Database className="w-4.5 h-4.5 text-[#D4AF37]" />
          <div>
            <h3 className="font-display font-bold text-xs tracking-widest text-[#F5EFEB] uppercase leading-none">
              SECURE RESHAPE CONSOLE
            </h3>
            <p className="text-[9px] font-mono text-[#C5A880] mt-1">LOGGED AS MAIN OWNER • ID {tgUser?.id}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 px-1.5 rounded-lg bg-[#222]/80 border border-white/5 text-gray-400 hover:text-white cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
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
      <div className="grid grid-cols-4 gap-1 bg-[#141414] p-1 rounded-xl border border-white/5">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('products');
          }}
          className={`py-2 text-[8px] font-mono tracking-wider uppercase rounded-lg font-bold transition-all ${activeTab === 'products' ? 'bg-[#D4AF37] text-black' : 'text-gray-400 hover:text-white bg-transparent'}`}
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
          className={`py-2 text-[8px] font-mono tracking-wider uppercase rounded-lg font-bold transition-all flex items-center justify-center gap-0.5 ${activeTab === 'orders' ? 'bg-[#D4AF37] text-black' : 'text-gray-400 hover:text-white bg-transparent'}`}
        >
          <ClipboardList className="w-2.5 h-2.5" />
          <span>COMMANDES ({orders.length})</span>
        </button>
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('settings');
            loadBrandingSettings();
          }}
          className={`py-2 text-[8px] font-mono tracking-wider uppercase rounded-lg font-bold transition-all flex items-center justify-center gap-0.5 ${activeTab === 'settings' ? 'bg-[#D4AF37] text-black' : 'text-gray-400 hover:text-white bg-transparent'}`}
        >
          <Sparkles className="w-2.5 h-2.5 text-[#D4AF37]" />
          <span>VISUELS</span>
        </button>
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('whitelist');
            loadWhitelistData();
          }}
          className={`py-2 text-[8px] font-mono tracking-wider uppercase rounded-lg font-bold transition-all flex items-center justify-center gap-0.5 ${activeTab === 'whitelist' ? 'bg-[#D4AF37] text-black' : 'text-gray-400 hover:text-white bg-transparent'}`}
        >
          <UserCheck className="w-2.5 h-2.5 text-[#D4AF37]" />
          <span>WHITELIST ({whitelist.length})</span>
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
                      <option value="DRY">DRY (Double Filtré)</option>
                      <option value="FROZEN">FROZEN (Frozen Sift)</option>
                      <option value="STATIC">STATIC (Sift Glacé / Beldia)</option>
                      <option value="MEET UP RABAT">MEET UP RABAT</option>
                      <option value="ACCESSOIRES">ACCESSOIRES</option>
                    </select>
                  </div>

                   <div>
                     <label className="block text-[8px] font-mono text-gray-500 uppercase mb-1">Prix de vente (MAD) :</label>
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
                   <span className="uppercase text-white text-[9px] block mb-1">Informations de tarification (MAD) :</span>
                   Ce produit sera affiché au tarif fixe et unique de <span className="text-[#D4AF37] font-bold">{newPrice} MAD</span>. Les frais de livraison sont offerts pour tous les membres du Club Privilégié.
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
                      <span>{mainVideoUploading ? 'En cours...' : 'Téléverser'}</span>
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
                      <span>{mainPhotoUploading ? 'En cours...' : 'Téléverser'}</span>
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
                      <span>{extraPhotosUploading ? 'En cours...' : `Photos (${extraPhotosUrls.length})`}</span>
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

                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[8px] font-mono text-gray-500 uppercase">Mettre à la une :</span>
                  <button
                    type="button"
                    onClick={() => setIsFeatured(!isFeatured)}
                    className={`px-3 py-1 rounded text-[8px] font-mono uppercase tracking-wide border ${isFeatured ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#D4AF37]' : 'bg-transparent border-[#222] text-gray-500'}`}
                  >
                    {isFeatured ? '★ Vedette active' : 'Non'}
                  </button>
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
                      <span className="text-[8px] text-[#C5A880] block">
                        {p.category} • <span className="text-[#D4AF37]">{p.price || p.pricePerGram || 0} MAD</span>
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
                  <button type="button" onClick={() => setEditingProduct(null)} className="text-gray-500 text-[8px] hover:text-white">[ FERMER ]</button>
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
                      <label className="block text-[8px] text-gray-500">PRIX DE VENTE (MAD) :</label>
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
                        <option value="DRY">DRY (Double Filtré)</option>
                        <option value="FROZEN">FROZEN (Frozen Sift)</option>
                        <option value="STATIC">STATIC (Sift Glacé / Beldia)</option>
                        <option value="MEET UP RABAT">MEET UP RABAT</option>
                        <option value="ACCESSOIRES">ACCESSOIRES</option>
                      </select>
                    </div>
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
                      <option value="WPPF">WPPF</option>
                      <option value="BELDIA">BELDIA</option>
                      <option value="FROZEN">FROZEN</option>
                      <option value="STATIC">STATIC</option>
                      <option value="DRY">DRY</option>
                      <option value="ACCESSOIRES">ACCESSOIRES</option>
                    </select>
                  </div>

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
                        <span className="text-[#D4AF37]">{editVideoUploading ? 'En cours...' : 'Téléverser'}</span>
                        {editingProduct.videoUrl ? <span className="text-[7px] text-green-500">✔ Disponible</span> : <span className="text-[7px] text-gray-600">Aucune</span>}
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
                        <span className="text-[#D4AF37] relative z-10">{editPhotoUploading ? 'En cours...' : 'Téléverser'}</span>
                        {editingProduct.thumbnailUrl ? <span className="text-[7px] text-green-500 relative z-10">✔ Disponible</span> : <span className="text-[7px] text-gray-600 relative z-10">Aucune</span>}
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
                        <span className="text-[#D4AF37]">{editExtraPhotosUploading ? 'En cours...' : 'Téléverser'}</span>
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
                    Ce produit sera affiché sur le catalogue avec un prix de vente fixe et unique de <span className="text-[#D4AF37] font-bold">{editingProduct.price || 0} MAD</span>. Les frais d'expédition sont offerts sur l'ensemble de la boutique.
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
                            <span className="truncate pr-2">• {item.title}</span>
                            <span className="shrink-0 text-[#C5A880]">{item.price} MAD</span>
                          </div>
                        ))}
                        <div className="border-t border-[#222] mt-1.5 pt-1.5 flex justify-between font-extrabold text-[9.5px]">
                          <span className="text-[#C5A880]">MONTANT NET :</span>
                          <span className="text-[#D4AF37]">{o.totalAmount} MAD</span>
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
                  🎨 PERSONNALISATION DES VISUELS DE MARQUE
                </span>
                <p className="text-[8px] font-mono text-zinc-500 mt-0.5 leading-normal">
                  Modifiez les fonds d'écran, logos et titres de l'application. Les changements s'appliquent instantanément sur la Mini App Telegram.
                </p>
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
                            triggerHaptic('medium');
                            try {
                              const publicUrl = await uploadFileRaw(file);
                              setBrandingSettings(prev => ({ ...prev, introBgUrl: publicUrl }));
                              triggerHaptic('success');
                            } catch (err) {
                              console.error('Intro upload error:', err);
                              setErrorMsg('Erreur de téléversement...');
                              setTimeout(() => setErrorMsg(''), 4000);
                            } finally {
                              setUploadingIntro(false);
                            }
                          }
                        };
                        fileInput.click();
                      }}
                      className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded font-bold text-[8px] text-[#C5A880] hover:text-white transition cursor-pointer disabled:opacity-50"
                    >
                      {uploadingIntro ? 'Téléversement...' : 'Uploader image/vidéo'}
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
                            triggerHaptic('medium');
                            try {
                              const publicUrl = await uploadFileRaw(file);
                              setBrandingSettings(prev => ({ ...prev, launchScreenUrl: publicUrl }));
                              triggerHaptic('success');
                            } catch (err) {
                              console.error('Launch screen upload error:', err);
                              setErrorMsg('Erreur de téléversement...');
                              setTimeout(() => setErrorMsg(''), 4000);
                            } finally {
                              setUploadingLaunch(false);
                            }
                          }
                        };
                        fileInput.click();
                      }}
                      className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded font-bold text-[8px] text-[#C5A880] hover:text-white transition cursor-pointer disabled:opacity-50"
                    >
                      {uploadingLaunch ? 'Téléversement...' : 'Uploader image/vidéo'}
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
                            triggerHaptic('medium');
                            try {
                              const publicUrl = await uploadFileRaw(file);
                              setBrandingSettings(prev => ({ ...prev, homepageHeroBgUrl: publicUrl }));
                              triggerHaptic('success');
                            } catch (err) {
                              console.error('Hero visual upload error:', err);
                              setErrorMsg('Erreur de téléversement...');
                              setTimeout(() => setErrorMsg(''), 4000);
                            } finally {
                              setUploadingHero(false);
                            }
                          }
                        };
                        fileInput.click();
                      }}
                      className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded font-bold text-[8px] text-[#C5A880] hover:text-white transition cursor-pointer disabled:opacity-50"
                    >
                      {uploadingHero ? 'Téléversement...' : 'Uploader image/vidéo'}
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
                  <label className="text-gray-400 block font-bold mb-1">LOGO ICON PAR DÉFAUT (LOGO EMBLEM URL) :</label>
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
                            triggerHaptic('medium');
                            try {
                              const publicUrl = await uploadFileRaw(file);
                              setBrandingSettings(prev => ({ ...prev, logoUrl: publicUrl }));
                              triggerHaptic('success');
                            } catch (err) {
                              console.error('Logo upload error:', err);
                              setErrorMsg('Erreur de téléversement...');
                              setTimeout(() => setErrorMsg(''), 4000);
                            } finally {
                              setUploadingLogo(false);
                            }
                          }
                        };
                        fileInput.click();
                      }}
                      className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded font-bold text-[8px] text-[#C5A880] hover:text-white transition cursor-pointer disabled:opacity-50"
                    >
                      {uploadingLogo ? 'Téléversement...' : 'Uploader un logo'}
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
                                  <option value="FROZEN">FROZEN</option>
                                  <option value="STATIC">STATIC</option>
                                  <option value="DRY">DRY</option>
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
                    placeholder="HASH'N FLASH MOCRO — LA RÉSERVE PRIVÉE"
                    className="w-full text-[9px] py-1.5 px-2.5 rounded bg-black border border-[#222] focus:border-[#D4AF37] text-white outline-none"
                  />
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

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2 rounded bg-[#D4AF37] text-black font-extrabold text-[8.5px] uppercase tracking-wider hover:bg-white transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>AUTORISER L'ACCÈS DU MEMBRE</span>
                </button>
              </form>

              {/* List of Whitelisted items */}
              <div className="space-y-2">
                <span className="block text-[8px] text-[#C5A880] uppercase tracking-widest font-extrabold mb-1">
                  UTILISATEURS ENREGISTRÉS ({whitelist.length})
                </span>

                {loadingWhitelist ? (
                  <div className="py-4 text-center text-zinc-600">Chargement de la liste...</div>
                ) : whitelist.length === 0 ? (
                  <div className="py-4 text-center text-zinc-600 border border-dashed border-[#222] rounded-lg">
                    Aucun utilisateur personnalisé. (Seul l'Owner & hashn_flash_mocro sont autorisés par défaut)
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-900 border border-zinc-900 bg-black/20 rounded-xl overflow-hidden">
                    {whitelist.map((item) => (
                      <div key={item.id} className="p-3 flex items-center justify-between gap-3 text-[9px] hover:bg-zinc-950/40 transition">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400 font-extrabold text-[7px] uppercase rounded">
                              {item.type}
                            </span>
                            <span className="font-bold text-[#F5EFEB] text-[9.5px]">
                              {item.type === 'Username' && !item.value.startsWith('@') ? '@' : ''}{item.value}
                            </span>
                          </div>
                          {item.notes && <span className="text-zinc-500 text-[8px] font-sans mt-0.5 block">{item.notes}</span>}
                        </div>

                        {/* We let them delete except if they are default values */}
                        {item.id !== 'default-owner' && item.id !== 'default-amine' ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteWhitelist(item.id)}
                            className="p-1 rounded border border-red-950/45 bg-red-950/20 text-red-400 hover:bg-red-900/40 transition cursor-pointer font-bold"
                            title="Révoquer l'accès"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        ) : (
                          <span className="text-[7.5px] text-[#D4AF37]/50 uppercase tracking-widest font-mono font-bold">PROTÉGÉ</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
