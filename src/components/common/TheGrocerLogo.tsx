import React from 'react';

export interface TheGrocerLogoProps {
  variant?: 'brand' | 'dark' | 'light' | 'monochrome';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  showWordmark?: boolean;
  subtitle?: string;
  className?: string;
}

const SIZE_MAP = {
  xs: 18,
  sm: 24,
  md: 32,
  lg: 44,
  xl: 56
};

/**
 * THE GROCER — Official Brand Mark
 * Faithful representation of the FMCG Canned-Good icon mark:
 * - Top cylindrical cap & inner rim groove
 * - Clean cylindrical body
 * - Sweeping diagonal lower fill with four distinctive wave ribs
 * - Base collar and footing ring
 */
export const TheGrocerLogo: React.FC<TheGrocerLogoProps> = ({
  variant = 'brand',
  size = 'md',
  showWordmark = true,
  subtitle,
  className = ''
}) => {
  const pixelSize = typeof size === 'number' ? size : SIZE_MAP[size] || 32;
  const logoId = React.useId().replace(/:/g, '');

  // Colors based on variant
  const getColors = () => {
    switch (variant) {
      case 'light':
        return {
          stroke: '#FFFFFF',
          fill: '#FFFFFF',
          waveFill: '#FFFFFF',
          stripe: '#176B4D',
          innerGroove: 'rgba(255,255,255,0.7)',
          text: 'text-white',
          textMuted: 'text-[#DDEBE1]',
          badgeBg: 'bg-white/15 text-white border-white/30'
        };
      case 'dark':
      case 'monochrome':
        return {
          stroke: 'currentColor',
          fill: 'currentColor',
          waveFill: 'currentColor',
          stripe: 'var(--color-canvas, #FAFAF7)',
          innerGroove: 'currentColor',
          text: 'text-current',
          textMuted: 'text-current opacity-70',
          badgeBg: 'bg-current/10 text-current border-current/20'
        };
      case 'brand':
      default:
        return {
          stroke: '#176B4D',
          fill: '#176B4D',
          waveFill: '#176B4D',
          stripe: '#FFFFFF',
          innerGroove: '#176B4D',
          text: 'text-[#163829]',
          textMuted: 'text-[#737A74]',
          badgeBg: 'bg-[#EAF4ED] text-[#176B4D] border-[#DDEBE1]'
        };
    }
  };

  const colors = getColors();

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Canned-Good Vector Mark */}
      <svg
        width={pixelSize}
        height={Math.round(pixelSize * 1.22)}
        viewBox="0 0 100 122"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-200 select-none"
        aria-label="THE GROCER canned-good brand mark"
      >
        <defs>
          <clipPath id={`can-clip-${logoId}`}>
            <rect x="15" y="16" width="70" height="92" rx="1" />
          </clipPath>
        </defs>

        {/* 1. Base Can Interior Body with Sweeping Wave Ribs */}
        <g clipPath={`url(#can-clip-${logoId})`}>
          {/* Subtle interior backing */}
          <rect
            x="15"
            y="16"
            width="70"
            height="92"
            fill={variant === 'light' ? 'rgba(255,255,255,0.08)' : '#EEF4EE'}
          />

          {/* Lower diagonal wave fill */}
          <path
            d="M 15 62 Q 50 82 85 58 L 85 110 L 15 110 Z"
            fill={colors.waveFill}
          />

          {/* 4 Distinctive White Wave Ribs Across Lower Zone */}
          <path
            d="M 12 73 Q 50 93 88 69"
            stroke={colors.stripe}
            strokeWidth="4.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 12 84 Q 50 104 88 80"
            stroke={colors.stripe}
            strokeWidth="4.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 12 95 Q 50 115 88 91"
            stroke={colors.stripe}
            strokeWidth="4.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 12 106 Q 50 126 88 102"
            stroke={colors.stripe}
            strokeWidth="4.5"
            strokeLinecap="round"
            fill="none"
          />
        </g>

        {/* 2. Main Cylinder Outer Border */}
        <rect
          x="15"
          y="16"
          width="70"
          height="92"
          stroke={colors.stroke}
          strokeWidth="5.5"
          fill="none"
        />

        {/* 3. Top Rim Cap */}
        <rect
          x="10"
          y="10"
          width="80"
          height="12"
          rx="6"
          stroke={colors.stroke}
          strokeWidth="5.5"
          fill={variant === 'light' ? '#176B4D' : '#FFFFFF'}
        />

        {/* Top Rim Inner Groove */}
        <ellipse
          cx="50"
          cy="16"
          rx="30"
          ry="1.8"
          fill={colors.innerGroove}
          opacity="0.8"
        />

        {/* 4. Bottom Rim & Base Ring Footing */}
        <rect
          x="13"
          y="106"
          width="74"
          height="7"
          rx="3"
          stroke={colors.stroke}
          strokeWidth="4.5"
          fill={variant === 'light' ? '#176B4D' : '#FFFFFF'}
        />
        <rect
          x="8"
          y="113"
          width="84"
          height="7"
          rx="3.5"
          fill={colors.stroke}
        />
      </svg>

      {/* Optional Wordmark */}
      {showWordmark && (
        <div className="flex flex-col justify-center leading-tight">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-bold tracking-[0.06em] font-sans ${colors.text} ${
                pixelSize >= 36 ? 'text-lg' : pixelSize >= 28 ? 'text-sm' : 'text-xs'
              }`}
            >
              THE GROCER
            </span>
            <span
              className={`text-[9px] font-sans font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${colors.badgeBg}`}
            >
              RETAIL
            </span>
          </div>
          {subtitle && (
            <span className={`text-[10px] tracking-normal font-normal truncate mt-0.5 ${colors.textMuted}`}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
