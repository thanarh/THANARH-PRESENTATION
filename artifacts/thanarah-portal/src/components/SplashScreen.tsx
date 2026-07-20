/**
 * SplashScreen — Thanarah cinematic branded intro.
 *
 * Sequence:
 *   0.0 s – 0.8 s  : Logo + decorative rings scale/fade in.
 *   0.8 s – 1.6 s  : First Arabic line appears.
 *   1.6 s – 2.2 s  : Second Arabic line appears.
 *   2.2 s – 2.8 s  : Hold.
 *   2.8 s – 3.4 s  : Curtain split — top slides up, bottom slides down.
 */

import { useEffect } from 'react';

// ─── Timing ──────────────────────────────────────────────────────────────────
const LOGO_MS   = 800;
const TEXT1_MS  = 800;   // delay before first line
const TEXT2_MS  = 1600;  // delay before second line
const HOLD_MS   = 600;
const SPLIT_MS  = 600;
const TOTAL_MS  = TEXT2_MS + 400 + HOLD_MS + SPLIT_MS; // ≈ 3 400 ms

// ─── Brand colours ───────────────────────────────────────────────────────────
const BG        = '#F7F5F1';
const PRIMARY   = '#1E6B4D';
const DARK      = '#0F3D33';

// ─── Logo size ────────────────────────────────────────────────────────────────
const LOGO_W = 'clamp(160px, 38vw, 280px)';

// ─── Decorative orbit rings (pure CSS) ───────────────────────────────────────
function OrbitRings() {
  return (
    <div
      aria-hidden
      style={{
        position:   'absolute',
        inset:      0,
        display:    'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      {/* Ring 1 – slow rotate */}
      <div style={{
        position: 'absolute',
        width:  'clamp(260px, 55vw, 420px)',
        height: 'clamp(260px, 55vw, 420px)',
        borderRadius: '50%',
        border: `1px solid ${PRIMARY}22`,
        animation: `th-ring-in ${LOGO_MS}ms cubic-bezier(0.22,1,0.36,1) 0.2s both, th-ring-spin 18s linear infinite`,
      }} />
      {/* Ring 2 – counter-rotate, dashed */}
      <div style={{
        position: 'absolute',
        width:  'clamp(340px, 70vw, 540px)',
        height: 'clamp(340px, 70vw, 540px)',
        borderRadius: '50%',
        border: `1px dashed ${PRIMARY}18`,
        animation: `th-ring-in ${LOGO_MS}ms cubic-bezier(0.22,1,0.36,1) 0.35s both, th-ring-spin-rev 28s linear infinite`,
      }} />
      {/* Ring 3 – subtle outer */}
      <div style={{
        position: 'absolute',
        width:  'clamp(420px, 85vw, 660px)',
        height: 'clamp(420px, 85vw, 660px)',
        borderRadius: '50%',
        border: `1px solid ${PRIMARY}0d`,
        animation: `th-ring-in ${LOGO_MS}ms cubic-bezier(0.22,1,0.36,1) 0.5s both`,
      }} />
      {/* Small dot markers on ring 1 */}
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <div
          key={deg}
          style={{
            position: 'absolute',
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: PRIMARY,
            opacity: 0.35,
            // position on the ring
            transform: `rotate(${deg}deg) translateY(calc(clamp(130px, 27.5vw, 210px) * -1))`,
            animation: `th-ring-in ${LOGO_MS}ms cubic-bezier(0.22,1,0.36,1) 0.4s both`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Props ───────────────────────────────────────────────────────────────────
interface SplashScreenProps {
  onDone: () => void;
}

export function SplashScreen({ onDone }: SplashScreenProps) {
  useEffect(() => {
    const id = setTimeout(onDone, TOTAL_MS + 80);
    return () => clearTimeout(id);
  }, [onDone]);

  const splitDelay = `${(TEXT2_MS + 400 + HOLD_MS) / 1000}s`;

  const curtainBase: React.CSSProperties = {
    position:  'fixed',
    left: 0,
    right: 0,
    background: BG,
    overflow:  'hidden',
    zIndex:    9999,
    pointerEvents: 'none',
  };

  const logoWrapper = (isTop: boolean): React.CSSProperties => ({
    position:  'absolute',
    left:      '50%',
    top:       isTop ? '100%' : '0%',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
  });

  return (
    <>
      {/* ── Static layer (fades away when curtains move) ── */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: BG,
          zIndex: 9998,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 32,
          pointerEvents: 'none',
        }}
      >
        {/* Decorative rings */}
        <OrbitRings />

        {/* Logo */}
        <img
          src={`${import.meta.env.BASE_URL}logo-horizontal.png`}
          alt="Thanarah"
          draggable={false}
          style={{
            width: LOGO_W,
            height: 'auto',
            display: 'block',
            position: 'relative',
            zIndex: 1,
            userSelect: 'none',
            animation: `th-logo-reveal ${LOGO_MS}ms cubic-bezier(0.22,1,0.36,1) both`,
          }}
        />

        {/* Arabic tagline — line 1 */}
        <p
          dir="rtl"
          style={{
            fontFamily: "'Noto Naskh Arabic', 'Amiri', serif",
            color: DARK,
            fontSize: 'clamp(13px, 2.2vw, 18px)',
            fontWeight: 500,
            letterSpacing: '0.02em',
            opacity: 0,
            position: 'relative',
            zIndex: 1,
            animation: `th-text-in 600ms cubic-bezier(0.22,1,0.36,1) ${TEXT1_MS}ms forwards`,
          }}
        >
          حين تتكامل التقنية، تبدأ رعاية أفضل.
        </p>

        {/* Arabic tagline — line 2 */}
        <p
          dir="rtl"
          style={{
            fontFamily: "'Noto Naskh Arabic', 'Amiri', serif",
            color: PRIMARY,
            fontSize: 'clamp(15px, 2.8vw, 22px)',
            fontWeight: 700,
            letterSpacing: '0.04em',
            opacity: 0,
            position: 'relative',
            zIndex: 1,
            animation: `th-text-in 500ms cubic-bezier(0.22,1,0.36,1) ${TEXT2_MS}ms forwards`,
          }}
        >
          مرحباً بك في ثناره.
        </p>
      </div>

      {/* ── Top curtain ── */}
      <div
        style={{
          ...curtainBase,
          top:    0,
          height: '50vh',
          animation: `th-curtain-top ${SPLIT_MS}ms cubic-bezier(0.4,0,0.2,1) ${splitDelay} both`,
        }}
      >
        <div style={logoWrapper(true)}>
          <img
            src={`${import.meta.env.BASE_URL}logo-horizontal.png`}
            alt=""
            aria-hidden
            draggable={false}
            style={{ width: LOGO_W, height: 'auto', display: 'block', pointerEvents: 'none' }}
          />
        </div>
      </div>

      {/* ── Bottom curtain ── */}
      <div
        style={{
          ...curtainBase,
          top:    '50vh',
          bottom: 0,
          animation: `th-curtain-bottom ${SPLIT_MS}ms cubic-bezier(0.4,0,0.2,1) ${splitDelay} both`,
        }}
      >
        <div style={logoWrapper(false)}>
          <img
            src={`${import.meta.env.BASE_URL}logo-horizontal.png`}
            alt=""
            aria-hidden
            draggable={false}
            style={{ width: LOGO_W, height: 'auto', display: 'block', pointerEvents: 'none' }}
          />
        </div>
      </div>

      <style>{`
        @keyframes th-logo-reveal {
          from { opacity: 0; transform: scale(0.84); }
          to   { opacity: 1; transform: scale(1);    }
        }
        @keyframes th-ring-in {
          from { opacity: 0; transform: scale(0.7); }
          to   { opacity: 1; transform: scale(1);   }
        }
        @keyframes th-ring-spin {
          from { transform: rotate(0deg);   }
          to   { transform: rotate(360deg); }
        }
        @keyframes th-ring-spin-rev {
          from { transform: rotate(0deg);    }
          to   { transform: rotate(-360deg); }
        }
        @keyframes th-text-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes th-curtain-top {
          from { transform: translateY(0);    }
          to   { transform: translateY(-100%); }
        }
        @keyframes th-curtain-bottom {
          from { transform: translateY(0);   }
          to   { transform: translateY(100%); }
        }
      `}</style>
    </>
  );
}
