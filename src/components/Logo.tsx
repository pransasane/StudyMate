import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  showWordmark?: boolean;
  variant?: 'horizontal' | 'emblem' | 'stacked';
  theme?: 'light' | 'dark';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showSubtitle = true,
  showWordmark = true,
  variant = 'horizontal',
  theme = 'light',
  className = '',
}) => {
  const dimensions = {
    sm: { icon: 'w-8 h-8', text: 'text-xl', sub: 'text-[9px]' },
    md: { icon: 'w-10 h-10', text: 'text-2xl', sub: 'text-[10px]' },
    lg: { icon: 'w-12 h-12', text: 'text-3xl', sub: 'text-xs' },
    xl: { icon: 'w-16 h-16', text: 'text-4xl', sub: 'text-sm' },
  }[size];

  // Distinct SVG gradient IDs to prevent collisions if multiple instances are rendered
  const idSuffix = React.useId().replace(/:/g, '_');
  const blueGradId = `sm_blue_${idSuffix}`;
  const greenGradId = `sm_green_${idSuffix}`;
  const mateGradId = `sm_mate_${idSuffix}`;

  // If stacked variant is requested (like the standalone vertical badge from the asset)
  if (variant === 'stacked') {
    return (
      <div className={`flex flex-col items-center text-center select-none ${className}`}>
        <img
          src="/studymate-logo.svg"
          alt="StudyMate Logo"
          className={`${size === 'xl' ? 'w-36 h-auto' : size === 'lg' ? 'w-28 h-auto' : 'w-24 h-auto'} object-contain drop-shadow-xs transition-transform hover:scale-105 duration-200`}
        />
        {showSubtitle && (
          <span className="uppercase font-bold tracking-widest text-slate-500 text-[10px] mt-1.5">
            AI Learning Companion
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* StudyMate Official Education Emblem (Directly matched to studymate-logo.svg) */}
      <div className={`relative ${dimensions.icon} shrink-0 transition-transform hover:scale-105 duration-200`}>
        <svg
          viewBox="105 32 210 222"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-xs"
        >
          <defs>
            {/* Left Figure Blue Gradient */}
            <linearGradient id={blueGradId} x1="140" y1="90" x2="200" y2="200" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#00a0f5" />
              <stop offset="45%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0052cc" />
            </linearGradient>

            {/* Right Figure Green Gradient */}
            <linearGradient id={greenGradId} x1="280" y1="90" x2="220" y2="200" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#2dd4bf" />
              <stop offset="35%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>

          {/* 1. Graduation Cap (Mortarboard) */}
          <g id="graduation-cap">
            <polygon points="210,38 152,65 210,92 268,65" fill={theme === 'dark' ? '#f8fafc' : '#08182b'} />
            <path d="M174,75.5 Q210,98 246,75.5 L243,92 Q210,108 177,92 Z" fill={theme === 'dark' ? '#cbd5e1' : '#0b1e36'} />
            <circle cx="210" cy="65" r="3.5" fill={theme === 'dark' ? '#38bdf8' : '#1e3a5f'} />
            <path d="M210,65 Q232,70 258,82" stroke={theme === 'dark' ? '#f8fafc' : '#08182b'} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <polygon points="256,80 262,83 259,98 254,98" fill={theme === 'dark' ? '#f8fafc' : '#08182b'} />
          </g>

          {/* 2. Left Student Figure (Blue) */}
          <g id="figure-left">
            <circle cx="158" cy="112" r="19" fill="#0284c7" />
            <path
              d="M124,142 C146,144 158,162 176,178 C192,192 198,206 204,228 C198,214 188,198 176,182 C164,166 148,154 124,142 Z"
              fill={`url(#${blueGradId})`}
            />
            <path
              d="M125,142 C148,142 165,152 178,168 C194,188 202,210 205,228 C202,204 196,172 176,140 C194,124 204,96 206,94 C204,104 196,134 184,144 C172,132 152,126 125,142 Z"
              fill={`url(#${blueGradId})`}
            />
          </g>

          {/* 3. Right Student Figure (Green) */}
          <g id="figure-right">
            <circle cx="262" cy="112" r="19" fill="#10b981" />
            <path
              d="M295,142 C272,142 255,152 242,168 C226,188 218,210 215,228 C218,204 224,172 244,140 C226,124 216,96 214,94 C216,104 224,134 236,144 C248,132 268,126 295,142 Z"
              fill={`url(#${greenGradId})`}
            />
          </g>

          {/* 4. Open Book Pages */}
          <g id="open-book">
            {/* Left Top Page Stripe */}
            <path d="M204,216 C176,192 142,184 128,184 C126,188 126,192 128,194 C144,194 176,202 203,222 Z" fill="#00a0f5" />
            {/* Left Middle Page Stripe */}
            <path d="M202,223 C172,202 136,194 116,195 C114,199 114,203 116,206 C136,205 172,213 200,230 Z" fill="#0284c7" />
            {/* Left Bottom Cover Stripe */}
            <path d="M198,231 C165,214 126,206 112,208 C112,216 116,220 118,222 C134,220 166,226 195,238 Z" fill={theme === 'dark' ? '#0f172a' : '#081e3a'} />
            {/* Left Spine Base Arch */}
            <path d="M112,228 C144,228 178,236 208,248 C206,244 204,240 200,237 C174,228 140,222 112,222 Z" fill={theme === 'dark' ? '#0f172a' : '#081e3a'} />

            {/* Right Top Page Stripe */}
            <path d="M216,216 C244,192 278,184 292,184 C294,188 294,192 292,194 C276,194 244,202 217,222 Z" fill="#2dd4bf" />
            {/* Right Middle Page Stripe */}
            <path d="M218,223 C248,202 284,194 304,195 C306,199 306,203 304,206 C284,205 248,213 220,230 Z" fill="#10b981" />
            {/* Right Bottom Cover Stripe */}
            <path d="M222,231 C255,214 294,206 308,208 C308,216 304,220 302,222 C286,220 254,226 225,238 Z" fill="#059669" />
            {/* Right Spine Base Arch */}
            <path d="M308,228 C276,228 242,236 212,248 C214,244 216,240 220,237 C246,228 280,222 308,222 Z" fill="#064e3b" />
          </g>
        </svg>
      </div>

      {/* Typography: "Study" in Deep Navy / White, "Mate" in Emerald Green */}
      {showWordmark && variant !== 'emblem' && (
        <div className="flex flex-col text-left leading-none">
          <div className={`font-black tracking-tight ${dimensions.text} flex items-center`}>
            <span className={theme === 'dark' ? 'text-white font-extrabold' : 'text-[#091e3a] font-extrabold'}>Study</span>
            <span className="bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 bg-clip-text text-transparent font-black ml-0.5">
              Mate
            </span>
          </div>

          {showSubtitle && (
            <span className={`uppercase font-bold tracking-widest ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} mt-1 ${dimensions.sub}`}>
              AI Learning Companion
            </span>
          )}
        </div>
      )}
    </div>
  );
};
