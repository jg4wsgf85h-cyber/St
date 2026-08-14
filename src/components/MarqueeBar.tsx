import React from 'react';
import { Sparkles, Shield, Truck, Star, Flame, Crown } from 'lucide-react';
import { MarqueeConfig, DEFAULT_MARQUEE_CONFIG } from '../types';

interface MarqueeBarProps {
  config?: MarqueeConfig;
}

export default function MarqueeBar({ config }: MarqueeBarProps) {
  const currentConfig = config && typeof config.enabled === 'boolean' ? config : DEFAULT_MARQUEE_CONFIG;

  if (!currentConfig.enabled) {
    return null;
  }

  // Filter active items and sort by order
  const rawItems = currentConfig.items && currentConfig.items.length > 0 
    ? currentConfig.items 
    : DEFAULT_MARQUEE_CONFIG.items;

  const activeItems = rawItems
    .filter((item) => item.active !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  if (activeItems.length === 0) {
    return null;
  }

  // Calculate speed duration
  const speed = currentConfig.speed || 'medium';
  let durationSeconds = 30;
  if (speed === 'fast') durationSeconds = 16;
  if (speed === 'slow') durationSeconds = 50;

  // Duplicate the array to create a seamless infinite loop
  const displayItems = [...activeItems, ...activeItems, ...activeItems, ...activeItems];

  return (
    <div className="w-full bg-gradient-to-r from-black via-neutral-950 to-black border-b border-orange-500/30 py-1.5 select-none backdrop-blur-xl relative overflow-hidden shadow-[0_2px_15px_rgba(0,0,0,0.8)] z-30">
      
      {/* LED Glow Backdrop Line */}
      <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-amber-500/20 to-orange-500/10 pointer-events-none blur-sm" />

      {/* Left and Right edge fade overlays */}
      <div className="absolute top-0 bottom-0 left-0 w-8 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-0 w-8 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

      {/* Scrolling Track */}
      <div className="flex w-max items-center">
        <div 
          className="flex items-center gap-8 whitespace-nowrap animate-marquee"
          style={{
            animationDuration: `${durationSeconds}s`,
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite',
          }}
        >
          {displayItems.map((item, idx) => (
            <div 
              key={`${item.id}-${idx}`} 
              className="flex items-center gap-3 font-mono text-[9px] md:text-[10px] font-black uppercase tracking-[0.18em] text-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.65)]"
            >
              <span>{item.text}</span>
              <span className="text-orange-500/60 font-bold">•</span>
            </div>
          ))}
        </div>
      </div>

      {/* Global CSS for seamless keyframe marquee animation */}
      <style>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee linear infinite;
        }
      `}</style>
    </div>
  );
}
