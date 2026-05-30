/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, VolumeX, Sparkles, ShieldAlert, KeyRound, Lock, Unlock, ShieldCheck, HelpCircle } from 'lucide-react';

interface IntroScreenProps {
  onEnter: () => void;
  audioPlaying: boolean;
  onToggleAudio: () => void;
  triggerHaptic: (style: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error', customMessage?: string) => void;
  settings?: any;
  tgUser?: any;
  isWhitelisted: boolean;
}

const isVideoUrl = (url?: string): boolean => {
  if (!url) return false;
  const cleanUrl = url.toLowerCase().split('?')[0];
  return cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.webm') || cleanUrl.endsWith('.mov') || url.includes('video') || url.includes('mp4');
};

export default function IntroScreen({ 
  onEnter, 
  audioPlaying, 
  onToggleAudio, 
  triggerHaptic, 
  settings, 
  tgUser, 
  isWhitelisted 
}: IntroScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Soft atmospheric golden dust/smoke particle flow on deep black background
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let animationFrameId: number;
      let width = (canvas.width = canvas.getBoundingClientRect().width || window.innerWidth);
      let height = (canvas.height = canvas.getBoundingClientRect().height || window.innerHeight);

      const particles: Array<{
        x: number;
        y: number;
        radius: number;
        speedY: number;
        speedX: number;
        opacity: number;
        color: string;
        life: number;
      }> = [];

      // Golden luxurious particles
      const goldColors = ['#D4AF37', '#FFDF73', '#9A7B1C', '#E2C974', '#1A1A1A'];

      for (let i = 0; i < 50; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 1.8 + 0.4,
          speedY: -(Math.random() * 0.35 + 0.05),
          speedX: Math.random() * 0.2 - 0.1,
          opacity: Math.random() * 0.6 + 0.1,
          color: goldColors[Math.floor(Math.random() * goldColors.length)],
          life: Math.random() * 1200
        });
      }

      const draw = () => {
        ctx.clearRect(0, 0, width, height);

        // Midnight obsidian radial dark background
        const grad = ctx.createRadialGradient(
          width / 2, height / 2, 20,
          width / 2, height / 2, width * 0.9
        );
        grad.addColorStop(0, '#0c0b08');
        grad.addColorStop(0.6, '#050505');
        grad.addColorStop(1, '#020202');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Draw gold dust
        particles.forEach((p) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.opacity;
          ctx.shadowBlur = 5;
          ctx.shadowColor = '#D4AF37';
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1.0;

          p.y += p.speedY;
          p.x += p.speedX;
          p.life -= 8;

          if (p.y < -10 || p.life <= 0) {
            p.y = height + 10;
            p.x = Math.random() * width;
            p.life = Math.random() * 1200;
            p.opacity = Math.random() * 0.5 + 0.1;
          }
        });

        animationFrameId = requestAnimationFrame(draw);
      };

      draw();

      const handleResize = () => {
        if (!canvas) return;
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
      };

      window.addEventListener('resize', handleResize);
      return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, []);

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-between p-6 overflow-hidden bg-[#070707] transition-all duration-700">
      {/* Background canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0" />

      {/* Atmospheric Background Media (Image or Video) from Branding Settings */}
      {settings?.introBgUrl && settings.introBgUrl.trim() !== '' && (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          {isVideoUrl(settings.introBgUrl) ? (
            <video
              src={settings.introBgUrl}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover opacity-35 filter brightness-[0.4]"
            />
          ) : (
            <img
              src={settings.introBgUrl}
              className="w-full h-full object-cover opacity-35 filter brightness-[0.4]"
              alt="Intro background visual"
            />
          )}
          {/* Obsidian cinematic dark gradient shadow to elevate legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#070707] via-transparent to-[#070707]/90" />
        </div>
      )}

      {/* Atmospheric sound player */}
      <div className="relative z-10 flex justify-end">
        <button
          onClick={() => {
            triggerHaptic('light', 'Sons Ambience');
            onToggleAudio();
          }}
          className="mt-2 p-3 rounded-full border border-neutral-900 bg-black/50 backdrop-blur-md text-[#D4AF37] hover:bg-neutral-900 duration-300 shadow-sm flex items-center justify-center"
          id="intro_audio_btn"
        >
          {audioPlaying ? (
            <Volume2 className="w-4 h-4 text-[#D4AF37] animate-pulse" />
          ) : (
            <VolumeX className="w-4 h-4 text-neutral-500" />
          )}
        </button>
      </div>

      {/* Main vault / Title area */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto text-center px-4 select-none w-full max-w-sm mx-auto">
        
        {/* Obsidian logo with a gold lock */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="w-20 h-20 rounded-full flex flex-col items-center justify-center border border-[#D4AF37]/30 bg-black/60 shadow-lg relative"
        >
          <AnimatePresence mode="wait">
            {isWhitelisted ? (
              <motion.div
                key="unlock"
                initial={{ rotate: -20, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                exit={{ scale: 0.8 }}
                className="text-[#D4AF37]"
              >
                <Unlock className="w-8 h-8" />
              </motion.div>
            ) : (
              <motion.div
                key="lock"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                className="text-[#D4AF37]"
              >
                <Lock className="w-8 h-8 animate-pulse" />
              </motion.div>
            )}
          </AnimatePresence>
          <div className="absolute inset-1 border border-dashed border-[#D4AF37]/10 rounded-full" />
        </motion.div>

        {/* Brand Display name */}
        <motion.h1
          initial={{ letterSpacing: "0.15em", opacity: 0, y: 15 }}
          animate={{ letterSpacing: "0.25em", opacity: 1, y: 0 }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
          className="font-mono font-medium text-3xl md:text-4xl text-[#D4AF37] tracking-[0.25em] uppercase leading-none text-center mt-6"
          id="intro_title"
        >
          HASH'N FLASH MOCRO
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.3 }}
          className="text-[9px] text-[#D4AF37] tracking-[0.4em] uppercase mt-2 font-semibold"
        >
          Réserve d'Élite Privée
        </motion.p>

        <div className="w-16 h-[1px] bg-neutral-900 my-6" />

        {/* Automatic whitelist authorization display */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="w-full bg-neutral-950/85 backdrop-blur-xl border border-neutral-900 rounded-3xl p-6 shadow-2xl space-y-5"
        >
          {isWhitelisted ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 justify-center text-emerald-500 text-[10px] font-mono tracking-widest uppercase">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>IDENTITÉ DOUBLE BIOMÉTRIQUE CONFIRMÉE</span>
              </div>
              
              <div className="p-3 text-center rounded-xl bg-emerald-950/10 border border-emerald-500/20 text-neutral-300 font-mono text-[9.5px] uppercase tracking-wider leading-relaxed">
                Bienvenue dans les salons d'exception de la réserve. Votre accès VIP est actif et certifié de bout en bout.
              </div>

              <button
                onClick={() => {
                  triggerHaptic('success', 'Entrée confirmée');
                  onEnter();
                }}
                className="w-full py-4 px-4 rounded-xl border border-[#D4AF37] bg-gradient-to-r from-[#AA8B2C] via-[#D4AF37] to-amber-100 text-black font-extrabold text-[10px] tracking-[0.25em] uppercase duration-300 shadow-xl shadow-black hover:scale-[1.01] active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
              >
                ENTRER DANS LA RÉSERVE HASH'N FLASH MOCRO
              </button>
            </div>
          ) : (
            <div className="space-y-4 text-center">
              <div className="flex items-center gap-2 justify-center text-amber-500 text-[9.5px] font-mono tracking-widest uppercase">
                <ShieldAlert className="w-4 h-4 text-[#D4AF37]" />
                <span>ENTRÉE RESTREINTE AU PUBLIC</span>
              </div>

              <div className="p-4 rounded-xl bg-black border border-neutral-900 text-left space-y-2.5 font-mono text-[9px] text-[#FCFAF6] leading-none">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500 uppercase">IDENTIFICATION :</span>
                  <span className="text-red-500 font-bold uppercase">ACCÈS CLIENT INTERDIT</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500 uppercase">ID TELEGRAM :</span>
                  <span className="text-[#D4AF37] font-bold select-all">{tgUser?.id || 'NON DETECTÉ'}</span>
                </div>
                {tgUser?.username && (
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500 uppercase">CLIENT VIP :</span>
                    <span className="text-[#D4AF37]">@{tgUser.username}</span>
                  </div>
                )}
                <div className="h-[1px] bg-neutral-900 my-1" />
                <p className="text-[8.5px] text-zinc-500 leading-normal uppercase tracking-wide">
                  ⚠️ Cet ID n'est pas autorisé dans l'infrastructure de la réserve. Votre accès doit être validé manuellement.
                </p>
              </div>

              <a
                href="https://t.me/omerta_068"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => triggerHaptic('medium')}
                className="w-full py-4 px-4 rounded-xl border border-[#D4AF37]/50 bg-[#D4AF37]/5 hover:bg-[#D4AF37]/10 text-[#D4AF37] font-extrabold text-[10px] tracking-[0.2em] uppercase duration-300 shadow-md cursor-pointer flex items-center justify-center gap-2 select-none"
              >
                REJOINDRE LA DISCUSSION VIP
              </a>
            </div>
          )}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1 }}
          className="text-[8px] text-neutral-500 max-w-[280px] leading-relaxed font-mono text-center tracking-widest mt-6 uppercase"
        >
          {isWhitelisted 
            ? "Liaison cryptographique de bout en bout — Aucune transmission tierce."
            : "Chiffrement AES-256 actif — Seules les connexions enregistrées sont déverrouillées."
          }
        </motion.p>
      </div>

      {/* Footer copyright */}
      <div className="relative z-10 flex flex-col items-center pb-4">
        <span className="text-[8px] text-neutral-600 font-mono tracking-[0.3em] uppercase">
          HASH'N FLASH MOCRO • CLIENTS PORTAL
        </span>
      </div>
    </div>
  );
}
