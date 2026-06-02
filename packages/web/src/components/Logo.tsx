interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  dark?: boolean;
}

export default function Logo({ className = '', iconOnly = false, dark = false }: LogoProps) {
  const textColor = dark ? 'text-white' : 'text-navy-900';
  const mutedColor = dark ? 'text-navy-300' : 'text-navy-400';

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Icon — Hexagon mark with stylized H + forward sweep */}
      <span className="relative w-9 h-10 flex-shrink-0">
        <svg viewBox="0 0 44 48" fill="none" className="w-full h-full">
          <defs>
            <linearGradient id="lg-bg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="lg-gld" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#c9952b" />
              <stop offset="70%" stopColor="#e7b433" />
              <stop offset="100%" stopColor="#f0d070" />
            </linearGradient>
          </defs>

          {/* Rounded hexagon */}
          <path d="M22 3L37 11C39.8 12.3 41.7 15 41.7 18V30C41.7 33 39.8 35.7 37 37L22 45C20.5 45.8 18.5 45.8 17 45L2 37C-0.8 35.7 -2.7 33 -2.7 30V18C-2.7 15 -0.8 12.3 2 11L17 3C18.5 2.2 20.5 2.2 22 3Z"
                fill="url(#lg-bg)" stroke="url(#lg-gld)" strokeWidth="1.3" />

          {/* H letterform */}
          <g stroke="url(#lg-gld)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="16" x2="12" y2="36" />
            <line x1="28" y1="16" x2="28" y2="36" />
            <line x1="12" y1="26" x2="28" y2="26" />
            <path d="M28 27C32 27 34 30 35 33" strokeWidth="2" opacity="0.7" />
          </g>

          {/* Accent dot */}
          <circle cx="35" cy="33" r="1.5" fill="url(#lg-gld)" />
        </svg>
      </span>

      {!iconOnly && (
        <span className="flex flex-col">
          <span className={`text-lg font-extrabold leading-tight tracking-tight ${textColor}`}>
            HiWay
          </span>
          <span className={`text-[10px] font-semibold tracking-[4px] leading-tight ${mutedColor}`}>
            SHUTTLE
          </span>
        </span>
      )}
    </span>
  );
}
