import React from 'react';

interface LogoProps {
  variant?: 'light' | 'dark' | 'auto';
  className?: string;
  iconOnly?: boolean;
  layout?: 'horizontal' | 'vertical';
}

export const WargaLaporLogo: React.FC<LogoProps> = ({
  variant = 'auto',
  className,
  iconOnly = false,
  layout = 'horizontal',
}) => {
  // If variant is light, text is dark slate. If dark, text is white.
  // In auto mode, text adapts via CSS currentColor or classes
  const isDark = variant === 'dark';

  if (layout === 'vertical') {
    return (
      <div className={`flex flex-col items-center justify-center text-center select-none ${className || ''}`}>
        {/* Location Pin with soft ground shadow */}
        <div className="relative flex justify-center items-center">
          <svg
            viewBox="0 0 100 118"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-32 sm:w-40 lg:w-44 h-auto overflow-visible"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="wl-teal-grad-v" x1="10" y1="5" x2="90" y2="100" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#0d9488" />
                <stop offset="100%" stopColor="#14b8a6" />
              </linearGradient>

              <linearGradient id="wl-teal-accent-v" x1="50" y1="25" x2="50" y2="82" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#2dd4bf" />
                <stop offset="100%" stopColor="#0f766e" />
              </linearGradient>

              <filter id="wl-pin-shadow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
              </filter>

              <clipPath id="wl-pin-inner-v">
                <path d="M 50 13 C 31 13, 16 28, 16 47 C 16 66, 35 83, 50 94 C 65 83, 84 66, 84 47 C 84 28, 69 13, 50 13 Z" />
              </clipPath>
            </defs>

            {/* Soft ground drop shadow under pin tip */}
            <ellipse
              cx="50"
              cy="108"
              rx="28"
              ry="4.5"
              fill="#0f172a"
              opacity="0.16"
              filter="url(#wl-pin-shadow)"
            />

            {/* 1. Outer Location Pin Outline */}
            <path
              d="M 50 5 C 27 5, 8 24, 8 47 C 8 70, 31 89, 50 102 C 69 89, 92 70, 92 47 C 92 24, 73 5, 50 5 Z"
              fill="url(#wl-teal-grad-v)"
            />

            {/* 2. Inner White Core Area */}
            <path
              d="M 50 13 C 31 13, 16 28, 16 47 C 16 66, 35 83, 50 94 C 65 83, 84 66, 84 47 C 84 28, 69 13, 50 13 Z"
              fill="#FFFFFF"
            />

            {/* 3. Buildings & Skyline (Clipped inside inner core) */}
            <g clipPath="url(#wl-pin-inner-v)">
              <rect x="23" y="52" width="16" height="30" rx="1" fill="#1e293b" />
              <rect x="26" y="56" width="3" height="3" rx="0.5" fill="#ffffff" />
              <rect x="33" y="56" width="3" height="3" rx="0.5" fill="#ffffff" />
              <rect x="26" y="62" width="3" height="3" rx="0.5" fill="#ffffff" />
              <rect x="33" y="62" width="3" height="3" rx="0.5" fill="#ffffff" />
              <rect x="26" y="68" width="3" height="3" rx="0.5" fill="#ffffff" />
              <rect x="33" y="68" width="3" height="3" rx="0.5" fill="#ffffff" />

              <rect x="61" y="54" width="16" height="28" rx="1" fill="#1e293b" />
              <rect x="64" y="58" width="3" height="3" rx="0.5" fill="#ffffff" />
              <rect x="71" y="58" width="3" height="3" rx="0.5" fill="#ffffff" />
              <rect x="64" y="64" width="3" height="3" rx="0.5" fill="#ffffff" />
              <rect x="71" y="64" width="3" height="3" rx="0.5" fill="#ffffff" />
              <rect x="64" y="70" width="3" height="3" rx="0.5" fill="#ffffff" />
              <rect x="71" y="70" width="3" height="3" rx="0.5" fill="#ffffff" />

              <path d="M 49 26 L 51 26 L 51 34 L 54 38 L 54 82 L 46 82 L 46 38 L 49 34 Z" fill="url(#wl-teal-accent-v)" />
              <line x1="50" y1="42" x2="50" y2="78" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="3 2" />
            </g>

            {/* 4. Connected Smart Citizen Network Nodes */}
            <g stroke="#0d9488" strokeWidth="2" strokeLinecap="round" fill="none">
              <path d="M 20 69 Q 34 83, 50 83 Q 66 83, 80 69" />
              <path d="M 28 75 Q 50 87, 72 75" stroke="#14b8a6" strokeWidth="1.5" />
            </g>
            <circle cx="20" cy="69" r="3" fill="#ffffff" stroke="#0d9488" strokeWidth="2" />
            <circle cx="34" cy="79" r="3" fill="#ffffff" stroke="#0d9488" strokeWidth="2" />
            <circle cx="66" cy="79" r="3" fill="#ffffff" stroke="#0d9488" strokeWidth="2" />
            <circle cx="80" cy="69" r="3" fill="#ffffff" stroke="#0d9488" strokeWidth="2" />

            {/* 5. Speech Bubble with Verified Checkmark */}
            <g transform="translate(62, 22)">
              <path
                d="M 12 0 C 18.6 0, 24 5.4, 24 12 C 24 18.6, 18.6 24, 12 24 C 9.5 24, 7.2 23.2, 5.3 21.9 L 0 24 L 2.1 19.1 C 0.8 17.1, 0 14.6, 0 12 C 0 5.4, 5.4 0, 12 0 Z"
                fill="#1e293b"
              />
              <path
                d="M 7.5 12 L 10.5 15 L 16.5 8.5"
                stroke="#ffffff"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </g>
          </svg>
        </div>

        {/* Typography */}
        <span
          className={`mt-5 text-3xl sm:text-4xl lg:text-[42px] font-black tracking-tight leading-none ${
            isDark ? 'text-white' : 'text-[#1e293b]'
          }`}
          style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
        >
          Warga Lapor
        </span>
        <span
          className={`mt-2 text-xs sm:text-sm font-extrabold tracking-[0.18em] uppercase ${
            isDark ? 'text-slate-400' : 'text-[#334155]'
          }`}
          style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
        >
          SMART CITIZEN REPORTING
        </span>
      </div>
    );
  }

  return (
    <svg
      viewBox={iconOnly ? "0 0 100 105" : "0 0 350 105"}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className || 'h-10 w-auto'}
      aria-label="WargaLapor — Smart Citizen Reporting"
    >
      <defs>
        {/* Teal gradient for pin and central smart tower */}
        <linearGradient id="wl-teal-grad" x1="10" y1="5" x2="90" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0d9488" />
          <stop offset="100%" stopColor="#14b8a6" />
        </linearGradient>

        <linearGradient id="wl-teal-accent" x1="50" y1="25" x2="50" y2="82" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2dd4bf" />
          <stop offset="100%" stopColor="#0f766e" />
        </linearGradient>

        {/* Clip path inside pin for skyline elements */}
        <clipPath id="wl-pin-inner">
          <path d="M 50 13 C 31 13, 16 28, 16 47 C 16 66, 35 83, 50 94 C 65 83, 84 66, 84 47 C 84 28, 69 13, 50 13 Z" />
        </clipPath>
      </defs>

      {/* Group: Location Pin & Smart City Graphic */}
      <g transform="translate(0, 0)">
        {/* 1. Outer Location Pin Outline */}
        <path
          d="M 50 5 C 27 5, 8 24, 8 47 C 8 70, 31 89, 50 102 C 69 89, 92 70, 92 47 C 92 24, 73 5, 50 5 Z"
          fill="url(#wl-teal-grad)"
        />

        {/* 2. Inner White Core Area */}
        <path
          d="M 50 13 C 31 13, 16 28, 16 47 C 16 66, 35 83, 50 94 C 65 83, 84 66, 84 47 C 84 28, 69 13, 50 13 Z"
          fill="#FFFFFF"
        />

        {/* 3. Buildings & Skyline (Clipped inside inner core) */}
        <g clipPath="url(#wl-pin-inner)">
          {/* Left Building (Dark Navy) */}
          <rect x="23" y="52" width="16" height="30" rx="1" fill="#1e293b" />
          {/* Windows on left building */}
          <rect x="26" y="56" width="3" height="3" rx="0.5" fill="#ffffff" />
          <rect x="33" y="56" width="3" height="3" rx="0.5" fill="#ffffff" />
          <rect x="26" y="62" width="3" height="3" rx="0.5" fill="#ffffff" />
          <rect x="33" y="62" width="3" height="3" rx="0.5" fill="#ffffff" />
          <rect x="26" y="68" width="3" height="3" rx="0.5" fill="#ffffff" />
          <rect x="33" y="68" width="3" height="3" rx="0.5" fill="#ffffff" />

          {/* Right Building (Dark Navy) */}
          <rect x="61" y="54" width="16" height="28" rx="1" fill="#1e293b" />
          {/* Windows on right building */}
          <rect x="64" y="58" width="3" height="3" rx="0.5" fill="#ffffff" />
          <rect x="71" y="58" width="3" height="3" rx="0.5" fill="#ffffff" />
          <rect x="64" y="64" width="3" height="3" rx="0.5" fill="#ffffff" />
          <rect x="71" y="64" width="3" height="3" rx="0.5" fill="#ffffff" />
          <rect x="64" y="70" width="3" height="3" rx="0.5" fill="#ffffff" />
          <rect x="71" y="70" width="3" height="3" rx="0.5" fill="#ffffff" />

          {/* Center Smart Tower (Taller Teal Building with Antenna) */}
          <path d="M 49 26 L 51 26 L 51 34 L 54 38 L 54 82 L 46 82 L 46 38 L 49 34 Z" fill="url(#wl-teal-accent)" />
          {/* Center Tower Windows / Pattern */}
          <line x1="50" y1="42" x2="50" y2="78" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="3 2" />
        </g>

        {/* 4. Connected Smart Citizen Network Nodes (Bottom Overlay) */}
        <g stroke="#0d9488" strokeWidth="2" strokeLinecap="round" fill="none">
          {/* Network Connection Lines */}
          <path d="M 20 69 Q 34 83, 50 83 Q 66 83, 80 69" />
          <path d="M 28 75 Q 50 87, 72 75" stroke="#14b8a6" strokeWidth="1.5" />
        </g>
        {/* Network Nodes (Circles) */}
        <circle cx="20" cy="69" r="3" fill="#ffffff" stroke="#0d9488" strokeWidth="2" />
        <circle cx="34" cy="79" r="3" fill="#ffffff" stroke="#0d9488" strokeWidth="2" />
        <circle cx="66" cy="79" r="3" fill="#ffffff" stroke="#0d9488" strokeWidth="2" />
        <circle cx="80" cy="69" r="3" fill="#ffffff" stroke="#0d9488" strokeWidth="2" />

        {/* 5. Speech Bubble with Verified Checkmark (Top-Right of pin) */}
        <g transform="translate(62, 22)">
          {/* Speech bubble badge */}
          <path
            d="M 12 0 C 18.6 0, 24 5.4, 24 12 C 24 18.6, 18.6 24, 12 24 C 9.5 24, 7.2 23.2, 5.3 21.9 L 0 24 L 2.1 19.1 C 0.8 17.1, 0 14.6, 0 12 C 0 5.4, 5.4 0, 12 0 Z"
            fill="#1e293b"
          />
          {/* White Checkmark */}
          <path
            d="M 7.5 12 L 10.5 15 L 16.5 8.5"
            stroke="#ffffff"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </g>
      </g>

      {/* Group: Typography Brand Name (Vector paths & SVG Text) */}
      {!iconOnly && (
        <g transform="translate(108, 0)">
          {/* "Warga Lapor" Main Title */}
          <text
            x="0"
            y="54"
            fill={isDark ? '#FFFFFF' : '#1e293b'}
            style={{
              fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
              fontWeight: 900,
              fontSize: '40px',
              letterSpacing: '-0.02em',
            }}
          >
            Warga Lapor
          </text>

          {/* "SMART CITIZEN REPORTING" Subtitle */}
          <text
            x="2"
            y="76"
            fill={isDark ? '#cbd5e1' : '#334155'}
            style={{
              fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
              fontWeight: 800,
              fontSize: '11.5px',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}
          >
            SMART CITIZEN REPORTING
          </text>
        </g>
      )}
    </svg>
  );
};
