import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Truck, Lock, CreditCard, ChevronDown, Sparkles, HelpCircle, FileText, Award } from 'lucide-react';

interface InfoViewProps {
  triggerHaptic: (style: 'light' | 'medium' | 'heavy') => void;
  onNavigateTab: (tab: 'home' | 'catalog' | 'contact' | 'reviews' | 'profile') => void;
}

export default function InfoView({ triggerHaptic, onNavigateTab }: InfoViewProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    triggerHaptic('light');
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const faqs = [
    {
      q: 'Comment passer une commande ?',
      a: 'Parcourez notre catalogue, ajoutez vos sélections préférées dans le panier, choisissez votre grammage puis validez. La commande est immédiatement transmise de façon sécurisée.'
    },
    {
      q: 'Comment s\'effectue l\'expédition et l\'emballage ?',
      a: 'Toutes nos commandes sont conditionnées sous double étanchéité thermo-scellée sous vide, garantissant 0 odeur. L\'expédition est discrète avec numéro de suivi anonyme.'
    },
    {
      q: 'Quels sont les délais de livraison ?',
      a: 'La livraison prend généralement entre 24h et 48h en envoi express. Vous recevez un code de suivi en temps réel sur Telegram dès l\'expédition.'
    },
    {
      q: 'Quels sont les moyens de paiement acceptés ?',
      a: 'Nous acceptons la Crypto (USDT, BTC, ETH), les cartes bancaires via notre passerelle chiffrée, ainsi que les cartes cadeaux / coupons prépayés.'
    },
    {
      q: 'Mes données personnelles sont-elles conservées ?',
      a: 'Non. Nous appliquons une politique stricte 0-Log. Aucune donnée d\'adresse ou d\'identité n\'est conservée sur nos serveurs une fois la livraison confirmée.'
    },
    {
      q: 'Puis-je suivre ma commande en direct ?',
      a: 'Oui ! Rendez-vous dans la section "Profil" pour consulter l\'historique de vos commandes et leur statut en temps réel.'
    }
  ];

  return (
    <div className="space-y-6 pb-24 pt-2 px-4 max-w-2xl mx-auto" id="info-view">
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-orange-500/30 bg-gradient-to-b from-neutral-900 via-black to-black p-6 text-center space-y-3 shadow-[0_0_30px_rgba(255,107,0,0.1)]">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[9px] font-mono uppercase tracking-widest font-extrabold">
          <Award className="w-3.5 h-3.5 text-orange-500" />
          <span>RÉSERVE PRIVÉE • CHARTE DE QUALITÉ</span>
        </div>

        <h1 className="text-2xl font-black font-sans tracking-tight text-white uppercase">
          INFORMATIONS & <span className="text-orange-500">ENGAGEMENT</span>
        </h1>

        <p className="text-xs text-neutral-400 font-mono max-w-md mx-auto leading-relaxed">
          Découvrez notre philosophie, nos méthodes d'expédition ultra-discrètes, la FAQ et nos garanties de confidentialité.
        </p>
      </div>

      {/* 1. BRAND PRESENTATION */}
      <div className="p-5 rounded-2xl bg-gradient-to-b from-neutral-900 to-black border border-white/10 space-y-3 shadow-lg">
        <div className="flex items-center gap-2 text-orange-400 font-mono text-xs font-extrabold uppercase">
          <Sparkles className="w-4 h-4 text-orange-500" />
          <span>À Propos de BISCOTTI BOYS FARMZ</span>
        </div>
        <p className="text-xs text-neutral-300 leading-relaxed font-sans">
          BISCOTTI BOYS FARMZ est une réserve privée sélective dédiée aux passionnés d'extractions d'exception et de fleurs d'artisanat.
          Nous travaillons en direct avec des maîtres producteurs certifiés pour garantir une pureté totale, un profil terpénique exceptionnel et une conservation optimale.
        </p>
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-center">
          <div className="p-2 rounded-xl bg-black/40 border border-white/5">
            <span className="text-xs font-black font-mono text-orange-400 block">100%</span>
            <span className="text-[8px] text-neutral-400 font-mono uppercase">Certifié</span>
          </div>
          <div className="p-2 rounded-xl bg-black/40 border border-white/5">
            <span className="text-xs font-black font-mono text-emerald-400 block">0-LOG</span>
            <span className="text-[8px] text-neutral-400 font-mono uppercase">Confidentialité</span>
          </div>
          <div className="p-2 rounded-xl bg-black/40 border border-white/5">
            <span className="text-xs font-black font-mono text-amber-400 block">24/48H</span>
            <span className="text-[8px] text-neutral-400 font-mono uppercase">Livraison</span>
          </div>
        </div>
      </div>

      {/* 2. SHIPPING & PACKAGING */}
      <div className="p-5 rounded-2xl bg-gradient-to-b from-neutral-900 to-black border border-white/10 space-y-3 shadow-lg">
        <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-extrabold uppercase">
          <Truck className="w-4 h-4 text-emerald-500" />
          <span>Expédition & Emballage Hermétique</span>
        </div>
        <div className="space-y-2 text-xs text-neutral-300 font-sans">
          <div className="flex items-start gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
            <p><strong>Double mise sous vide :</strong> Vos produits sont scellés sous atmosphère protectrice avec barrière anti-odeur absolue.</p>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
            <p><strong>Colis Neutre :</strong> Aucun marquage ni logo extérieur. Discrétion à 100% lors du dépôt et de la réception.</p>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
            <p><strong>Suivi en temps réel :</strong> Réception de votre numéro de suivi directement via notre bot Telegram dès la prise en charge.</p>
          </div>
        </div>
      </div>

      {/* 3. PAYMENT METHODS */}
      <div className="p-5 rounded-2xl bg-gradient-to-b from-neutral-900 to-black border border-white/10 space-y-3 shadow-lg">
        <div className="flex items-center gap-2 text-sky-400 font-mono text-xs font-extrabold uppercase">
          <CreditCard className="w-4 h-4 text-sky-500" />
          <span>Moyens de Paiement Sécurisés</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5 text-xs text-neutral-300">
          <div className="p-3 rounded-xl bg-black/60 border border-white/10 space-y-1">
            <span className="font-mono font-bold text-white block">Cryptomonnaies ₿</span>
            <span className="text-[10px] text-neutral-400 block">USDT (TRC20), Bitcoin, Ethereum, Monero. Sans frais supplémentaires.</span>
          </div>
          <div className="p-3 rounded-xl bg-black/60 border border-white/10 space-y-1">
            <span className="font-mono font-bold text-white block">Carte & Coupons 💳</span>
            <span className="text-[10px] text-neutral-400 block">Passerelle sécurisée et cartes prépayées (Paysafecard, PCS, Neosurf).</span>
          </div>
        </div>
      </div>

      {/* 4. FAQ ACCORDION */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-orange-400 font-mono text-xs font-extrabold uppercase">
          <HelpCircle className="w-4 h-4 text-orange-500" />
          <span>Foire Aux Questions (FAQ)</span>
        </div>

        <div className="space-y-2">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-white/10 bg-neutral-900/80 overflow-hidden transition"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 text-left flex items-center justify-between gap-3 cursor-pointer hover:bg-neutral-800/50 transition"
                >
                  <span className="text-xs font-bold text-white uppercase font-sans">
                    {faq.q}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-orange-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="px-4 pb-4 text-xs text-neutral-300 leading-relaxed font-sans border-t border-white/5 pt-3 bg-black/40"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Action Button */}
      <div className="text-center pt-2">
        <button
          onClick={() => {
            triggerHaptic('medium');
            onNavigateTab('contact');
          }}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 transition cursor-pointer inline-flex items-center gap-2"
        >
          <FileText className="w-4 h-4" />
          <span>Une Question ? Contactez le Support</span>
        </button>
      </div>
    </div>
  );
}
