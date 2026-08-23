/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Volume2, VolumeX, ShieldAlert, KeyRound, Sparkles, CheckCircle2, ShieldCheck, Lock, MessageSquare, RefreshCw } from 'lucide-react';

interface IntroScreenProps {
  onEnter: () => void;
  audioPlaying: boolean;
  onToggleAudio: () => void;
  triggerHaptic: (style: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error', customMessage?: string) => void;
  settings?: any;
  tgUser?: any;
  isWhitelisted: boolean;
  onOpenAdmin?: () => void;
  onRecheckAccess?: () => void;
}

const isVideoUrl = (url?: string): boolean => {
  if (!url) return false;
  const cleanUrl = url.toLowerCase().split('?')[0];
  return cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.webm') || cleanUrl.endsWith('.mov') || url.includes('video') || url.includes('mp4');
};

const checkIsLowPerformanceDevice = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  if (conn?.saveData) return true;
  if (conn?.effectiveType && ['slow-2g', '2g', '3g'].includes(conn.effectiveType)) return true;
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) return true;
  if ((navigator as any).deviceMemory && (navigator as any).deviceMemory < 4) return true;
  return false;
};

const DEFAULT_MOUNTAIN_IMAGE = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2000&auto=format&fit=crop';

export default function IntroScreen({ 
  onEnter, 
  audioPlaying, 
  onToggleAudio, 
  triggerHaptic, 
  settings, 
  tgUser, 
  isWhitelisted,
  onOpenAdmin,
  onRecheckAccess,
}: IntroScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [progress, setProgress] = useState<number>(0);
  const [loadingText, setLoadingText] = useState<string>('Initialisation...');
  const [hasTriggeredAutoEnter, setHasTriggeredAutoEnter] = useState<boolean>(false);

  const isInsideTelegram = useMemo(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg) return false;
    if (tg.initData && tg.initData.trim() !== '') return true;
    if (tg.platform && tg.platform !== 'unknown') return true;
    return false;
  }, []);

  // Smooth loading progress bar simulation (0% -> 100% in ~1.2s)
  useEffect(() => {
    let start = Date.now();
    const duration = 1200;

    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const currentProgress = Math.min(100, Math.floor((elapsed / duration) * 100));
      setProgress(currentProgress);

      if (currentProgress < 30) {
        setLoadingText('Initialisation du système...');
      } else if (currentProgress < 70) {
        setLoadingText('Synchronisation de la réserve...');
      } else if (currentProgress < 99) {
        setLoadingText('Connexion privée certifiée...');
      } else {
        setLoadingText('Accès autorisé');
      }

      if (currentProgress >= 100) {
        clearInterval(interval);
      }
    }, 25);

    return () => clearInterval(interval);
  }, []);

  // Automatic entry when loading progress reaches 100%
  useEffect(() => {
    if (progress >= 100 && !hasTriggeredAutoEnter) {
      setHasTriggeredAutoEnter(true);
      const timer = setTimeout(() => {
        triggerHaptic('success', 'Bienvenue dans la réserve');
        onEnter();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [progress, hasTriggeredAutoEnter, onEnter, triggerHaptic]);

  // Subtle animated canvas mist & particle overlay over the mountain background
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.getBoundingClientRect().width || window.innerWidth);
    let height = (canvas.height = canvas.getBoundingClientRect().height || window.innerHeight);

    // Subtle drifting golden sparkles
    const particles: Array<{
      x: number;
      y: number;
      radius: number;
      speedY: number;
      speedX: number;
      opacity: number;
    }> = [];

    for (let i = 0; i < 28; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.8 + 0.5,
        speedY: -(Math.random() * 0.2 + 0.05),
        speedX: Math.random() * 0.2 - 0.1,
        opacity: Math.random() * 0.6 + 0.2,
      });
    }

    // Drifting mountain mist fog streaks
    let mistX = 0;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Light ambient mist glow at bottom mountain ridge
      mistX += 0.3;
      const mistGrad = ctx.createLinearGradient(0, height * 0.5, 0, height);
      mistGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      mistGrad.addColorStop(0.7, 'rgba(10, 10, 10, 0.25)');
      mistGrad.addColorStop(1, 'rgba(5, 5, 5, 0.5)');
      ctx.fillStyle = mistGrad;
      ctx.fillRect(0, height * 0.5, width, height * 0.5);

      // Draw floating golden particles
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#FFB700';
        ctx.globalAlpha = p.opacity;
        ctx.fill();
        ctx.globalAlpha = 1.0;

        p.y += p.speedY;
        p.x += p.speedX;

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
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
  }, []);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState<boolean>(false);

  const customVideoUrl = settings?.introVideoUrl || (settings?.introBgUrl && isVideoUrl(settings.introBgUrl) ? settings.introBgUrl : null);
  const webmUrl = customVideoUrl && customVideoUrl.endsWith('.webm') ? customVideoUrl : null;
  const mp4Url = customVideoUrl && !customVideoUrl.endsWith('.webm') ? customVideoUrl : null;
  const hasVideo = Boolean(webmUrl || mp4Url);
  const activeImageUrl = settings?.introBgUrl && !isVideoUrl(settings.introBgUrl) ? settings.introBgUrl : DEFAULT_MOUNTAIN_IMAGE;

  // Instant play attempt on mount if user configured a video URL
  useEffect(() => {
    if (hasVideo && videoRef.current) {
      videoRef.current.muted = true;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setVideoLoaded(true))
          .catch(() => setVideoLoaded(false));
      }
    }
  }, [hasVideo, webmUrl, mp4Url]);

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-between p-6 overflow-hidden bg-[#0a0a0a] text-white select-none transition-opacity duration-500">
      
      {/* High-Definition Visible Mountain Background (30-40% overlay for vivid landscape) */}
      <div className="absolute inset-0 z-0 overflow-hidden flex items-center justify-center">
        {/* Static background image */}
        <img
          src={activeImageUrl}
          alt="Mountain Landscape"
          className={`absolute inset-0 w-full h-full object-cover filter brightness-90 contrast-105 scale-105 transition-opacity duration-700 ${
            hasVideo && videoLoaded ? 'opacity-0 pointer-events-none' : 'opacity-90'
          }`}
          loading="eager"
        />

        {/* User-configured Video Player (ONLY rendered if user provided a video URL) */}
        {hasVideo && (
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            disablePictureInPicture
            aria-hidden="true"
            preload="auto"
            {...{ 'webkit-playsinline': 'true', 'x5-playsinline': 'true' }}
            onCanPlay={() => setVideoLoaded(true)}
            onPlaying={() => setVideoLoaded(true)}
            onLoadedData={() => setVideoLoaded(true)}
            onError={() => setVideoLoaded(false)}
            className={`w-full h-full object-cover filter brightness-90 contrast-105 scale-105 transition-opacity duration-700 transform-gpu pointer-events-none ${
              videoLoaded ? 'opacity-90' : 'opacity-0'
            }`}
          >
            {webmUrl && <source src={webmUrl} type="video/webm" />}
            {mp4Url && <source src={mp4Url} type="video/mp4" />}
          </video>
        )}

        {/* Soft 30-40% Vignette Overlay - Keeps mountains completely clear and vivid */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/50 pointer-events-none" />
      </div>

      {/* Particle & Mist Overlay Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0" />

      {/* Header controls: Audio Toggle */}
      <div className="relative z-10 flex items-center justify-between">
        <div />

        <button
          onClick={() => {
            triggerHaptic('light');
            onToggleAudio();
          }}
          className="p-2.5 rounded-full border border-white/20 bg-black/50 backdrop-blur-xl text-orange-400 hover:bg-black/70 hover:scale-105 active:scale-95 transition shadow-lg"
          title="Musique de fond"
        >
          {audioPlaying ? (
            <Volume2 className="w-4 h-4 text-orange-400 animate-pulse" />
          ) : (
            <VolumeX className="w-4 h-4 text-neutral-400" />
          )}
        </button>
      </div>

      {/* Central Container - Clean without text clutter */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto text-center px-4 w-full max-w-sm mx-auto">
        <div className="w-full bg-transparent p-4 space-y-8 flex flex-col items-center relative overflow-hidden">
          
          {/* Animated Brand Logo Badge with Radiant Backlight Halo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="relative group cursor-pointer inline-block"
            onClick={() => {
              triggerHaptic('medium');
              onEnter();
            }}
          >
            {/* Radiant Backlight Halo behind the logo */}
            <div className="absolute -inset-8 rounded-full bg-gradient-to-r from-amber-500/40 via-orange-500/50 to-amber-600/40 blur-2xl animate-pulse scale-125 pointer-events-none" />

            {/* Logo Badge Container */}
            <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-full border border-orange-500/60 bg-gradient-to-br from-neutral-900 via-black to-neutral-950 flex items-center justify-center shadow-[0_0_50px_rgba(245,158,11,0.45)]">
              {settings?.logoUrl ? (
                <img src={settings.logoUrl} alt="👽⛰️ALIENS FARMS OFFICIEL⛰️👽 Logo" className="w-24 h-24 md:w-28 md:h-28 rounded-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <span className="font-mono text-2xl md:text-3xl font-black text-orange-400 tracking-wider">
                    AF
                  </span>
                  <Sparkles className="w-4 h-4 text-amber-300 animate-pulse -mt-0.5" />
                </div>
              )}
              <div className="absolute inset-1 rounded-full border border-orange-500/30 border-dashed animate-[spin_20s_linear_infinite]" />
            </div>
          </motion.div>

          {/* Clean 'ACCÉDER À LA RÉSERVE' Button */}
          <motion.button
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              triggerHaptic('heavy', 'Bienvenue dans la réserve');
              onEnter();
            }}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-black font-black font-mono text-xs md:text-sm tracking-[0.2em] uppercase shadow-[0_0_35px_rgba(245,158,11,0.6)] hover:shadow-[0_0_50px_rgba(245,158,11,0.8)] transition duration-200 cursor-pointer"
          >
            Accéder à la Réserve
          </motion.button>
        </div>
      </div>
    </div>
  );
}
