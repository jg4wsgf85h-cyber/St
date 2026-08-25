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

  // Smooth loading progress bar simulation (0% -> 100% in ~500ms) and direct entry
  useEffect(() => {
    let start = Date.now();
    const duration = 500;

    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const currentProgress = Math.min(100, Math.floor((elapsed / duration) * 100));
      setProgress(currentProgress);

      if (currentProgress < 40) {
        setLoadingText('Initialisation de la réserve...');
      } else if (currentProgress < 85) {
        setLoadingText('Chargement du catalogue...');
      } else {
        setLoadingText('Accès autorisé...');
      }

      if (currentProgress >= 100) {
        clearInterval(interval);
        triggerHaptic('success', 'Bienvenue');
        onEnter();
      }
    }, 20);

    // Hard fallback: guarantees entering even if intervals are delayed by browser throttling
    const fallbackTimer = setTimeout(() => {
      triggerHaptic('success', 'Bienvenue');
      onEnter();
    }, 600);

    return () => {
      clearInterval(interval);
      clearTimeout(fallbackTimer);
    };
  }, [onEnter, triggerHaptic]);

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
          
          {/* Luxury Brand Title (No round logo as requested) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-2 text-center"
          >
            <h1 className="font-mono text-xl md:text-2xl font-black tracking-[0.25em] text-white uppercase flex items-center justify-center gap-2">
              <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-orange-400 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]">
                SECRET FARMZ
              </span>
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            </h1>
            <p className="text-[10px] md:text-xs font-mono tracking-[0.3em] uppercase text-amber-400/90 font-bold">
              {settings?.introStatusLine || 'PRIVATE RESERVE — BOUTIQUE OFFICIELLE'}
            </p>
          </motion.div>

          {/* Automatic Luxury Loading Progress Bar (Enters directly) */}
          <div 
            onClick={() => {
              triggerHaptic('success', 'Bienvenue');
              onEnter();
            }}
            className="w-full max-w-xs space-y-3 pt-2 cursor-pointer"
          >
            <div className="flex items-center justify-between text-[11px] font-mono tracking-widest text-neutral-400">
              <span className="flex items-center gap-1.5 text-amber-400 font-bold uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                {loadingText}
              </span>
              <span className="text-amber-300/90 font-bold">{progress}%</span>
            </div>

            {/* Glowing Track & Fill Bar */}
            <div className="relative w-full h-1.5 bg-black/60 border border-white/10 rounded-full overflow-hidden backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.5)]">
              <motion.div
                className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-amber-300 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.8)]"
                style={{ width: `${progress}%` }}
                transition={{ ease: 'easeOut', duration: 0.1 }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
