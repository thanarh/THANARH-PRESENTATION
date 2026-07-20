/**
 * LogoSpinner — Thanarah branded loading indicator.
 * A gentle pulse glow — not a rotation — so the icon reads cleanly.
 */

interface LogoSpinnerProps {
  size?: number;
  className?: string;
}

export function LogoSpinner({ size = 64, className = '' }: LogoSpinnerProps) {
  const ring = size * 1.8;

  return (
    <div
      className={`flex items-center justify-center min-h-screen bg-background ${className}`}
    >
      <div style={{ position: 'relative', width: size, height: size }}>
        {/* Outer pulsing ring */}
        <span
          style={{
            position: 'absolute',
            inset: -ring / 2 + size / 2,
            width: ring,
            height: ring,
            borderRadius: '50%',
            border: '1.5px solid #1E6B4D',
            opacity: 0,
            animation: 'th-ring-pulse 2s ease-out infinite',
          }}
        />
        {/* Inner pulsing ring, offset by half a cycle */}
        <span
          style={{
            position: 'absolute',
            inset: -ring / 2 + size / 2,
            width: ring,
            height: ring,
            borderRadius: '50%',
            border: '1px solid #1E6B4D',
            opacity: 0,
            animation: 'th-ring-pulse 2s ease-out 1s infinite',
          }}
        />
        {/* Logo icon — breathes gently, no spin */}
        <img
          src={`${import.meta.env.BASE_URL}logo-icon.png`}
          alt="Loading…"
          width={size}
          height={size}
          style={{
            display: 'block',
            animation: 'th-logo-breathe 2s ease-in-out infinite',
          }}
        />
      </div>
      <style>{`
        @keyframes th-logo-breathe {
          0%, 100% { opacity: 0.80; transform: scale(0.96); }
          50%       { opacity: 1;    transform: scale(1.04); }
        }
        @keyframes th-ring-pulse {
          0%   { transform: scale(0.6); opacity: 0.6; }
          80%  { transform: scale(1.4); opacity: 0;   }
          100% { transform: scale(1.4); opacity: 0;   }
        }
      `}</style>
    </div>
  );
}
