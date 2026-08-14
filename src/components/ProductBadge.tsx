/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Tag } from 'lucide-react';

interface ProductBadgeProps {
  badge?: string;
  className?: string;
}

export default function ProductBadge({ badge, className = '' }: ProductBadgeProps) {
  if (!badge || badge === 'NONE') return null;

  let bgClass = 'bg-black/80 backdrop-blur-md';
  let borderClass = 'border-neutral-800';
  let textClass = 'text-white';
  let dotColor = '';
  let label = '';
  let showDot = true;
  let showTagIcon = false;

  const bKey = badge.toUpperCase();

  if (bKey === 'IN_STOCK' || bKey === 'IN STOCK' || bKey === '🟢 IN STOCK') {
    borderClass = 'border-emerald-500/30';
    textClass = 'text-emerald-400';
    dotColor = 'bg-emerald-400 shadow-[0_0_8px_#10b981]';
    label = 'IN STOCK';
  } else if (bKey === 'LAST' || bKey === '🟠 LAST') {
    borderClass = 'border-amber-500/30';
    textClass = 'text-amber-400';
    dotColor = 'bg-amber-400 shadow-[0_0_8px_#f59e0b]';
    label = 'LAST';
  } else if (bKey === 'OUT' || bKey === 'OUT_OF_STOCK' || bKey === 'OUT OF STOCK' || bKey === '🔴 OUT' || bKey === 'INDISPONIBLE') {
    borderClass = 'border-red-500/30';
    textClass = 'text-red-500';
    dotColor = 'bg-red-500 shadow-[0_0_8px_#ef4444]';
    label = 'INDISPONIBLE';
  } else {
    // If it's a dynamic promo like -12%, or general custom text
    borderClass = 'border-[#D4AF37]/35';
    textClass = 'text-[#D4AF37]';
    label = badge;
    showDot = false;
    showTagIcon = true;
  }

  return (
    <div
      className={`flex items-center gap-1.5 px-3 py-1 border rounded-full ${bgClass} ${borderClass} ${textClass} font-sans font-bold text-[8.5px] uppercase tracking-wider select-none ${className}`}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      )}
      {showTagIcon && (
        <Tag className="w-2.5 h-2.5 text-[#D4AF37] stroke-[2.5]" />
      )}
      <span>{label}</span>
    </div>
  );
}
