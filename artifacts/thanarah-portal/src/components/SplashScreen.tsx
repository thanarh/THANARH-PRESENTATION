/**
 * SplashScreen — Thanarah branded intro animation.
 *
 * Sequence (total ~2.1 s):
 *   0 s – 0.95 s : Icon slides from right → left (its logo position) while
 *                  spinning 360°. Text ("ثناره" / "THANARAH") fades in from
 *                  the right simultaneously.
 *   0.95 s – 1.5 s: Logo fully assembled; brief hold.
 *   1.5 s – 2.1 s : Screen splits from centre — top half slides up, bottom
 *                   half slides down — revealing the app beneath.
 */

import { useEffect } from 'react';

// ─── Timing (ms) ─────────────────────────────────────────────────────────────
const MOVE_MS   = 950;   // icon slide + text reveal
const HOLD_MS   = 550;   // logo settled, hold
const SPLIT_MS  = 600;   // curtain split
const TOTAL_MS  = MOVE_MS + HOLD_MS + SPLIT_MS; // 2 100 ms

// ─── Layout ──────────────────────────────────────────────────────────────────
const ICON_PX   = 110;   // rendered icon size
const GAP_PX    = 22;    // gap between icon and text block
// Approximate half-width of the full assembled logo.
// Icon starts this many px to the right of its final position,
// which puts it roughly at the screen centre.
const ICON_OFFSET_PX = 145;

// App background (hsl 40 20% 96% → warm cream)
const BG = 'hsl(40,20%,96%)';
const INK = '#1A4D35';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const s = (ms: number) => `${ms / 1000}s`;

// The logo content rendered inside each curtain panel.
// `topHalf` flips the clip so the top panel shows only the top portion and
// the bottom panel shows only the bottom portion — achieved by positioning
// the logo relative to each panel's edge.
function LogoContent() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: GAP_PX,
        /* Force LTR so icon is always on the left regardless of app RTL setting */
        direction: 'ltr',
        position: 'relative',
      }}
    >
      {/* ── Spinning, sliding icon ── */}
      <img
        src={`${import.meta.env.BASE_URL}logo-icon.png`}
        alt=""
        aria-hidden="true"
        width={ICON_PX}
        height={ICON_PX}
        style={{
          flexShrink: 0,
          display: 'block',
          animation: `th-icon-slide ${s(MOVE_MS)} cubic-bezier(0.22,1,0.36,1) both`,
        }}
      />

      {/* ── Text block (fades + slides in from the right) ── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          animation: `th-text-reveal ${s(MOVE_MS * 0.65)} ease-out ${s(MOVE_MS * 0.28)} both`,
        }}
      >
        {/* Arabic wordmark */}
        <span
          style={{
            fontFamily: "'Cairo', sans-serif",
            fontSize: 54,
            fontWeight: 700,
            color: INK,
            lineHeight: 1.0,
            direction: 'rtl',
            display: 'block',
          }}
        >
          ثناره
        </span>
        {/* Latin subtitle */}
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: '0.28em',
            color: INK,
            marginTop: 4,
            display: 'block',
          }}
        >
          THANARAH
        </span>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
interface SplashScreenProps {
  onDone: () => void;
}

export function SplashScreen({ onDone }: SplashScreenProps) {
  useEffect(() => {
    const t = setTimeout(onDone, TOTAL_MS + 80);
    return () => clearTimeout(t);
  }, [onDone]);

  const splitDelay = s(MOVE_MS + HOLD_MS);

  // Shared style for a curtain panel's inner logo wrapper.
  // Each panel clips to its own half (overflow: hidden on the parent),
  // so we just need the logo centred relative to the full viewport height.
  // The logo is visually centred at viewport-centre (50 vh from top).
  // • Top panel (height 50 vh):   logo centre is at panel-bottom  → top: 100%
  // • Bottom panel (top @ 50 vh): logo centre is at panel-top     → top: 0%
  const logoWrapperStyle = (isTop: boolean): React.CSSProperties => ({
    position: 'absolute',
    left: '50%',
    top: isTop ? '100%' : '0%',
    transform: 'translate(-50%, -50%)',
    // Keep pointer events off
    pointerEvents: 'none',
  });

  const curtainBase: React.CSSProperties = {
    position: 'fixed',
    left: 0,
    right: 0,
    background: BG,
    overflow: 'hidden',
    zIndex: 9999,
    pointerEvents: 'none',
  };

  return (
    <>
      {/* ── Top curtain (slides upward) ── */}
      <div
        style={{
          ...curtainBase,
          top: 0,
          height: '50vh',
          animation: `th-curtain-top ${s(SPLIT_MS)} cubic-bezier(0.4,0,0.6,1) ${splitDelay} both`,
        }}
      >
        <div style={logoWrapperStyle(true)}>
          <LogoContent />
        </div>
      </div>

      {/* ── Bottom curtain (slides downward) ── */}
      <div
        style={{
          ...curtainBase,
          top: '50vh',
          bottom: 0,
          animation: `th-curtain-bottom ${s(SPLIT_MS)} cubic-bezier(0.4,0,0.6,1) ${splitDelay} both`,
        }}
      >
        <div style={logoWrapperStyle(false)}>
          <LogoContent />
        </div>
      </div>

      <style>{`
        /* Icon: slides from the right while rotating 360° */
        @keyframes th-icon-slide {
          from { transform: translateX(${ICON_OFFSET_PX}px) rotate(0deg); }
          to   { transform: translateX(0)                   rotate(360deg); }
        }

        /* Text block: fades + drifts in from the right */
        @keyframes th-text-reveal {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        /* Curtain top: slides the entire top panel upward */
        @keyframes th-curtain-top {
          from { transform: translateY(0); }
          to   { transform: translateY(-100%); }
        }

        /* Curtain bottom: slides the entire bottom panel downward */
        @keyframes th-curtain-bottom {
          from { transform: translateY(0); }
          to   { transform: translateY(100%); }
        }
      `}</style>
    </>
  );
}
