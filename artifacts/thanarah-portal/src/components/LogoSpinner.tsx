/**
 * LogoSpinner — icon rotating in the center of the screen.
 */

interface LogoSpinnerProps {
  size?: number;
  className?: string;
}

export function LogoSpinner({ size = 72, className = '' }: LogoSpinnerProps) {
  return (
    <div
      className={`flex items-center justify-center min-h-screen bg-background ${className}`}
    >
      <div style={{ position: 'relative', width: size, height: size }}>
        {/* Spinning ring */}
        <span
          style={{
            position: 'absolute',
            inset: -4,
            borderRadius: '50%',
            border: '2px solid transparent',
            borderTopColor: '#1E6B4D',
            borderRightColor: '#1E6B4D33',
            animation: 'th-spin 1s linear infinite',
          }}
        />
        {/* Logo icon — centered, no animation */}
        <img
          src={`${import.meta.env.BASE_URL}logo-icon.png`}
          alt="Loading…"
          width={size}
          height={size}
          style={{ display: 'block' }}
        />
      </div>
      <style>{`
        @keyframes th-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
