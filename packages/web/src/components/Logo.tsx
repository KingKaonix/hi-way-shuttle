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
      {/* Icon */}
      <span className="relative w-9 h-10 flex-shrink-0">
        <svg viewBox="0 0 44 48" fill="none" className="w-full h-full">
          <defs>
            <linearGradient id="logo-bg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1e3a5f" />
              <stop offset="100%" stopColor="#0a1628" />
            </linearGradient>
            <linearGradient id="logo-gld" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#e7b433" />
              <stop offset="100%" stopColor="#c9952b" />
            </linearGradient>
          </defs>
          <rect x="1" y="1" width="42" height="46" rx="10" fill="url(#logo-bg)" stroke="url(#logo-gld)" strokeWidth="1.5" />
          <path d="M12 16V36M12 26H22M22 16V36M32 16V36M32 26H22" stroke="url(#logo-gld)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M32 26Q35.5 26 37 29.5L40 33.5" stroke="#e7b433" strokeWidth="1.8" strokeLinecap="round" opacity="0.5" />
        </svg>
      </span>

      {!iconOnly && (
        <span className="flex flex-col">
          <span className={`text-lg font-extrabold leading-tight tracking-tight ${textColor}`}>
            Hi-Way
          </span>
          <span className={`text-[10px] font-semibold tracking-[2.5px] leading-tight ${mutedColor}`}>
            SHUTTLE
          </span>
        </span>
      )}
    </span>
  );
}
