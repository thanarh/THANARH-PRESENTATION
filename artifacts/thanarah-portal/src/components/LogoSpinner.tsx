/**
 * LogoSpinner — the Thanarah icon rotating 360° as a loading indicator.
 * Used for full-page transitions and auth guards.
 */

interface LogoSpinnerProps {
  /** Size in pixels (default 64) */
  size?: number;
  /** Extra classes on the wrapper */
  className?: string;
}

export function LogoSpinner({ size = 64, className = '' }: LogoSpinnerProps) {
  return (
    <div
      className={`flex items-center justify-center min-h-screen bg-background ${className}`}
    >
      <img
        src={`${import.meta.env.BASE_URL}logo-icon.png`}
        alt="Loading…"
        width={size}
        height={size}
        style={{
          animation: 'logo-spin 1s linear infinite',
          display: 'block',
        }}
      />
      <style>{`
        @keyframes logo-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
