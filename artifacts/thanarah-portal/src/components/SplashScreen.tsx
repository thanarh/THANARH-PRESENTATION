/**
 * SplashScreen — Thanarah branded intro animation.
 *
 * Sequence (~2.0 s total):
 *   0 s – 0.9 s  : Logo scales up from 88% + fades in.
 *   0.9 s – 1.5 s: Hold.
 *   1.5 s – 2.1 s: Curtain split — top half slides up, bottom slides down.
 */

import { useEffect } from 'react';

// ─── Timing ──────────────────────────────────────────────────────────────────
const REVEAL_MS = 900;
const HOLD_MS   = 600;
const SPLIT_MS  = 600;
const TOTAL_MS  = REVEAL_MS + HOLD_MS + SPLIT_MS; // 2 100 ms

// ─── Colour ──────────────────────────────────────────────────────────────────
const BG = 'hsl(40,20%,96%)';

// ─── Logo image (horizontal — icon + wordmark already assembled) ──────────────
//     Responsive: at most 320 px wide, scales down on small screens.
const LOGO_W = 'clamp(200px, 45vw, 320px)';

// The same logo block is duplicated inside each curtain so the split
// looks seamless.  Each panel clips its own half via overflow:hidden.
function LogoBlock() {
  return (
    <img
      src={`${import.meta.env.BASE_URL}logo-horizontal.png`}
      alt="Thanarah"
      draggable={false}
      style={{
        width: LOGO_W,
        height: 'auto',
        display: 'block',
        userSelect: 'none',
        pointerEvents: 'none',
        // Reveal animation — applied only in the static (pre-split) phase.
        // The curtain panels duplicate the logo at full opacity so they don't
        // inherit this animation after it has already run.
        animation: `th-logo-reveal ${REVEAL_MS}ms cubic-bezier(0.22,1,0.36,1) both`,
      }}
    />
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

  const splitDelay = `${(REVEAL_MS + HOLD_MS) / 1000}s`;

  // Shared curtain base style
  const curtainBase: React.CSSProperties = {
    position:  'fixed',
    left: 0,
    right: 0,
    background: BG,
    overflow:  'hidden',
    zIndex:    9999,
    pointerEvents: 'none',
  };

  // Logo wrapper inside a curtain panel — centred across the full viewport
  // height so the split lands exactly in the middle of the logo.
  //   Top panel (h = 50 vh):   logo centre ↔ panel bottom → top: 100%
  //   Bottom panel (top 50 vh): logo centre ↔ panel top   → top: 0%
  const logoWrapper = (isTop: boolean): React.CSSProperties => ({
    position:  'absolute',
    left:      '50%',
    top:       isTop ? '100%' : '0%',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
  });

  return (
    <>
      {/* ── Top curtain ── */}
      <div
        style={{
          ...curtainBase,
          top:    0,
          height: '50vh',
          animation: `th-curtain-top ${SPLIT_MS}ms cubic-bezier(0.4,0,0.2,1) ${splitDelay} both`,
        }}
      >
        {/* Logo at full opacity — no reveal animation inside curtain */}
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
        /* Logo fades in + scales up from 88% */
        @keyframes th-logo-reveal {
          from { opacity: 0; transform: scale(0.88); }
          to   { opacity: 1; transform: scale(1);    }
        }

        /* Top curtain slides up and off screen */
        @keyframes th-curtain-top {
          from { transform: translateY(0);    }
          to   { transform: translateY(-100%); }
        }

        /* Bottom curtain slides down and off screen */
        @keyframes th-curtain-bottom {
          from { transform: translateY(0);   }
          to   { transform: translateY(100%); }
        }
      `}</style>
    </>
  );
}
