import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, MessageSquarePlus, CheckCircle2, ShieldAlert, X, Send, Award } from 'lucide-react';
import { ReviewItem, Order } from '../types';
import { submitReview } from '../db';

interface ReviewsViewProps {
  reviews: ReviewItem[];
  userOrders: Order[];
  tgUser: any;
  onRefreshReviews: () => void;
  triggerHaptic: (style: 'light' | 'medium' | 'heavy' | 'success' | 'error') => void;
  showToast: (msg: string) => void;
}

export default function ReviewsView({
  reviews,
  userOrders,
  tgUser,
  onRefreshReviews,
  triggerHaptic,
  showToast
}: ReviewsViewProps) {
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showNotEligibleModal, setShowNotEligibleModal] = useState<boolean>(false);

  // Form State
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [category, setCategory] = useState<string>('Frozen Sift');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Calculate Average Rating & Distribution
  const totalCount = reviews.length;
  const avgRating = totalCount > 0
    ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / totalCount).toFixed(1)
    : '5.0';

  const distribution = [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.filter((r) => Math.round(r.rating || 5) === stars).length;
    const percentage = totalCount > 0 ? Math.round((count / totalCount) * 100) : stars === 5 ? 100 : 0;
    return { stars, count, percentage };
  });

  // Verify if user has completed order
  const completedOrders = userOrders.filter((o) => o.status === 'completed');
  const isEligibleToReview = completedOrders.length > 0;

  const handleOpenAddReview = () => {
    triggerHaptic('medium');
    if (!isEligibleToReview) {
      triggerHaptic('error');
      setShowNotEligibleModal(true);
    } else {
      setShowAddModal(true);
    }
  };

  const handleSubmitReview = async () => {
    if (!comment.trim()) {
      showToast('Veuillez saisir votre commentaire.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitReview({
        telegramId: String(tgUser?.id || ''),
        telegramUsername: 'Anonyme',
        authorName: 'Anonyme',
        rating,
        comment,
        category
      });

      if (res.success) {
        triggerHaptic('success');
        showToast('Avis publié avec succès ! Merci pour votre retour.');
        setComment('');
        setShowAddModal(false);
        onRefreshReviews();
      } else {
        triggerHaptic('error');
        showToast(res.error || 'Erreur lors de la publication');
      }
    } catch (e: any) {
      showToast('Erreur serveur lors de l\'envoi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 pt-2 px-4 max-w-2xl mx-auto" id="reviews-view">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Avis & Retours Clients</span>
            <span className="px-2.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 font-mono text-[10px] font-extrabold">
              100% Vérifiés
            </span>
          </h2>
          <p className="text-xs text-neutral-400 font-mono">
            Témoignages authentiques de membres du cercle privé
          </p>
        </div>

        <button
          onClick={handleOpenAddReview}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-500 text-black font-extrabold text-xs tracking-wider uppercase shadow-lg shadow-orange-600/30 hover:scale-105 active:scale-95 transition cursor-pointer flex items-center gap-1.5"
        >
          <MessageSquarePlus className="w-4 h-4" />
          <span>Laisser un avis</span>
        </button>
      </div>

      {/* RATING OVERVIEW CARD */}
      <div className="p-5 rounded-3xl bg-neutral-900/80 border border-orange-500/30 backdrop-blur-md shadow-xl grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Left Column: Big Score */}
        <div className="text-center space-y-1 md:border-r md:border-white/10 md:pr-4">
          <div className="text-4xl font-black font-mono text-white flex items-center justify-center gap-1">
            <span>{avgRating}</span>
            <span className="text-orange-500 text-2xl">/5</span>
          </div>
          <div className="flex items-center justify-center gap-1 text-amber-400">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-amber-400" />
            ))}
          </div>
          <p className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest pt-1">
            Basé sur {totalCount} avis certifiés
          </p>
        </div>

        {/* Right Column: Breakdown Bars */}
        <div className="md:col-span-2 space-y-1.5">
          {distribution.map((d) => (
            <div key={d.stars} className="flex items-center gap-2 text-xs font-mono">
              <span className="w-8 text-neutral-400 font-bold">{d.stars} ★</span>
              <div className="flex-1 h-2 rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-600 to-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${d.percentage}%` }}
                />
              </div>
              <span className="w-10 text-right text-neutral-400 text-[10px]">
                {d.percentage}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* REVIEWS LIST */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono font-extrabold tracking-widest text-orange-400 uppercase">
          Dernières Publications
        </h3>

        <div className="space-y-3">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-4 rounded-2xl bg-neutral-900/60 border border-white/10 space-y-2.5 shadow-md hover:border-orange-500/30 transition"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-extrabold text-white">
                      Anonyme
                    </span>
                    <span className="px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[8px] font-mono uppercase font-black">
                      {rev.vipLevel || 'Member'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono text-neutral-500">
                      {rev.date ? new Date(rev.date).toLocaleDateString('fr-FR') : 'Récemment'}
                    </span>
                    {rev.verifiedPurchase && (
                      <span className="text-[9px] font-mono text-emerald-400 flex items-center gap-1 font-bold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Achat Vérifié
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-0.5 text-amber-400 bg-black/40 px-2 py-1 rounded-xl border border-white/5">
                  {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>

              <p className="text-xs text-neutral-200 font-sans leading-relaxed">
                "{rev.comment}"
              </p>

              {rev.productCategory && (
                <div className="pt-1 flex items-center gap-2 text-[9px] font-mono text-neutral-500">
                  <span>Variété : <strong className="text-orange-400">{rev.productCategory}</strong></span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* NOT ELIGIBLE MODAL */}
      <AnimatePresence>
        {showNotEligibleModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-neutral-900 border border-orange-500/40 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl relative"
            >
              <button
                onClick={() => setShowNotEligibleModal(false)}
                className="absolute top-4 right-4 text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-14 h-14 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-8 h-8" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base font-extrabold text-white">
                  Commande Requise
                </h3>
                <p className="text-xs text-neutral-300 font-sans leading-relaxed">
                  Afin de garantir l'authenticité absolue des retours, seuls les utilisateurs ayant au moins une commande terminée et livrée peuvent publier un avis.
                </p>
              </div>

              <button
                onClick={() => setShowNotEligibleModal(false)}
                className="w-full py-3 rounded-2xl bg-orange-500 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg hover:bg-orange-400 transition"
              >
                Compris
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ADD REVIEW MODAL */}
      <AnimatePresence>
        {showAddModal && (
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
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Star className="w-4 h-4 text-orange-500 fill-orange-500" />
                  <span>Publier un Avis Certifié</span>
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-neutral-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {/* Rating selection */}
                <div className="space-y-1">
                  <label className="text-xs font-mono text-neutral-400 block">Note globale</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setRating(s)}
                        className={`p-2 rounded-xl border transition ${
                          s <= rating
                            ? 'bg-orange-500/20 border-orange-500 text-amber-400'
                            : 'bg-neutral-800 border-white/5 text-neutral-600'
                        }`}
                      >
                        <Star className={`w-5 h-5 ${s <= rating ? 'fill-amber-400' : ''}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category Selection */}
                <div className="space-y-1">
                  <label className="text-xs font-mono text-neutral-400 block">Gamme concernée</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-neutral-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                  >
                    <option value="Frozen Sift">Frozen Sift</option>
                    <option value="Static Sift">Static Sift</option>
                    <option value="WPFF">WPFF</option>
                    <option value="Accessoires">Accessoires</option>
                  </select>
                </div>

                {/* Comment area */}
                <div className="space-y-1">
                  <label className="text-xs font-mono text-neutral-400 block">Votre expérience / commentaire</label>
                  <textarea
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Partagez votre avis sur la qualité, les arômes, la livraison..."
                    className="w-full bg-neutral-800 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-neutral-500 font-mono focus:outline-none focus:border-orange-500 resize-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-mono"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmitReview}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 text-black font-extrabold text-xs uppercase flex items-center gap-2 shadow-lg hover:scale-105 transition disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Publication...' : 'Publier l\'Avis'}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
