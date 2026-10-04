import React, { useState } from 'react';

export interface RentReuseLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'badge';
  invertOnDark?: boolean;
  className?: string;
  showSubtitle?: boolean;
  subtitleText?: string;
  preferImage?: boolean;
}

const GENERATED_LOGO_URL = '/src/assets/images/rentreuse_logo_1791029179678.jpg';

export const RentReuseLogo: React.FC<RentReuseLogoProps> = ({
  size = 'md',
  variant = 'full',
  invertOnDark = false,
  className = '',
  showSubtitle = false,
  subtitleText = 'Campus Sharing Network',
  preferImage = true,
}) => {
  const [imageError, setImageError] = useState(false);

  // Dimension presets
  const sizeMap = {
    xs: { box: 'w-6 h-6', img: 'w-6 h-6', text: 'text-sm', sub: 'text-[9px]' },
    sm: { box: 'w-8 h-8', img: 'w-8 h-8', text: 'text-base', sub: 'text-[10px]' },
    md: { box: 'w-9 h-9', img: 'w-9 h-9', text: 'text-lg', sub: 'text-[11px]' },
    lg: { box: 'w-12 h-12', img: 'w-12 h-12', text: 'text-2xl', sub: 'text-xs' },
    xl: { box: 'w-16 h-16', img: 'w-16 h-16', text: 'text-3xl', sub: 'text-sm' },
  };

  const currentSize = sizeMap[size];

  // Vector SVG Icon Mark
  const VectorMark = (
    <div
      className={`${currentSize.box} relative shrink-0 rounded-xl overflow-hidden shadow-sm transition-transform group-hover:scale-105 flex items-center justify-center`}
    >
      {preferImage && !imageError ? (
        <img
          src={GENERATED_LOGO_URL}
          alt="RentReuse Logo"
          referrerPolicy="no-referrer"
          onError={() => setImageError(true)}
          className={`${currentSize.img} object-cover rounded-xl border border-emerald-500/20 shadow-sm`}
        />
      ) : (
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm"
        >
          {/* Outer Rounded Container with emerald-teal gradient */}
          <rect width="64" height="64" rx="16" fill="url(#rrGradient)" />
          
          {/* Subtle glossy border */}
          <rect
            x="0.75"
            y="0.75"
            width="62.5"
            height="62.5"
            rx="15.25"
            stroke="rgba(255, 255, 255, 0.25)"
            strokeWidth="1.5"
          />

          {/* Upper Circular Loop Arrow */}
          <path
            d="M20 25C22 19 28 15 36 15C44 15 50 20 50 28"
            stroke="white"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          <path
            d="M48 20L51.5 28L43.5 29"
            fill="white"
            stroke="white"
            strokeWidth="1"
            strokeLinejoin="round"
          />

          {/* Lower Circular Loop Arrow */}
          <path
            d="M44 39C42 45 36 49 28 49C20 49 14 44 14 36"
            stroke="#A7F3D0"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          <path
            d="M16 44L12.5 36L20.5 35"
            fill="#A7F3D0"
            stroke="#A7F3D0"
            strokeWidth="1"
            strokeLinejoin="round"
          />

          {/* Central Academic Cap / Diamond Node */}
          <path
            d="M32 23L42 28.5L32 34L22 28.5L32 23Z"
            fill="white"
            fillOpacity="0.95"
          />
          <path
            d="M32 34V39C32 40.5 35 41.5 37 40.5V36.5"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Academic Tassel */}
          <circle cx="24" cy="33" r="1.5" fill="#FEF08A" />

          {/* Gradient Definition */}
          <defs>
            <linearGradient
              id="rrGradient"
              x1="0"
              y1="0"
              x2="64"
              y2="64"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#047857" />
              <stop offset="0.5" stopColor="#059669" />
              <stop offset="1" stopColor="#0f766e" />
            </linearGradient>
          </defs>
        </svg>
      )}
    </div>
  );

  if (variant === 'icon') {
    return <div className={`inline-flex items-center ${className}`}>{VectorMark}</div>;
  }

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {VectorMark}

      <div className="flex flex-col text-left leading-none">
        <div className={`font-extrabold tracking-tight ${currentSize.text} flex items-center`}>
          <span
            className={
              invertOnDark
                ? 'text-white'
                : 'text-slate-900 dark:text-white'
            }
          >
            Rent
          </span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300 ml-0.5">
            Reuse
          </span>
        </div>

        {showSubtitle && (
          <span
            className={`mt-1 font-semibold uppercase tracking-wider ${currentSize.sub} ${
              invertOnDark
                ? 'text-emerald-200/80'
                : 'text-slate-400 dark:text-slate-400'
            }`}
          >
            {subtitleText}
          </span>
        )}
      </div>
    </div>
  );
};
