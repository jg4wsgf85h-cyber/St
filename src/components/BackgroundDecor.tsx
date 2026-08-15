import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';

interface BackgroundDecorProps {
  bgUrl?: string;
  videoUrl?: string;
  videoWebmUrl?: string;
  videoMp4Url?: string;
}

const DEFAULT_MOUNTAIN_DECOR = 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=2400&auto=format&fit=crop';

export default function BackgroundDecor({ bgUrl, videoUrl, videoWebmUrl, videoMp4Url }: BackgroundDecorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [videoLoaded, setVideoLoaded] = useState<boolean>(false);

  const activeImage = bgUrl && bgUrl.trim() !== '' ? bgUrl : DEFAULT_MOUNTAIN_DECOR;

  // Determine WebM and MP4 source URLs ONLY if explicitly set by user
  const customVideo = videoUrl && videoUrl.trim() !== '' ? videoUrl.trim() : null;
  
  const webmUrl = videoWebmUrl || (customVideo && customVideo.endsWith('.webm') ? customVideo : null);
  const mp4Url = videoMp4Url || (customVideo && !customVideo.endsWith('.webm') ? customVideo : null);
  const hasVideo = Boolean(webmUrl || mp4Url);

  // Autoplay trigger on mount ONLY when a user-provided video URL exists
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

  // Particle and Fog Canvas loop
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.getBoundingClientRect().width || window.innerWidth);
    let height = (canvas.height = canvas.getBoundingClientRect().height || window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.getBoundingClientRect().width || window.innerWidth;
      height = canvas.height = canvas.getBoundingClientRect().height || window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Floating golden/amber dust particles
    const particles: Array<{
      x: number;
      y: number;
      radius: number;
      speedY: number;
      speedX: number;
      opacity: number;
      pulse: number;
      pulseSpeed: number;
    }> = [];

    const particleCount = Math.min(25, Math.floor(width / 35));

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.6 + 0.5,
        speedY: -(Math.random() * 0.2 + 0.06),
        speedX: (Math.random() - 0.5) * 0.12,
        opacity: Math.random() * 0.6 + 0.2,
        pulse: Math.random() * Math.PI,
        pulseSpeed: Math.random() * 0.02 + 0.01,
      });
    }

    let fogOffset1 = 0;
    let fogOffset2 = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Drifting Mountain Fog Banks
      fogOffset1 += 0.15;
      fogOffset2 += 0.1;

      // Lower mountain ridge fog gradient
      const fogGrad = ctx.createLinearGradient(0, height * 0.45, 0, height);
      fogGrad.addColorStop(0, 'rgba(0,0,0,0)');
      fogGrad.addColorStop(0.5, 'rgba(12, 10, 16, 0.35)');
      fogGrad.addColorStop(1, 'rgba(5, 5, 8, 0.7)');
      ctx.fillStyle = fogGrad;
      ctx.fillRect(0, height * 0.45, width, height * 0.55);

      // Horizontal drifting mist wave 1
      ctx.save();
      ctx.beginPath();
      ctx.fillStyle = 'rgba(212, 175, 55, 0.025)';
      ctx.moveTo(0, height * 0.6);
      for (let x = 0; x <= width; x += 50) {
        const y = height * 0.6 + Math.sin((x + fogOffset1 * 10) * 0.005) * 18;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.fill();
      ctx.restore();

      // Horizontal drifting mist wave 2
      ctx.save();
      ctx.beginPath();
      ctx.fillStyle = 'rgba(255, 140, 0, 0.02)';
      ctx.moveTo(0, height * 0.7);
      for (let x = 0; x <= width; x += 60) {
        const y = height * 0.7 + Math.cos((x + fogOffset2 * 15) * 0.004) * 20;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.fill();
      ctx.restore();

      // 2. Render Floating Golden Particles
      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.pulse += p.pulseSpeed;

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        const currentOpacity = p.opacity * (0.6 + 0.4 * Math.sin(p.pulse));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245, 170, 40, ${currentOpacity.toFixed(3)})`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-black select-none">
      {/* Mountain Background Container with Subtle Slow Float / Parallax Movement */}
      <motion.div 
        initial={{ scale: 1.04, y: 0 }}
        animate={{ 
          scale: [1.04, 1.07, 1.04],
          y: [0, -6, 0]
        }}
        transition={{ 
          duration: 25, 
          repeat: Infinity, 
          ease: 'easeInOut' 
        }}
        className="absolute inset-0 w-full h-full"
      >
        {/* 1. Original static background image with deeper dark luxury grading */}
        <img
          src={activeImage}
          alt="Biscotti Boys Farm Reserve Background"
          className={`absolute inset-0 w-full h-full object-cover filter brightness-[0.55] contrast-[1.1] transition-opacity duration-700 ${
            hasVideo && videoLoaded ? 'opacity-0 pointer-events-none' : 'opacity-70'
          }`}
          loading="eager"
        />

        {/* 2. User background video player (ONLY rendered if user configured a video URL) */}
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
            className={`absolute inset-0 w-full h-full object-cover transform-gpu pointer-events-none filter brightness-[0.6] contrast-[1.05] transition-opacity duration-700 ${
              videoLoaded ? 'opacity-75' : 'opacity-0'
            }`}
          >
            {webmUrl && <source src={webmUrl} type="video/webm" />}
            {mp4Url && <source src={mp4Url} type="video/mp4" />}
          </video>
        )}
      </motion.div>

      {/* Atmospheric Fog and Floating Particles Canvas Overlay */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-60" />

      {/* Top, Center & Bottom Depth Vignettes to guarantee 100% crisp readability for product cards */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/60 to-black/95 pointer-events-none" />
      
      {/* Subtle Radial Golden Glow at top center */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[200px] bg-gradient-to-b from-amber-500/8 via-yellow-500/4 to-transparent blur-[120px] pointer-events-none" />
    </div>
  );
}

