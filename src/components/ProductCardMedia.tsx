import { Play } from 'lucide-react';
import { VideoItem } from '../types';

interface ProductCardMediaProps {
  product: VideoItem;
  className?: string;
  hoverScale?: boolean;
}

export default function ProductCardMedia({
  product,
  className = '',
  hoverScale = true
}: ProductCardMediaProps) {
  const coverPhoto = product.thumbnailUrl || product.imageUrl || undefined;
  const hasVideo = Boolean(product.videoUrl && product.videoUrl.trim() !== '');

  return (
    <div className={`relative w-full h-full bg-neutral-950 overflow-hidden ${className}`}>
      {/* High performance static photo */}
      {coverPhoto ? (
        <img
          src={coverPhoto}
          alt={product.title}
          loading="lazy"
          decoding="async"
          className={`w-full h-full object-cover transition-transform duration-500 ${
            hoverScale ? 'group-hover:scale-105' : ''
          }`}
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-neutral-600 font-mono text-xs select-none">
          SECRET FARMZ
        </div>
      )}

      {/* Discrete video indicator badge if product has an associated video */}
      {hasVideo && (
        <div className="absolute top-2 right-2 z-10 pointer-events-none flex items-center gap-1 bg-black/65 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10 text-[9px] font-mono font-medium text-white/90 shadow-sm">
          <Play className="w-2.5 h-2.5 text-[#D4AF37] fill-[#D4AF37]" />
          <span className="text-[8px] tracking-wider uppercase font-bold text-gray-200">Video</span>
        </div>
      )}
    </div>
  );
}
