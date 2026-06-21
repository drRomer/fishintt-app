interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 64, className = "" }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      aria-label="Fishin't logo"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Círculo de prohibición rojo */}
      <circle cx="50" cy="50" r="44" stroke="#D42B2B" strokeWidth="6" />
      {/* Línea diagonal roja */}
      <line x1="20" y1="20" x2="80" y2="80" stroke="#D42B2B" strokeWidth="6" strokeLinecap="round" />
      
      {/* Pez negro */}
      <ellipse cx="55" cy="48" rx="22" ry="14" fill="#1A1A1A" />
      {/* Cola */}
      <path d="M33 48 L18 35 L18 61 Z" fill="#1A1A1A" />
      {/* Ojo blanco */}
      <circle cx="65" cy="44" r="2.5" fill="#FFFFFF" />
      
      {/* Anzuelo */}
      <path
        d="M72 28 L72 42 Q72 50 64 50 Q58 50 56 46"
        fill="none"
        stroke="#1A1A1A"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <line x1="68" y1="28" x2="76" y2="28" stroke="#1A1A1A" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}
