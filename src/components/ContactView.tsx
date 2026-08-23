import React, { useState, MouseEvent } from 'react';
import { motion } from 'motion/react';
import { Send, Instagram, Lock, ExternalLink, Copy, Check, ShieldCheck, Sparkles, Headphones } from 'lucide-react';
import { BrandingSettings } from '../types';

interface ContactViewProps {
  branding: BrandingSettings | null;
  triggerHaptic: (style: 'light' | 'medium' | 'heavy') => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function ContactView({ branding, triggerHaptic, showToast }: ContactViewProps) {
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const telegramChannel = branding?.telegramChannelUrl || 'https://t.me/+ox8xo-KqAk1jYjI0';
  const telegramSupport = branding?.telegramSupportUrl || 'https://t.me/yoru47';
  const instagram = branding?.instagramUrl || 'https://instagram.com/north47_lab';

  const contacts = [
    {
      id: 'tg-channel',
      title: 'Canal Telegram Officiel',
      subtitle: 'Nouveautés, arrivages exclusifs et drops en avant-première',
      handle: telegramChannel,
      displayHandle: 'Canal Telegram Officiel',
      badge: 'OFFICIEL',
      badgeColor: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
      icon: Send,
      color: 'from-sky-950/60 via-neutral-900 to-black border-sky-500/30 hover:border-sky-400',
      btnText: 'Rejoindre le Canal',
      btnClass: 'bg-sky-500 hover:bg-sky-400 text-black',
    },
    {
      id: 'tg-support',
      title: 'Support Direct Telegram',
      subtitle: 'Assistance client 24/7, suivi des commandes et conseils',
      handle: telegramSupport,
      displayHandle: '@yoru47 (Support)',
      badge: 'SUPPORT 24/7',
      badgeColor: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      icon: Headphones,
      color: 'from-emerald-950/60 via-neutral-900 to-black border-emerald-500/30 hover:border-emerald-400',
      btnText: 'Contacter le Support',
      btnClass: 'bg-emerald-500 hover:bg-emerald-400 text-black',
    },
    {
      id: 'instagram',
      title: 'Instagram Officiel',
      subtitle: 'Stories exclusives, coulisses et présentations de récoltes',
      handle: instagram,
      displayHandle: '@shelfterps',
      badge: 'COMMUNAUTÉ',
      badgeColor: 'bg-pink-500/10 border-pink-500/30 text-pink-400',
      icon: Instagram,
      color: 'from-pink-950/60 via-neutral-900 to-black border-pink-500/30 hover:border-pink-400',
      btnText: 'S\'abonner sur Instagram',
      btnClass: 'bg-gradient-to-r from-pink-500 to-amber-500 hover:opacity-90 text-white',
    },
  ];

  const handleOpenLink = (url: string, id: string) => {
    triggerHaptic('medium');
    if (!url) {
      showToast('Lien non configuré par l\'administrateur', 'info');
      return;
    }

    let finalUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      if (url.startsWith('@')) {
        finalUrl = `https://t.me/${url.replace('@', '')}`;
      } else {
        finalUrl = `https://${url}`;
      }
    }

    try {
      window.open(finalUrl, '_blank', 'noopener,noreferrer');
    } catch (e) {
      // Fallback copy
      navigator.clipboard.writeText(url);
      setCopiedIndex(id);
      showToast(`Lien copié : ${url}`, 'success');
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  const handleCopyLink = (url: string, id: string, e: MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedIndex(id);
    showToast('Lien copié dans le presse-papier', 'success');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6 pb-24 pt-2 px-4 max-w-2xl mx-auto" id="contact-view">
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-orange-500/30 bg-gradient-to-b from-neutral-900 via-black to-black p-6 text-center space-y-3 shadow-[0_0_30px_rgba(255,107,0,0.1)]">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[9px] font-mono uppercase tracking-widest font-extrabold">
          <ShieldCheck className="w-3.5 h-3.5 text-orange-500" />
          <span>CANAUX OFFICIELS & SECURE</span>
        </div>

        <h1 className="text-2xl font-black font-sans tracking-tight text-white uppercase">
          CONTACT & <span className="text-orange-500">CANAUX DIRECTS</span>
        </h1>

        <p className="text-xs text-neutral-400 font-mono max-w-md mx-auto leading-relaxed">
          Rejoignez nos communautés officielles ou contactez directement notre support client disponible 24/7.
        </p>
      </div>

      {/* Contacts List Cards */}
      <div className="space-y-3.5">
        {contacts.map((c) => {
          const Icon = c.icon;
          const isCopied = copiedIndex === c.id;

          return (
            <motion.div
              key={c.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => handleOpenLink(c.handle, c.id)}
              className={`p-4 rounded-2xl bg-gradient-to-r ${c.color} border transition duration-300 cursor-pointer relative shadow-lg group space-y-3`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-black/60 border border-white/10 text-white group-hover:scale-110 transition duration-300 shadow-inner">
                    <Icon className="w-5 h-5 text-orange-400" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white group-hover:text-orange-400 transition uppercase">
                        {c.title}
                      </h3>
                    </div>
                    <p className="text-[10px] text-neutral-400 font-mono leading-tight">
                      {c.subtitle}
                    </p>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded-full border text-[8px] font-mono font-black uppercase tracking-wider shrink-0 ${c.badgeColor}`}>
                  {c.badge}
                </span>
              </div>

              {/* Action Bar */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-mono text-neutral-400 truncate max-w-[200px]">
                  {c.displayHandle}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleCopyLink(c.handle, c.id, e)}
                    className="p-1.5 rounded-lg bg-black/40 border border-white/10 text-neutral-400 hover:text-white transition"
                    title="Copier le lien"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  <button className={`px-3 py-1.5 rounded-xl text-xs font-mono font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow transition ${c.btnClass}`}>
                    <span>{c.btnText}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Security Banner */}
      <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-950/10 space-y-2 text-center">
        <div className="flex items-center justify-center gap-1.5 text-amber-400 text-xs font-mono font-bold uppercase">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Garantie de Confidentialité</span>
        </div>
        <p className="text-[10px] text-neutral-400 font-mono leading-relaxed">
          Toutes vos interactions sont strictement protégées. Nous ne conservons aucun journal d'activité ni donnée personnelle.
        </p>
      </div>
    </div>
  );
}
